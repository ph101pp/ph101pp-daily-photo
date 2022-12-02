import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import * as dotenv from 'dotenv';
dotenv.config();

const gasGoerliGwei = 5;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.MAINNET_ALCHEMY_API_KEY}`,
        blockNumber: 16006577
      }
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_ALCHEMY_API_KEY}`,
      accounts: [`${process.env.GOERLI_PRIVATE_KEY}`],
      gasPrice: gasGoerliGwei * 1000000000
    }
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  },
  etherscan: {
    apiKey: {
      goerli: "5PYVC8HWZZKIM3XYFTM7BKA4C9DEJS8JDV",
    },
  }
};

export default config;
