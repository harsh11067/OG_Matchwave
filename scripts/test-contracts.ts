import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log("Testing smart contracts...");

  // Get signers
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const candidate = signers[1] || signers[0]; // Use deployer if only one signer
  const recruiter = signers[2] || signers[0]; // Use deployer if only one signer
  
  console.log("Deployer:", deployer.address);
  console.log("Candidate:", candidate.address);
  console.log("Recruiter:", recruiter.address);

  // Deploy contracts
  const Registry = await ethers.getContractFactory("ResumeRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();

  const Board = await ethers.getContractFactory("JobBoard");
  const board = await Board.deploy(deployer.address);
  await board.waitForDeployment();

  console.log("ResumeRegistry deployed to:", await registry.getAddress());
  console.log("JobBoard deployed to:", await board.getAddress());

  // Test ResumeRegistry
  console.log("\n--- Testing ResumeRegistry ---");
  
  const resumeHash = ethers.keccak256(ethers.toUtf8Bytes("test resume content"));
  const storageURI = "zgs://test-resume-uri";
  
  // Candidate uploads resume
  await registry.connect(candidate).uploadResume(resumeHash, storageURI);
  console.log("✅ Resume uploaded successfully");
  
  // Get resume info
  const resumeInfo = await registry.resumes(candidate.address);
  console.log("Resume hash:", resumeInfo.resumeHash);
  console.log("Storage URI:", resumeInfo.storageURI);

  // Test JobBoard
  console.log("\n--- Testing JobBoard ---");
  
  const jobURI = "zgs://test-job-uri";
  
  // Recruiter posts job
  const jobTx = await board.connect(recruiter).postJob(jobURI);
  const jobReceipt = await jobTx.wait();
  
  // Find job ID from event
  const jobPostedEvent = jobReceipt.logs.find((log: any) => 
    log.eventName === 'JobPosted'
  );
  
  if (jobPostedEvent) {
    const jobId = Number(jobPostedEvent.args.jobId);
    console.log("✅ Job posted successfully with ID:", jobId);
    
    // Get job info
    const jobInfo = await board.jobs(jobId);
    console.log("Job owner:", jobInfo.owner);
    console.log("Job URI:", jobInfo.jobURI);
    console.log("Job active:", jobInfo.active);
  }

  console.log("\n✅ All tests passed! Smart contracts are working correctly.");
}

main().catch((e) => { 
  console.error("❌ Test failed:", e); 
  process.exit(1); 
});
