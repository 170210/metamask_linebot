import { MetaMaskSDK } from '@metamask/sdk';
import qrcode from 'qrcode-terminal';
import { EventEmitter } from 'events';

const connectors = new Map();

export function handleSdkConnect(userId) {
  // todo check
  const eventEmitter = new EventEmitter();
  return new Promise((resolve) => {
    eventEmitter.on('linkGenerated', (link) => {
      resolve(link);
    });

    const options = {
      dappMetadata: {
        name: 'Test Wallet on LINE Bot',
        description: 'This is the Test Wallet on LINE Bot',
      },
      logging: {
        sdk: false,
      },
      checkInstallationImmediately: false,
      modals: {
        install: ({ link }) => {
//          const metamasklink=link.replace("https://metamask.app.link/", "metamask://");
          qrcode.generate(link, { small: true }, (qr) => console.log(qr));
          eventEmitter.emit('linkGenerated', link); 
        },
      },
    };
    const sdk = new MetaMaskSDK(options);
    sdk.connect();
    connectors.set(userId,sdk)
  });
}

export async function checkSdkConnect(userId) {
  const sdk = connectors.get(userId)
  if (sdk === undefined) {
    return "please connect first"
  } else {
    // todo not connect
    const accounts = await sdk.connect();
    return accounts  
  }
}

export async function handleAddNetwork(userId){
  const sdk = connectors.get(userId)
  if (sdk === undefined) {
    return "please connect first"
  } else {
    const provider = sdk.getProvider();
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x3e9',
            rpcUrls: ['https://public-en-baobab.klaytn.net'],
            chainName: 'Klaytn Baobab',
            nativeCurrency: { name: 'KLAY', decimals: 18, symbol: 'KLAY' },
            blockExplorerUrls: null,
          },
        ],
      });
    } catch (error) {
        return 'Unknown error, please retry!';
    }
    return "change network success"
  }
}

export async function handleChangeNetwork(userId, networkId) {
  const sdk = connectors.get(userId)
  if (sdk === undefined) {
    return "please connect first"
  } else {
    const provider = sdk.getProvider();
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: networkId,
          },
        ],
      });
    } catch (error) {
      if (error.code === -32603) {
        return 'Please add network firstly';
      } else {
        return 'Unknown error, please retry!';
      }
    }
    return "change network success"
  }
}

export async function handleSdkQuery(userId) {
  const sdk = connectors.get(userId)
  if (sdk === undefined) {
    return "please connect first"
  } else {
    const accounts = await sdk.connect();
    const provider = sdk.getProvider();
    const result=await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0],"latest"],
    });
    const balance = parseInt(result, 16);
    return `balance: ${balance}`
  }
}

export async function handleSdkTx(userId) {
  const sdk = connectors.get(userId)
  if (sdk === undefined) {
    return "please connect first"
  } else {
    const accounts = await sdk.connect();
    const provider = sdk.getProvider();
    try {
      const result=await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: "0x0c63E4d38540482D6CE48B0e2Cb3FEff6c0697E0",
          value: "0x8ac7230489e80000",
        }],
      });
    } catch (error) {
      if (error.code === 4001) {
        return 'Tx has been cancelled';
      } else {
        return 'Unknown error, please retry!';
      }
    }
    return `tx hash: ${result}`
  }
}

export async function handleSdkDisconnect(userId) {
  const sdk = connectors.get(userId)
  if (sdk === undefined) {
    return "please connect first"
  } else {
    sdk.terminate();
    connectors.delete(userId)
    return "Successfully disconnect"
  }
}