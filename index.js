import * as line from '@line/bot-sdk'
import express from 'express'
import {
  handleSdkConnect,
  checkSdkConnect,
  handleSdkDisconnect,
  handleChangeNetwork,
  handleAddNetwork,
  handleSdkQuery,
  handleSdkTx,
} from './connections.js';

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
  handler: "/callback",
};

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  // baseURL: process.env.BASE_URL,
});

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.get('/connect', async (req,res) => {
  try {
    await handleSdkConnect();
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
  res.send('Hello');
});

app.post('/provider', (req, res) => {
  const provider = req.body.provider;
  console.log('Received provider:', provider);
  res.sendStatus(200);
});

// event handler
function handleEvent(event) {

  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }
    case 'follow':
      return replyText(event.replyToken, description);
    default:
      return 
  }
}

const description = `This is an example of a line bot for connecting to Metamask wallets and sending transactions.
            
Commands list: 
/Description - Show description
/Connect - Connect to a wallet
/MyWallet - Show connected wallet address
/Ethernum - Switch to Ethernum mainnet(Be careful)
/Klaytn Baobab - Switch to Klaytn Baobab(testnet)
/Balance - Query balance
/Pay - Send 10 coin to target address
/Disconnect - Disconnect from the wallet
`

function handleText(message, replyToken, source) {
  switch (message.text) {
    case 'Description':
      return replyText(replyToken, description)
    case 'Connect':
      return handleConnect(replyToken,source.userId);
    case 'Mywallet':
      return checkConnect(replyToken,source.userId);
    case 'Ethernum':
      return changeNetwork(replyToken,source.userId,"0x1");
    case 'Klaytn Baobab':
      return addNetwork(replyToken,source.userId);
    case 'Balance':
        return handleQuery(replyToken,source.userId);
    case 'Pay':
        return handleTx(replyToken,source.userId);  
    case 'Disconnect':
      return handleDisconnect(replyToken,source.userId);
    default:
      return replyText(replyToken, "please retry!");
  }
}

function handleConnect(replyToken,userId) {
  handleSdkConnect(userId).then((link) => {
    return replyText(replyToken, link);
  });
}

async function checkConnect(replyToken,userId) {
  const result = await checkSdkConnect(userId)
  return replyText(replyToken, result);
}

async function changeNetwork(replyToken,userId,networkId) {
  const result = await handleChangeNetwork(userId,networkId)
  return replyText(replyToken, result);
}

async function addNetwork(replyToken,userId) {
  const result = await handleAddNetwork(userId)
  return replyText(replyToken, result);
}

async function handleQuery(replyToken,userId) {
  const result = await handleSdkQuery(userId)
  return replyText(replyToken, result);
}

async function handleTx(replyToken,userId) {
  const result = await handleSdkTx(userId)
  return replyText(replyToken, result);
}

async function handleDisconnect(replyToken,userId) {
  const result = await handleSdkDisconnect(userId)
  return replyText(replyToken, result);
}
// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    {
      replyToken: token,
      messages: texts.map((text) => ({ type: 'text', text }))
    }
  );
};

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
