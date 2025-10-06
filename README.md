# 0G Recruitment dApp

A decentralized recruitment platform built on 0G Storage and Compute, featuring AI-powered resume analysis and job matching.

## Features

- **Resume Analysis**: AI-powered resume parsing and scoring
- **Job Matching**: Intelligent candidate-job matching algorithm
- **Privacy-First**: PII stored off-chain, only hashes on-chain
- **0G Integration**: Uses 0G Storage for files and 0G Compute for AI
- **Smart Contracts**: EVM contracts for transparency and verification

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
- Ethereum private key for 0G testnet
- 0G testnet OG tokens for gas fees

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

1. **Compile contracts:**
```bash
npx hardhat compile
```

2. **Deploy to 0G testnet:**
```bash
npx hardhat run scripts/deploy.ts --network og_testnet
```

3. **Update environment variables** with deployed contract addresses

## 0G Network Configuration

- **RPC URL**: `https://evmrpc-testnet.0g.ai/`
- **Storage Indexer**: `https://indexer-storage-testnet-turbo.0g.ai`
- **Chain ID**: 16600 (verify with network)

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

### ResumeRegistry
- Stores resume hashes and storage URIs
- Accepts AI analysis results with signatures
- Verifies compute pipeline authenticity

### JobBoard
- Manages job postings
- Stores candidate matches with scores
- Verifies matching results with signatures

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

1. **Deploy contracts to mainnet**
2. **Set up 0G Compute pipeline**
3. **Configure production 0G Storage**
4. **Update environment variables**
5. **Deploy frontend to hosting service**

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

- 0G Documentation: https://docs.0g.ai/
- 0G Discord: [Join 0G Community]
- Issues: [GitHub Issues]

## Roadmap

- [ ] Multi-chain support
- [ ] Advanced AI models
- [ ] Mobile app
- [ ] Enterprise features
- [ ] Integration with job boards
