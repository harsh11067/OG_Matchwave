import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

if (!PRIVATE_KEY) {
  console.warn("⚠️  Please set your PRIVATE_KEY in the .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true
    }
  },
  networks: {
    og_testnet: {
      url: process.env.NEXT_PUBLIC_0G_RPC_URL || "https://evmrpc-testnet.0g.ai/",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 16602
    },
    "og-testnet-galileo": {
      url: "https://evmrpc-testnet.0g.ai/",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 16602
    },
    og_mainnet: {
      url: process.env.NEXT_PUBLIC_0G_RPC_URL_MAINNET || "https://evmrpc.0g.ai",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 16661
    },
    "og-mainnet": {
      url: process.env.NEXT_PUBLIC_0G_RPC_URL_MAINNET || "https://evmrpc.0g.ai",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 16661
    }
  }
};

export default config;
