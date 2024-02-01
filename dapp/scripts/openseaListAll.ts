import 'dotenv/config'
import { ethers } from 'ethers6';
import { Chain, OpenSeaSDK } from 'opensea-js';


const PRIVATE_KEY = process.env.ETHEREUM_TREASURY_PRIVATE_KEY!;
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY!;
const OPENSEA_LIST_PRICE_ETH = process.env.OPENSEA_LIST_PRICE_ETH!;
const NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS!;

const alchemyProvider = new ethers.AlchemyProvider("mainnet", process.env.MAINNET_ALCHEMY_API_KEY);

const walletWithProvider = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);

const openseaSDK = new OpenSeaSDK(walletWithProvider, {
  chain: Chain.Mainnet,
  apiKey: OPENSEA_API_KEY,
});

listNFTs();

async function listNFTs() {
  for (let i = 3; i < 515; i++) {
    try {
      const listing = await openseaSDK.createListing({
        asset: {
          tokenId: String(i),
          tokenAddress: NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS,
        },
        accountAddress: walletWithProvider.address,
        startAmount: parseFloat(OPENSEA_LIST_PRICE_ETH),
        expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * 24 * 182),
      });
      console.log(i, 515)
    }
    catch (e) {
      console.log(e)
    }
  }
}

