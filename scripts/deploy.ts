import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log("🚀 Deploying contracts to 0G Chain Mainnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  try {
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceEth = ethers.formatEther(balance);
    console.log("Account balance:", balanceEth, "OG");
    if (balanceEth === "0.0" || parseFloat(balanceEth) < 0.001) {
      console.log("⚠️  WARNING: Account balance is very low. Deployment may fail!");
      console.log("   Expected funded address: 0x1ab7d5ecbe2c551ebffdfa06661b77cc60dbd425");
      console.log("   Current deployer address:", deployer.address);
      console.log("   Make sure PRIVATE_KEY in .env matches the funded account!\n");
    } else {
      console.log("");
    }
  } catch (err) {
    console.log("⚠️  Could not fetch balance\n");
  }

  // Deploy ResumeRegistry
  console.log("📄 Deploying ResumeRegistry...");
  const ResumeRegistry = await ethers.getContractFactory("ResumeRegistry");
  const registry = await ResumeRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ ResumeRegistry deployed to:", registryAddress);

  // Deploy JobBoard
  console.log("\n📋 Deploying JobBoard...");
  const JobBoard = await ethers.getContractFactory("JobBoard");
  const jobBoard = await JobBoard.deploy(deployer.address);
  await jobBoard.waitForDeployment();
  const jobBoardAddress = await jobBoard.getAddress();
  console.log("✅ JobBoard deployed to:", jobBoardAddress);

  // Deploy RecruiterReputation
  console.log("\n⭐ Deploying RecruiterReputation...");
  const RecruiterReputation = await ethers.getContractFactory("RecruiterReputation");
  const reputation = await RecruiterReputation.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("✅ RecruiterReputation deployed to:", reputationAddress);

  // Deploy SkillCredential
  console.log("\n🎓 Deploying SkillCredential...");
  const SkillCredential = await ethers.getContractFactory("SkillCredential");
  const skillCredential = await SkillCredential.deploy();
  await skillCredential.waitForDeployment();
  const skillCredentialAddress = await skillCredential.getAddress();
  console.log("✅ SkillCredential deployed to:", skillCredentialAddress);

  console.log("\n📝 Contract Addresses (0G Chain Mainnet - Chain ID: 16661):");
  console.log("==========================================");
  console.log(`NEXT_PUBLIC_RESUME_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`NEXT_PUBLIC_JOB_BOARD_ADDRESS=${jobBoardAddress}`);
  console.log(`NEXT_PUBLIC_RECRUITER_REPUTATION_ADDRESS=${reputationAddress}`);
  console.log(`NEXT_PUBLIC_SKILL_CREDENTIAL_ADDRESS=${skillCredentialAddress}`);
  console.log("==========================================\n");

  console.log("🔍 Verify contracts on 0G Chain Explorer:");
  console.log(`https://chainscan.0g.ai/address/${registryAddress}`);
  console.log(`https://chainscan.0g.ai/address/${jobBoardAddress}`);
  console.log(`https://chainscan.0g.ai/address/${reputationAddress}`);
  console.log(`https://chainscan.0g.ai/address/${skillCredentialAddress}\n`);

  console.log("✅ All contracts deployed successfully!");
  console.log("📋 Update your .env file and CONTRACT_ADDRESSES.md with the addresses above.\n");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

