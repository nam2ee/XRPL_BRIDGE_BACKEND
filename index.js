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
    "0x" + "03ecea4798504ce8ec1bf4d97906d4dac6b4ce7dfa37ff86f2bb43bc251087b9",
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

  const wallet1 = await xrpl.Wallet.fromSeed("sEdVTgjMc2Zae822Q66bwvCXAs5N9JY") 

  
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
    Amount: xrpl.xrpToDrops(100),
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
   Amount: xrpl.xrpToDrops(5),
   XChainBridge: bridge,
   XChainClaimID: claimIDNumber,
   OtherChainDestination: evmAddressToXrplAccount(evmWallet.address),
 }

 const commitResult = await lockingClient.submitAndWait(commitTx, {
   wallet: wallet1,
 })

 console.log("Commit result")
 console.log(commitResult)   
 lockingClient.disconnect()
 
  

}
//8********************************************************************************************************************
const xrplAccountToEvmAddress = (account) => {
    const accountId = decodeAccountID(account);
    return `0x${accountId.toString("hex")}`;
  };  

  // Convert EVM address to XRPL address
const evmAddressToXrplAccount = (address) => {
    const accountId = Buffer.from(address.slice(2), "hex")
    return encodeAccountID(accountId)
  };  


const editfundTx = (address)=>{
    return  {
        TransactionType: 'XChainAccountCreateCommit',
        Account: address,
        XChainBridge: bridge,
        SignatureReward: bridgeDataSignatureReward,
        Destination: Destination,
        Amount: (
          parseInt(bridgeDataMin, 10) * 2
        ).toString(),
      }  
}

 const bridgeAddress = "0x0FCCFB556B4aA1B44F31220AcDC8007D46514f31";
 const ethersClient = new ethersProvider.JsonRpcProvider("https://rpc-evm-sidechain.xrpl.org");
 const evmWallet = new ethersWallet.Wallet("0x9d525ebf16d0a879ecc311ff563da1db5be8655d39928c1b816ea47dd367b7dd",ethersClient);
 const lockingClient = new xrpl.Client('wss://s.devnet.rippletest.net:51233',)
 const lockingChainDoor = 'rayv9pKSvSuWaEU5gJiQRqsLXP5XBV1n5Y'

 const accountObjectsRequest = {
    command: 'account_objects',
    account: lockingChainDoor,
    type: 'bridge',
  }


app.get('/api', async(req, res) => {
    await lockingClient.connect()
    
    const bridgeData = await lockingClient.request(accountObjectsRequest)
    const bridge = bridgeData.result.account_objects[0].XChainBridge
    const bridgeDataSignatureReward = bridgeData.result.account_objects[0].SignatureReward
    const bridgeDataMin = bridgeData.result.account_objects[0].MinAccountCreateAmount
    console.log("Bridge signature reweard:")
    console.log(bridge)
    const Destination = evmAddressToXrplAccount(evmWallet.address)

    let fundTx_1 = {
        TransactionType: 'XChainAccountCreateCommit',
        Account: null,
        XChainBridge: bridge,
        SignatureReward: bridgeDataSignatureReward,
        Destination: evmAddressToXrplAccount(evmWallet.address),
        Amount: xrpl.xrpToDrops(100),
      }  
  
    await console.log("Connected!")
    res.json(fundTx_1)
      
    
});

app.post('/api', async(req, res) => {
  await console.log(req.body)
  await lockingClient.connect()
  const wallet1 = await xrpl.Wallet.fromSeed("sEdVTgjMc2Zae822Q66bwvCXAs5N9JY") 
  const bridgeData = await lockingClient.request(accountObjectsRequest)
  const bridge = bridgeData.result.account_objects[0].XChainBridge
  const bridgeDataSignatureReward = bridgeData.result.account_objects[0].SignatureReward
  const bridgeDataMin = bridgeData.result.account_objects[0].MinAccountCreateAmount
  const Destination = req.body.address

  //let fundTx_1 = await {
  //  TransactionType: 'XChainAccountCreateCommit',
  //  Account: 'rpw7nEyJ3TA7tjmygwpNgjxfuZZ4VKqdEJ', //우리 첫번째 계정
  //  XChainBridge: bridge,
  //  SignatureReward: bridgeDataSignatureReward,
  //  Destination: evmAddressToXrplAccount(Destination),
  //  Amount: ( parseInt(bridgeDataMin, 10) * 2
  //  ).toString(),
  //}  
//
  //const fundResponse = await lockingClient.submitAndWait(fundTx_1, {
  //  wallet: wallet1,
  //})
      //const evmbridge = new BridgeDoorNative__factory(evmWallet);
  const bridgeContract = BridgeDoorNative__factory.connect(bridgeAddress, ethersClient);  
     
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
   Amount: xrpl.xrpToDrops(5),
   XChainBridge: bridge,
   XChainClaimID: claimIDNumber,
   OtherChainDestination: evmAddressToXrplAccount(Destination),
  }

  const commitResult = await lockingClient.submitAndWait(commitTx, {
   wallet: wallet1,
  })

 console.log("Commit result") 
  console.log(commitResult)
})
;

app.get('/',(req,res)=>{
  res.render('index', { message: 'Hello from the server!' });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });