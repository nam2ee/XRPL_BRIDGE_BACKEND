const express = require('express');
const xrpl = require("xrpl");
const { decodeAccountID, encodeAccountID } = require("ripple-address-codec");
const ethersWallet = require("@ethersproject/wallet");
const ethersProvider = require("@ethersproject/providers");
const { BridgeDoorNative__factory } = require("@peersyst/xrp-evm-contracts");
const ethers = require("ethers");
const gem_functions = require("@gemwallet/api");
const { type } = require('express/lib/response');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.set('view engine', 'ejs');
const port = 3000; // 원하는 포트 번호로 변경 가능

async function main()
{
    const ethersClient = new ethersProvider.JsonRpcProvider("https://rpc-evm-sidechain.xrpl.org");

    const evmWallet = new ethersWallet.Wallet(
    "0x" + "263abeef229ebdf080999ac9130efd6f30dfee67018f14430f0866dd1979d583",
    ethersClient
    );

    const bridgeAddress = "0x0FCCFB556B4aA1B44F31220AcDC8007D46514f31";
  console.log("EVM Address:");
  console.log(evmWallet.address);
  const lockingClient = new xrpl.Client('wss://s.devnet.rippletest.net:51233',)

  await lockingClient.connect()
  const lockingChainDoor = 'rayv9pKSvSuWaEU5gJiQRqsLXP5XBV1n5Y'

  const accountObjectsRequest = {
    command: 'account_objects',
    account: lockingChainDoor,
    type: 'bridge',
  }

  const bridgeData = await lockingClient.request(accountObjectsRequest)
  const bridge = bridgeData.result.account_objects[0].XChainBridge
  const bridgeDataSignatureReward = bridgeData.result.account_objects[0].SignatureReward
  const bridgeDataMin = bridgeData.result.account_objects[0].MinAccountCreateAmount
  console.log("Bridge signature reweard:")
  console.log(bridgeDataSignatureReward)
  console.log("Bridge account min:")
  console.log(bridgeDataMin)  
  console.log("Bridge data:")
  console.log(bridge) 


  let wallet1 = await lockingClient.fundWallet()
  console.log(wallet1)
  console.log(wallet1.wallet.seed)
  console.log(typeof(wallet1.seed)  )
  wallet1 = await xrpl.Wallet.fromSeed(wallet1.wallet.seed)
  //const wallet1 = await xrpl.Wallet.fromSeed("sEdVTgjMc2Zae822Q66bwvCXAs5N9JY") 

  
  console.log("Wallet1:")
  console.log(wallet1) 

  const xrplAccountToEvmAddress = (account) => {
    const accountId = decodeAccountID(account);
    return `0x${accountId.toString("hex")}`;
  };  

  // Convert EVM address to XRPL address
  const evmAddressToXrplAccount = (address) => {
    const accountId = Buffer.from(address.slice(2), "hex")
    return encodeAccountID(accountId)
  };  


  console.log("EVM address representation: " + evmAddressToXrplAccount(evmWallet.address))  

  const fundTx = {
    TransactionType: 'XChainAccountCreateCommit',
    Account: wallet1.classicAddress,
    XChainBridge: bridge,
    SignatureReward: bridgeDataSignatureReward,
    Destination: evmAddressToXrplAccount(evmWallet.address),
    Amount: xrpl.xrpToDrops(10),
  }  

  const fundResponse = await lockingClient.submitAndWait(fundTx, {
    wallet: wallet1,
  })
  console.log("Tx XChainAccountCreateCommit:")
  console.log(fundResponse)

    //const evmbridge = new BridgeDoorNative__factory(evmWallet);
    const bridgeContract = BridgeDoorNative__factory.connect(bridgeAddress, ethersClient);  



  
 //const evmbridge = new BridgeDoorNative__factory(evmWallet);


 const contractTransaction = await bridgeContract.connect(evmWallet).createClaimId(xrplAccountToEvmAddress(wallet1.address), {
     value: (ethers.utils.parseEther(xrpl.dropsToXrp(bridgeDataSignatureReward),'ether')),
     gasLimit: 140_000,
 });



 const transaction = await contractTransaction.wait();
 const event = transaction.events?.find((event) => event.event === "CreateClaim");
 const [claimID] = event?.args || [];
 const claimIDNumber = claimID.toNumber();

 console.log(`Claim ID for the transfer: ${claimIDNumber}`)    

 console.log('Step 2: Locking the funds on the locking chain...')

 const commitTx = {
   TransactionType: 'XChainCommit',
   Account: wallet1.classicAddress,
   Amount: xrpl.xrpToDrops(8000),
   XChainBridge: bridge,
   XChainClaimID: claimIDNumber,
   OtherChainDestination: evmAddressToXrplAccount(evmWallet.address),
 }

 const commitResult = await lockingClient.submitAndWait(commitTx, {
   wallet: wallet1,
 })

 lockingClient.disconnect()
 
  

}

async function main2()
{
    for(var i=0; i<10000000000; i++)
    {
        console.log("i: " + i);
        await main();
    }
}

main2();