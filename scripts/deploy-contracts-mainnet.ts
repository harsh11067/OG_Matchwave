import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

async function main(hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Deploying contracts to 0G Chain Mainnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "OG\n");

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

  console.log("\n📝 Contract Addresses (0G Chain Mainnet):");
  console.log("==========================================");
  console.log(`RESUME_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`JOB_BOARD_ADDRESS=${jobBoardAddress}`);
  console.log(`RECRUITER_REPUTATION_ADDRESS=${reputationAddress}`);
  console.log(`SKILL_CREDENTIAL_ADDRESS=${skillCredentialAddress}`);
  console.log("==========================================\n");

  console.log("🔍 Verify contracts on 0G Chain Explorer:");
  console.log(`https://chainscan.0g.ai/address/${registryAddress}`);
  console.log(`https://chainscan.0g.ai/address/${jobBoardAddress}`);
  console.log(`https://chainscan.0g.ai/address/${reputationAddress}`);
  console.log(`https://chainscan.0g.ai/address/${skillCredentialAddress}\n`);

  console.log("✅ All contracts deployed successfully!");
  console.log("📋 Update your .env file with the contract addresses above.\n");
}

main({} as any).catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

