# 0G Matchwave

**AI-powered, bias-free job matching built on 0G Chain, Compute & Storage.**

A decentralized recruitment platform featuring AI-powered resume analysis, intelligent candidate-job matching, and verifiable skill credentials on the blockchain.

## Features

- **🤖 AI-Powered Resume Analysis**: Advanced skills extraction using OpenAI and 0G Compute
- **🎯 Intelligent Matching**: Adaptive algorithm that learns from successful hires
- **🔗 Decentralized Storage**: Resume and credential data stored on 0G Storage (mainnet)
- **⛓️ Blockchain Verification**: Smart contracts on 0G Chain (mainnet) for transparency
- **🆔 DID Verification**: Decentralized identity for candidates and recruiters
- **📜 NFT Credentials**: ERC-721 skill credentials as verifiable achievements
- **⭐ Reputation System**: On-chain recruiter ratings and feedback
- **💬 AskOG Chatbot**: AI assistant for recruiters and candidates

## Architecture

```
Frontend (Next.js) → API Routes → 0G Services → Smart Contracts (0G Chain)
                                    ↓
                              0G Storage (Files)
                              0G Compute (AI)
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Ethereum private key for 0G Chain mainnet
- 0G Chain mainnet OG tokens for gas fees
- OpenAI API key (optional, for enhanced skills extraction)

## Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd 0g-recruitment-dapp
npm install
```

2. **Install Hardhat and contract dependencies:**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
```

3. **Set up environment variables:**
```bash
cp env.example .env.local
# Edit .env.local with your private keys and configuration
```

## Smart Contract Deployment

All contracts are deployed to **0G Chain Mainnet** (Chain ID: 16661)

### Deployed Contract Addresses

| Contract | Address | Explorer |
|----------|---------|----------|
| **ResumeRegistry** | `0xFd84545E34762943E29Ab17f98815280c4a90Cb6` | [View](https://chainscan.0g.ai/address/0xFd84545E34762943E29Ab17f98815280c4a90Cb6) |
| **JobBoard** | `0xE23469d5aFb586B8c45D669958Ced489ee9Afb09` | [View](https://chainscan.0g.ai/address/0xE23469d5aFb586B8c45D669958Ced489ee9Afb09) |
| **RecruiterReputation** | `0xDbBA4f5A4b1D9aE51E533E3C212898169df69EAc` | [View](https://chainscan.0g.ai/address/0xDbBA4f5A4b1D9aE51E533E3C212898169df69EAc) |
| **SkillCredential** | `0xed401473e938714927392182ea5c8F65593946d8` | [View](https://chainscan.0g.ai/address/0xed401473e938714927392182ea5c8F65593946d8) |

### Deploy New Contracts

1. **Compile contracts:**
```bash
npx hardhat compile
```

2. **Deploy to 0G Chain Mainnet:**
```bash
npx hardhat run scripts/deploy.ts --network og-mainnet
```

3. **Update environment variables** with deployed contract addresses

## 0G Network Configuration

### 0G Chain Mainnet
- **RPC URL**: `https://evmrpc.0g.ai`
- **Chain ID**: `16661`
- **Explorer**: `https://chainscan.0g.ai`

### 0G Storage Mainnet
- **Indexer**: `https://indexer-storage-turbo.0g.ai`

### 0G Compute Testnet
- **RPC URL**: `https://evmrpc-testnet.0g.ai`
- **Broker URL**: `https://compute-galileo.0g.ai/`

## Development

1. **Start development server:**
```bash
npm run dev
```

2. **Access the dApp** at `http://localhost:3000` (or the port shown in terminal)

## Usage

### Candidate Flow
1. Connect wallet and set private key
2. Upload resume (PDF/Doc/Text)
3. Set preferences (roles, location, salary)
4. Get AI analysis and recommendations
5. Resume hash stored on-chain

### Recruiter Flow
1. Connect wallet and set private key
2. Create job posting with requirements
3. Set matching weights
4. Get ranked candidate matches
5. Match results stored on-chain

## Smart Contracts

### ResumeRegistry (`0xFd84545E34762943E29Ab17f98815280c4a90Cb6`)
- Stores resume hashes and storage URIs
- Accepts AI analysis results with signatures
- Verifies compute pipeline authenticity

### JobBoard (`0xE23469d5aFb586B8c45D669958Ced489ee9Afb09`)
- Manages job postings
- Stores candidate matches with scores
- Verifies matching results with signatures
- Supports multi-chain job posting

### RecruiterReputation (`0xDbBA4f5A4b1D9aE51E533E3C212898169df69EAc`)
- Tracks recruiter ratings and feedback
- Calculates average ratings on-chain
- Provides trust scores for recruiters

### SkillCredential (`0xed401473e938714927392182ea5c8F65593946d8`)
- ERC-721 NFT contract for skill credentials
- Mints verifiable skill achievements
- Links to credential metadata on 0G Storage

## Data Schemas

All data stored in 0G Storage follows standardized JSON schemas:
- `CandidateProfile.json` - Candidate preferences and skills
- `ResumeAnalysis.json` - AI analysis results
- `JobPosting.json` - Job requirements and weights
- `MatchReport.json` - Candidate-job matching results

## Security Features

- **ECDSA Signatures**: All AI results signed by compute pipeline
- **Hash Verification**: Resume hashes verified on-chain
- **PII Protection**: Personal data never stored on-chain
- **Access Control**: Owner-only functions for critical operations

## 0G Integration

### Storage
- Resume files uploaded to 0G Storage
- Analysis reports stored as JSON
- URIs referenced on-chain for verification

### Compute
- AI analysis runs on 0G Compute
- Job matching algorithm executed off-chain
- Results signed and submitted to contracts

## Testing

1. **Test smart contracts:**
```bash
npx hardhat test
```

2. **Test API endpoints:**
```bash
# Resume analysis
curl -X POST http://localhost:3000/api/analyze-resume \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"...","preferences":{...}}'

# Resume upload
curl -X POST http://localhost:3000/api/upload-resume \
  -H "x-private-key: test-key" \
  -F "file=@README.md"
```

## Production Deployment

### ✅ Contracts Deployed
All smart contracts are deployed to **0G Chain Mainnet** (Chain ID: 16661)
See [CONTRACT_ADDRESSES.md](./CONTRACT_ADDRESSES.md) for deployed addresses.

### ✅ Chatbot Deployed
Chatbot is deployed to **0G Compute Testnet** via 0G SDK
- Broker URL: `https://compute-galileo.0g.ai/`
- Service Name: `chatbot`

### Frontend Deployment
1. **Set environment variables** (see `.env.example`)
2. **Build production:**
   ```bash
   npm run build
   ```
3. **Deploy to hosting** (Vercel, Netlify, etc.)
4. **Configure environment variables** in hosting platform

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

## Documentation

- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete project documentation, architecture, and usage guide
- **[CONTRACT_ADDRESSES.md](./CONTRACT_ADDRESSES.md)** - Verified contract addresses and network information
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md)** - Latest deployment results and status

## Support

- **0G Documentation**: https://docs.0g.ai/
- **0G Chain Explorer**: https://chainscan.0g.ai
- **0G Storage**: https://indexer-storage-turbo.0g.ai
- **0G Compute**: https://compute-galileo.0g.ai/

## Roadmap

- [x] Multi-chain support (0G Chain, Polygon, Scroll)
- [x] Advanced AI models (OpenAI integration)
- [x] NFT Credentials (ERC-721)
- [x] Reputation System (On-chain ratings)
- [x] Chatbot (AskOG assistant)
- [ ] Mobile app
- [ ] Enterprise features
- [ ] Integration with job boards

## License

MIT License - see LICENSE file for details
