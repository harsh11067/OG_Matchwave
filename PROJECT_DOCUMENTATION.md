# 0G Matchwave - Complete Project Documentation

## 🎯 Project Overview

**0G Matchwave** is an AI-powered, bias-free job matching platform built on 0G Chain, Compute & Storage. It revolutionizes recruitment by leveraging decentralized infrastructure to provide transparent, fair, and efficient candidate-job matching.

### Key Features

- **🤖 AI-Powered Resume Analysis**: Advanced skills extraction using OpenAI and 0G Compute
- **🔗 Decentralized Storage**: Resume and credential data stored on 0G Storage (mainnet)
- **⛓️ Blockchain Verification**: Smart contracts on 0G Chain (mainnet) for transparency
- **🎯 Intelligent Matching**: Adaptive algorithm that learns from successful hires
- **🆔 DID Verification**: Decentralized identity for candidates and recruiters
- **📜 NFT Credentials**: ERC-721 skill credentials as verifiable achievements
- **⭐ Reputation System**: On-chain recruiter ratings and feedback

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Candidate   │  │  Recruiter   │  │  Dashboard   │      │
│  │    Flow      │  │    Flow      │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Routes (Next.js API)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /analyze-    │  │ /match-      │  │ /chatbot     │      │
│  │  resume      │  │  candidates  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  0G Compute  │ │ 0G Storage   │ │ 0G Chain     │
│  (Testnet)   │ │ (Mainnet)    │ │ (Mainnet)    │
│              │ │              │ │              │
│ • AI Analysis│ │ • Resume     │ │ • Smart      │
│ • Matching   │ │   Files      │ │   Contracts  │
│ • Chatbot    │ │ • Credentials│ │ • Verification│
└──────────────┘ └──────────────┘ └──────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **State Management**: Zustand
- **3D Graphics**: Spline
- **Blockchain**: Ethers.js v6

#### Backend
- **API**: Next.js API Routes
- **File Processing**: pdf-parse, mammoth
- **AI**: OpenAI API (GPT-4o-mini)

#### Blockchain & Infrastructure
- **Chain**: 0G Chain (Mainnet - Chain ID: 16600)
- **Storage**: 0G Storage (Mainnet)
- **Compute**: 0G Compute (Testnet)
- **Smart Contracts**: Solidity 0.8.24, OpenZeppelin v5

---

## 📋 Smart Contracts

### Contract Addresses (0G Chain Mainnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **ResumeRegistry** | `0x...` | Stores resume hashes and storage URIs |
| **JobBoard** | `0x...` | Manages job postings and candidate matches |
| **RecruiterReputation** | `0x...` | Tracks recruiter ratings and feedback |
| **SkillCredential** | `0x...` | ERC-721 NFTs for skill credentials |

> **Note**: Update addresses in `CONTRACT_ADDRESSES.md` after deployment

### Contract Functions

#### ResumeRegistry
```solidity
function uploadResume(bytes32 resumeHash, string storageURI) external
function getResume(address candidate) external view returns (ResumeInfo)
```

#### JobBoard
```solidity
function postJob(Job memory job) external returns (uint256)
function getJob(uint256 jobId) external view returns (Job memory)
function confirmHire(uint256 jobId, address candidate, bool hired, string outcomeURI) external
```

#### RecruiterReputation
```solidity
function rateRecruiter(address recruiter, uint8 score) external
function getAvgRating(address recruiter) external view returns (uint256)
```

#### SkillCredential
```solidity
function mintCredential(address to, string memory credentialURI) external returns (uint256)
function tokenURI(uint256 tokenId) external view returns (string)
```

---

## 🚀 Deployment Guide

### Prerequisites

1. **Node.js** 18+ installed
2. **0G Chain Mainnet** account with OG tokens for gas
3. **0G Compute Testnet** account for chatbot
4. **Private Keys** (NEVER commit to git)
5. **OpenAI API Key** (optional, for enhanced skills extraction)

### Step 1: Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# 0G Chain Mainnet
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=16600
NEXT_PUBLIC_0G_EXPLORER=https://chainscan.0g.ai

# 0G Storage Mainnet
NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai

# 0G Compute Testnet
NEXT_PUBLIC_0G_COMPUTE_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_0G_COMPUTE_BROKER_URL=https://broker-testnet.0g.ai
COMPUTE_SIGNER_PRIVATE_KEY=your_compute_private_key

# Private Keys
PRIVATE_KEY=your_mainnet_private_key

# OpenAI (optional)
OPENAI_API_KEY=your_openai_key

# Contract Addresses (update after deployment)
NEXT_PUBLIC_RESUME_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_JOB_BOARD_ADDRESS=0x...
NEXT_PUBLIC_RECRUITER_REPUTATION_ADDRESS=0x...
NEXT_PUBLIC_SKILL_CREDENTIAL_ADDRESS=0x...
```

### Step 2: Deploy Smart Contracts to 0G Chain Mainnet

```bash
# Compile contracts
npx hardhat compile

# Deploy to mainnet
npx hardhat run scripts/deploy-contracts-mainnet.ts --network og_mainnet
```

**Output**: Contract addresses will be displayed. Update `.env` file.

### Step 3: Deploy Chatbot to 0G Compute Testnet

```bash
# Deploy chatbot
node scripts/deploy-chatbot-testnet.js
```

Or manually:
```bash
npx 0g deploy app/api/chatbot.ts --name chatbot --network testnet
```

### Step 4: Build and Deploy Frontend

```bash
# Install dependencies
npm install

# Build production
npm run build

# Deploy to Vercel/Netlify/etc
# Make sure to set all environment variables in your hosting platform
```

---

## 📖 How to Use

### For Candidates

1. **Upload Resume**
   - Go to Candidate Flow
   - Upload PDF/DOCX resume
   - Set preferences (roles, location, salary range)
   - Get AI analysis with identified skills

2. **View Analysis**
   - See overall score
   - Review identified skills
   - Check market demand
   - Get recommendations

3. **Create DID**
   - Connect MetaMask wallet
   - Click "Create DID"
   - Sign message to verify identity
   - Get DID verified badge

### For Recruiters

1. **Post Job**
   - Go to Recruiter Flow
   - Fill job details (title, description, requirements)
   - Set salary range and location
   - Select blockchain network (0G Chain, Polygon, Scroll)
   - Post job to blockchain

2. **Match Candidates**
   - Click "Find Matches"
   - View ranked candidates by match score
   - See breakdown (skills, location, salary, education, experience)
   - View full candidate profile

3. **Mint Credential**
   - Select candidate
   - Click "Mint Credential"
   - Credential metadata uploaded to 0G Storage
   - ERC-721 NFT minted on-chain
   - Candidate receives verifiable credential

4. **Confirm Hire**
   - Click "Confirm Hire"
   - Outcome stored on-chain
   - Adaptive weights updated
   - Rating system updated

---

## 🔧 API Endpoints

### Resume Analysis
```bash
POST /api/analyze-resume
Body: {
  "fileB64": "base64_encoded_file",
  "fileName": "resume.pdf",
  "resumeText": "optional text",
  "preferences": {...}
}
```

### Match Candidates
```bash
POST /api/match-candidates
Body: {
  "job": {...},
  "candidates": [...]
}
```

### Chatbot
```bash
POST /api/chatbot
Body: {
  "message": "Find candidates with Python skills",
  "role": "recruiter"
}
```

### Upload Credential
```bash
POST /api/upload-credential
Body: {
  "credential": {...},
  "privateKey": "..."
}
```

### Mint Credential
```bash
POST /api/mint-credential
Body: {
  "candidate": {...},
  "credentialData": {...},
  "privateKey": "..."
}
```

---

## 🎨 UI Components

### Dashboard
- Overview statistics
- Recent candidates
- Recent job postings
- Adaptive weights panel
- Match comparison view

### Candidate Flow
- Resume upload (drag & drop)
- Preferences form
- Analysis results display
- Skills visualization
- Recommendations

### Recruiter Flow
- Job posting form
- Multi-chain selector
- Matching results table
- Candidate profile viewer
- Credential minting

### AskOG Widget
- Floating AI assistant
- Expandable chat interface
- Role-based responses
- Real-time data queries

---

## 🔐 Security Features

1. **ECDSA Signatures**: All AI results signed by compute pipeline
2. **Hash Verification**: Resume hashes verified on-chain
3. **PII Protection**: Personal data stored off-chain (0G Storage)
4. **Access Control**: Owner-only functions for critical operations
5. **DID Verification**: Decentralized identity verification
6. **NFT Credentials**: Immutable skill verification

---

## 📊 Data Flow

### Resume Upload Flow
```
User Upload → API Route → 0G Storage (mainnet) → zgs:// URI
                                     ↓
                            OpenAI/0G Compute → Skills Extraction
                                     ↓
                            Store Analysis → Candidate Record
                                     ↓
                            On-chain Hash → ResumeRegistry
```

### Job Matching Flow
```
Job Posted → JobBoard Contract → API Route
                              ↓
                    Load Candidates → Match Algorithm
                              ↓
                    Adaptive Weights → Score Calculation
                              ↓
                    Ranked Results → Display to Recruiter
```

### Credential Minting Flow
```
Recruiter Action → Upload Metadata → 0G Storage (mainnet)
                              ↓
                    Get zgs:// URI → SkillCredential Contract
                              ↓
                    Mint ERC-721 → NFT Created
                              ↓
                    Candidate Receives → Verifiable Credential
```

---

## 🧪 Testing

### Test Smart Contracts
```bash
npx hardhat test
```

### Test API Endpoints
```bash
# Local development
npm run dev

# Test resume analysis
curl -X POST http://localhost:3000/api/analyze-resume \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"...","preferences":{...}}'
```

---

## 📝 Project Pitch

### Problem Statement
Traditional recruitment platforms suffer from:
- **Bias**: Human bias in candidate selection
- **Opacity**: Black-box matching algorithms
- **Centralization**: Data controlled by single entities
- **Inefficiency**: Manual resume screening

### Solution: 0G Matchwave
0G Matchwave leverages **0G's decentralized infrastructure** to create:
- **Transparent Matching**: All algorithms and weights on-chain
- **Bias-Free AI**: Open-source, verifiable matching logic
- **Decentralized Storage**: Candidate data on 0G Storage (mainnet)
- **Blockchain Verification**: All interactions recorded on 0G Chain
- **Adaptive Learning**: System improves from successful hires

### Key Differentiators
1. **True Decentralization**: Data and compute on 0G Network
2. **Verifiable AI**: Open-source matching algorithm
3. **NFT Credentials**: Verifiable skill achievements
4. **Multi-Chain**: Post jobs to multiple networks
5. **Reputation System**: On-chain recruiter ratings

### Use Cases
- **Tech Companies**: Find developers with specific skills
- **Recruiting Agencies**: Transparent candidate matching
- **Job Seekers**: Verifiable skill credentials
- **HR Departments**: Bias-free hiring process

### Market Opportunity
- **Global Recruitment Market**: $28B+ annually
- **Decentralized Hiring**: Growing trend
- **Web3 Talent**: Expanding ecosystem
- **AI Integration**: Increasing adoption

---

## 🛠️ Development

### Project Structure
```
run/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # React components
│   ├── Dashboard.tsx
│   ├── CandidateFlow.tsx
│   └── RecruiterFlow.tsx
├── contracts/              # Smart contracts
│   ├── ResumeRegistry.sol
│   ├── JobBoard.sol
│   └── ...
├── lib/                    # Utilities
│   ├── 0g-compute.ts      # 0G Compute integration
│   ├── 0g-storage.ts      # 0G Storage integration
│   ├── blockchain.ts      # Blockchain utilities
│   └── store.ts           # Zustand store
└── scripts/                # Deployment scripts
    ├── deploy-contracts-mainnet.ts
    └── deploy-chatbot-testnet.js
```

### Key Files
- **`lib/0g-compute.ts`**: AI analysis and matching logic
- **`lib/0g-storage.ts`**: 0G Storage upload/download
- **`components/CandidateFlow.tsx`**: Candidate interface
- **`components/RecruiterFlow.tsx`**: Recruiter interface
- **`app/api/analyze-resume/route.ts`**: Resume analysis endpoint

---

## 📚 Additional Resources

- **0G Documentation**: https://docs.0g.ai/
- **0G Chain Explorer**: https://chainscan.0g.ai
- **0G Storage**: https://indexer-storage-turbo.0g.ai
- **GitHub**: [Repository URL]
- **Demo**: [Live Demo URL]

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👥 Team & Contact

- **Project**: 0G Matchwave
- **Built on**: 0G Chain, Compute & Storage
- **Contact**: [Your Contact Info]

---

**Last Updated**: [Current Date]
**Version**: 1.0.0

