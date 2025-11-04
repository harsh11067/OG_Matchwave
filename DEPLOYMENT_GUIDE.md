# 🚀 0G Matchwave - Complete Deployment Guide

## Quick Start

### 1. Deploy Smart Contracts to 0G Chain Mainnet

```bash
# Compile contracts
npx hardhat compile

# Deploy (make sure PRIVATE_KEY is set in .env)
npx hardhat run scripts/deploy-contracts-mainnet.ts --network og_mainnet
```

**After deployment**, copy the contract addresses and update:
- `.env` file
- `CONTRACT_ADDRESSES.md`

### 2. Deploy Chatbot to 0G Compute Testnet

```bash
# Option 1: Use deployment script
node scripts/deploy-chatbot-testnet.js

# Option 2: Manual deployment
npx 0g deploy app/api/chatbot.ts --name chatbot --network testnet
```

### 3. Build Frontend

```bash
npm install
npm run build
```

### 4. Deploy Frontend

Deploy to Vercel, Netlify, or your preferred hosting:
- Set all environment variables in hosting platform
- Deploy the build output

---

## Detailed Deployment Steps

### Prerequisites

1. **Environment Variables** (`.env` file):
```env
# 0G Chain Mainnet
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=16600
PRIVATE_KEY=your_mainnet_private_key

# 0G Storage Mainnet
NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai

# 0G Compute Testnet
NEXT_PUBLIC_0G_COMPUTE_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_0G_COMPUTE_BROKER_URL=https://broker-testnet.0g.ai
COMPUTE_SIGNER_PRIVATE_KEY=your_compute_private_key

# OpenAI (optional)
OPENAI_API_KEY=your_openai_key

# Contract Addresses (update after deployment)
NEXT_PUBLIC_RESUME_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_JOB_BOARD_ADDRESS=0x...
NEXT_PUBLIC_RECRUITER_REPUTATION_ADDRESS=0x...
NEXT_PUBLIC_SKILL_CREDENTIAL_ADDRESS=0x...
```

2. **Install Dependencies**:
```bash
npm install
```

3. **0G CLI** (for chatbot deployment):
```bash
npm install -g @0glabs/0g-cli
# or use: npx @0glabs/0g-cli
```

---

## Contract Deployment

### Step 1: Compile Contracts

```bash
npx hardhat compile
```

### Step 2: Deploy to Mainnet

```bash
npx hardhat run scripts/deploy-contracts-mainnet.ts --network og_mainnet
```

**Expected Output**:
```
🚀 Deploying contracts to 0G Chain Mainnet...
Deploying with account: 0x...
Account balance: X OG

📄 Deploying ResumeRegistry...
✅ ResumeRegistry deployed to: 0x...

📋 Deploying JobBoard...
✅ JobBoard deployed to: 0x...

⭐ Deploying RecruiterReputation...
✅ RecruiterReputation deployed to: 0x...

🎓 Deploying SkillCredential...
✅ SkillCredential deployed to: 0x...

📝 Contract Addresses (0G Chain Mainnet):
==========================================
RESUME_REGISTRY_ADDRESS=0x...
JOB_BOARD_ADDRESS=0x...
RECRUITER_REPUTATION_ADDRESS=0x...
SKILL_CREDENTIAL_ADDRESS=0x...
==========================================
```

### Step 3: Verify Contracts (Optional)

```bash
# Verify on 0G Chain Explorer
npx hardhat verify --network og_mainnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Step 4: Update Environment Variables

Copy the deployed addresses to `.env` file.

---

## Chatbot Deployment

### Option 1: Automated Script

```bash
node scripts/deploy-chatbot-testnet.js
```

### Option 2: Manual Deployment

```bash
# Ensure chatbot code is ready
# Deploy using 0G CLI
npx 0g deploy app/api/chatbot.ts --name chatbot --network testnet
```

**Note**: Chatbot runs on 0G Compute Testnet for now (can migrate to mainnet later).

---

## Frontend Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard

### Deploy to Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy --prod`
3. Set environment variables in Netlify dashboard

### Deploy to Other Platforms

- **AWS Amplify**: Connect GitHub repo, set env vars
- **Railway**: Connect repo, configure env vars
- **Render**: Connect repo, set environment variables

---

## Post-Deployment Checklist

- [ ] Contracts deployed to 0G Chain Mainnet
- [ ] Contract addresses updated in `.env`
- [ ] Contract addresses documented in `CONTRACT_ADDRESSES.md`
- [ ] Chatbot deployed to 0G Compute Testnet
- [ ] Frontend built successfully
- [ ] Environment variables set in hosting platform
- [ ] Frontend deployed and accessible
- [ ] Test resume upload
- [ ] Test job posting
- [ ] Test candidate matching
- [ ] Test credential minting
- [ ] Verify all features working

---

## Troubleshooting

### Contract Deployment Fails

- Check `PRIVATE_KEY` is set in `.env`
- Ensure account has OG tokens for gas
- Verify network configuration in `hardhat.config.ts`

### Chatbot Deployment Fails

- Install 0G CLI: `npm install -g @0glabs/0g-cli`
- Check `COMPUTE_SIGNER_PRIVATE_KEY` is set
- Verify chatbot code compiles

### Frontend Build Fails

- Run `npm install` to ensure dependencies
- Check for TypeScript errors
- Verify all environment variables are set

---

## Network Information

### 0G Chain Mainnet
- **RPC**: `https://evmrpc.0g.ai`
- **Chain ID**: 16600
- **Explorer**: `https://chainscan.0g.ai`

### 0G Storage Mainnet
- **Indexer**: `https://indexer-storage-turbo.0g.ai`

### 0G Compute Testnet
- **RPC**: `https://evmrpc-testnet.0g.ai`
- **Broker**: `https://broker-testnet.0g.ai`

---

## Support

For issues or questions:
- Check `PROJECT_DOCUMENTATION.md` for detailed docs
- Review `CONTRACT_ADDRESSES.md` for contract info
- See `README.md` for general information

