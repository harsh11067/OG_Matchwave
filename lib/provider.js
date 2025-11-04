// lib/provider.js
import { ethers } from "ethers";

export const CHAINS = {
  16602: { name: "Galileo", rpc: process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai/' },
  137:   { name: "Polygon", rpc: "https://polygon-rpc.com/" },
  534352: { name: "Scroll", rpc: "https://sepolia-rpc.scroll.io/" }
};

export function getProvider(chainId) {
  const c = CHAINS[chainId];
  if (!c) throw new Error(`Unknown chainId: ${chainId}`);
  return new ethers.JsonRpcProvider(c.rpc);
}

export function getSignerForChain(chainId) {
  const provider = getProvider(chainId);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not set in environment variables');
  }
  const wallet = new ethers.Wallet(privateKey);
  return wallet.connect(provider);
}
