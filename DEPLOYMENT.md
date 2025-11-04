# 0G Matchwave Deployment Guide

## Environment Variables Setup

### Mainnet Configuration (0G Chain & Storage)
```env
# 0G Chain Mainnet (for blockchain transactions)
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=16600

# 0G Storage Mainnet
NEXT_PUBLIC_0G_STORAGE_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai

# 0G Compute Testnet (for AI analysis)
NEXT_PUBLIC_0G_COMPUTE_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_0G_COMPUTE_BROKER_URL=https://broker-testnet.0g.ai
COMPUTE_SIGNER_PRIVATE_KEY=your_compute_private_key_here

# Private Keys (NEVER commit these!)
PRIVATE_KEY=your_mainnet_private_key_here

# OpenAI (optional, for chatbot fallback)
OPENAI_API_KEY=your_openai_key_here

# Contract Addresses (after deployment)
NEXT_PUBLIC_JOB_BOARD_ADDRESS=0x...
NEXT_PUBLIC_RECRUITER_REPUTATION_ADDRESS=0x...
NEXT_PUBLIC_SKILL_CREDENTIAL_ADDRESS=0x...
```

## Deployment Steps

### 1. Deploy Smart Contracts to 0G Chain Mainnet
```bash
# Compile contracts
npx hardhat compile

# Deploy to 0G Chain Mainnet
npx hardhat run scripts/deploy.ts --network og-mainnet
```

### 2. Update Contract Addresses
Update `.env` with deployed contract addresses.

### 3. Deploy Chatbot to 0G Compute
```bash
# Deploy chatbot compute service
npx 0g deploy scripts/chatbot.js --name chatbot --network testnet
```

### 4. Build and Deploy Frontend
```bash
# Build Next.js app
npm run build

# Deploy to Vercel/Netlify/your hosting
# Make sure to set all environment variables in your hosting platform
```

## Network Configuration

- **0G Chain**: Mainnet (Chain ID: 16600)
- **0G Storage**: Mainnet (for credential/resume storage)
- **0G Compute**: Testnet (for AI analysis - can switch to mainnet later)

## Features Status

✅ **Working Features:**
- Resume analysis with 0G Compute (testnet)
- File upload to 0G Storage (mainnet)
- Candidate matching with adaptive weights
- DID creation and verification
- NFT credential minting
- Recruiter rating system
- Chatbot with multiple fallbacks

🔧 **Configuration:**
- Skills analysis extracts from PDF/DOCX
- Outcome URIs use real `zgs://` on mainnet
- Adaptive weights update after each hire
- Compare Match Rankings shows before/after

## Next Steps

1. ✅ Clear existing candidates (start fresh)
2. ✅ Integrate rate-recruiter after hire
3. ✅ Show DID verified badges
4. ✅ Use real zgs:// URIs
5. ✅ Enhanced skills extraction
6. ✅ Fixed Compare Match Rankings
7. ✅ Mainnet configuration ready

## Testing Checklist

- [ ] Upload resume → Check skills extraction
- [ ] Confirm hire → Check outcome URI is zgs://
- [ ] Rate recruiter → Check transaction
- [ ] Compare Match Rankings → Check before/after
- [ ] DID verification → Check badge appears
- [ ] Chatbot → Test all fallbacks

