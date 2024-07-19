import * as line from '@line/bot-sdk'
import express from 'express'
import {
  handleSdkConnect,
  checkSdkConnect,
  handleSdkDisconnect,
  handleChangeNetwork,
  handleSdkQuery,
  handleSdkTx,
} from './connections.js';
// import dotenv from 'dotenv';
// dotenv.config();

// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
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

app.get('/hello', async (req,res) => {
  res.send('Hello');
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
    case 'postback':
      const data = event.postback.data;
      // switch (data) {
      //   case 'dapp':
      //   default:
      return changeNetwork(event.replyToken, event.source.userId, data);
      // }
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

async function changeNetwork(replyToken,userId, blockchainName) {
  const result = await handleChangeNetwork(userId, blockchainName)
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

const quickReplyMenu={
  items:
    [{
      type: "action",
      action: {
        type: "postback",
        label: "Ethernum",
        data: "Ethernum"
      }
    },
    {
      type: "action",
      action: {
        type: "postback",
        label: "Klaytn",
        data: "Klaytn"
      }
    },
    {
      type: "action",
      action: {
        type: "postback",
        label: "Klaytn Baobab",
        data: "Klaytn Baobab"
      }
    }
  ]
}
// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  const messages = texts.map((text) => ({ type: 'text', text }))
  messages[messages.length - 1].quickReply = quickReplyMenu;
  return client.replyMessage(
      {
        replyToken: token,
        messages: messages,
      }
    );
};

export const replyConfriming = (userId) =>{
  client.pushMessage(
    { 
      to: userId,
      messages: [
        {
          type: "template",
          altText: 'Buttons alt text',
          template: {
            type: "buttons",
            text: "Please confirm in the wallet",
              actions: [
                {label: "Metamask", type : "uri", uri: "https://170210.github.io/deeplink/"}
              ]
          },
          quickReply: quickReplyMenu
        },
      ],
    },
  )
}

process.chdir('./tmp');
// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
