import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import * as dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_ALCHEMY_API_KEY}`,
      accounts: [`${process.env.GOERLI_PRIVATE_KEY}`]
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
