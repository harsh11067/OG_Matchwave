# 0G Matchwave - Verified Contract Addresses (0G Chain Mainnet)

## Smart Contracts Deployed

All contracts are deployed and verified on **0G Chain Mainnet** (Chain ID: 16661)

### Contract Addresses

| Contract | Address | Explorer | Status |
|----------|---------|----------|--------|
| **ResumeRegistry** | `0xFd84545E34762943E29Ab17f98815280c4a90Cb6` | [View on Explorer](https://chainscan.0g.ai/address/0xFd84545E34762943E29Ab17f98815280c4a90Cb6) | ✅ Deployed |
| **JobBoard** | `0xE23469d5aFb586B8c45D669958Ced489ee9Afb09` | [View on Explorer](https://chainscan.0g.ai/address/0xE23469d5aFb586B8c45D669958Ced489ee9Afb09) | ✅ Deployed |
| **RecruiterReputation** | `0xDbBA4f5A4b1D9aE51E533E3C212898169df69EAc` | [View on Explorer](https://chainscan.0g.ai/address/0xDbBA4f5A4b1D9aE51E533E3C212898169df69EAc) | ✅ Deployed |
| **SkillCredential** | `0xed401473e938714927392182ea5c8F65593946d8` | [View on Explorer](https://chainscan.0g.ai/address/0xed401473e938714927392182ea5c8F65593946d8) | ✅ Deployed |

> **Note**: Replace `0x0000000000000000000000000000000000000000` with actual deployed addresses after running `scripts/deploy-contracts-mainnet.ts`

## Network Information

- **Network Name**: 0G Chain Mainnet
- **Chain ID**: 16661
- **RPC URL**: `https://evmrpc.0g.ai`
- **Explorer**: `https://chainscan.0g.ai`
- **Block Explorer API**: `https://api.chainscan.0g.ai`

## Environment Variables

After deployment, update your `.env` file with:

```env
# 0G Chain Mainnet
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=16661
NEXT_PUBLIC_0G_EXPLORER=https://chainscan.0g.ai

# Contract Addresses (Deployed on 0G Chain Mainnet)
NEXT_PUBLIC_RESUME_REGISTRY_ADDRESS=0xFd84545E34762943E29Ab17f98815280c4a90Cb6
NEXT_PUBLIC_JOB_BOARD_ADDRESS=0xE23469d5aFb586B8c45D669958Ced489ee9Afb09
NEXT_PUBLIC_RECRUITER_REPUTATION_ADDRESS=0xDbBA4f5A4b1D9aE51E533E3C212898169df69EAc
NEXT_PUBLIC_SKILL_CREDENTIAL_ADDRESS=0xed401473e938714927392182ea5c8F65593946d8

# Private Key (NEVER commit!)
PRIVATE_KEY=your_mainnet_private_key_here
```

## Verification

To verify contracts on 0G Chain Explorer:

1. **Get contract source code** from `contracts/` directory
2. **Use Hardhat verify plugin**:
   ```bash
   npx hardhat verify --network og_mainnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

3. **Or use Explorer UI**:
   - Go to contract address on explorer
   - Click "Verify Contract"
   - Upload source code and provide constructor arguments

## Contract Interactions

### ResumeRegistry
- **Function**: `uploadResume(bytes32 resumeHash, string storageURI)`
- **Function**: `getResume(address candidate) returns (ResumeInfo)`

### JobBoard
- **Function**: `postJob(Job memory job) returns (uint256)`
- **Function**: `getJob(uint256 jobId) returns (Job memory)`
- **Function**: `confirmHire(uint256 jobId, address candidate, bool hired, string outcomeURI)`

### RecruiterReputation
- **Function**: `rateRecruiter(address recruiter, uint8 score)`
- **Function**: `getAvgRating(address recruiter) returns (uint256)`

### SkillCredential
- **Function**: `mintCredential(address to, string memory credentialURI) returns (uint256)`
- **Function**: `tokenURI(uint256 tokenId) returns (string)`

## Deployment Date

- **Deployed**: November 4, 2025
- **Deployer Address**: `0x1aB7d5eCBe2c551eBfFdfA06661B77cc60dbd425`
- **Network**: 0G Chain Mainnet (Chain ID: 16661)
- **Status**: ✅ All contracts deployed and verified

