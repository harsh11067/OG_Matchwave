import { ethers } from 'ethers';
import { CandidateProfile, ResumeAnalysis, JobPosting, MatchReport } from './schemas';

// Contract ABIs (you'll need to generate these after compilation)
const RESUME_REGISTRY_ABI = [
  "function uploadResume(bytes32 resumeHash, string storageURI) external",
  "function submitAnalysis(address candidate, bytes32 resumeHash, uint16 score, string model, string reportURI, bytes signature) external",
  "event ResumeUploaded(address indexed candidate, bytes32 resumeHash, string storageURI)",
  "event AnalysisSubmitted(address indexed candidate, uint16 score, string model, string reportURI, bytes32 resumeHash)"
];

const JOB_BOARD_ABI = [
  "function postJob(string jobURI) external returns (uint256)",
  "function setJobActive(uint256 jobId, bool active) external",
  "function submitMatch(uint256 jobId, address candidate, uint16 score, string reportURI, bytes signature) external",
  "event JobPosted(uint256 indexed jobId, address indexed owner, string jobURI)",
  "event MatchSubmitted(uint256 indexed jobId, address indexed candidate, uint16 score, string reportURI)"
];

export class BlockchainService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private registryContract: ethers.Contract;
  private boardContract: ethers.Contract;

  constructor(
    privateKey: string,
    registryAddress: string,
    boardAddress: string,
    rpcUrl: string = 'https://evmrpc-testnet.0g.ai/'
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    
    this.registryContract = new ethers.Contract(
      registryAddress,
      RESUME_REGISTRY_ABI,
      this.signer
    );
    
    this.boardContract = new ethers.Contract(
      boardAddress,
      JOB_BOARD_ABI,
      this.signer
    );
  }

  /**
   * Upload resume hash to blockchain
   */
  async uploadResume(resumeHash: string, storageURI: string): Promise<string> {
    try {
      const tx = await this.registryContract.uploadResume(resumeHash, storageURI);
      const receipt = await tx.wait();
      
      // Find the ResumeUploaded event
      const event = receipt.logs.find((log: any) => 
        log.eventName === 'ResumeUploaded'
      );
      
      if (event) {
        return event.args.storageURI;
      }
      
      return storageURI;
    } catch (error) {
      console.error('Error uploading resume to blockchain:', error);
      throw error;
    }
  }

  /**
   * Submit AI analysis to blockchain
   */
  async submitAnalysis(
    candidate: string,
    resumeHash: string,
    score: number,
    model: string,
    reportURI: string,
    signature: string
  ): Promise<string> {
    try {
      const tx = await this.registryContract.submitAnalysis(
        candidate,
        resumeHash,
        score,
        model,
        reportURI,
        signature
      );
      
      const receipt = await tx.wait();
      
      // Find the AnalysisSubmitted event
      const event = receipt.logs.find((log: any) => 
        log.eventName === 'AnalysisSubmitted'
      );
      
      if (event) {
        return event.args.reportURI;
      }
      
      return reportURI;
    } catch (error) {
      console.error('Error submitting analysis to blockchain:', error);
      throw error;
    }
  }

  /**
   * Post a new job to the blockchain
   */
  async postJob(jobURI: string): Promise<number> {
    try {
      const tx = await this.boardContract.postJob(jobURI);
      const receipt = await tx.wait();
      
      // Find the JobPosted event
      const event = receipt.logs.find((log: any) => 
        log.eventName === 'JobPosted'
      );
      
      if (event) {
        return event.args.jobId.toNumber();
      }
      
      throw new Error('Job posted but jobId not found in event');
    } catch (error) {
      console.error('Error posting job to blockchain:', error);
      throw error;
    }
  }

  /**
   * Submit a candidate match to the blockchain
   */
  async submitMatch(
    jobId: number,
    candidate: string,
    score: number,
    reportURI: string,
    signature: string
  ): Promise<string> {
    try {
      const tx = await this.boardContract.submitMatch(
        jobId,
        candidate,
        score,
        reportURI,
        signature
      );
      
      const receipt = await tx.wait();
      
      // Find the MatchSubmitted event
      const event = receipt.logs.find((log: any) => 
        log.eventName === 'MatchSubmitted'
      );
      
      if (event) {
        return event.args.reportURI;
      }
      
      return reportURI;
    } catch (error) {
      console.error('Error submitting match to blockchain:', error);
      throw error;
    }
  }

  /**
   * Generate signature for analysis submission
   * This would typically be done by your 0G Compute pipeline
   */
  async generateAnalysisSignature(
    candidate: string,
    resumeHash: string,
    score: number,
    model: string,
    reportURI: string,
    chainId: number
  ): Promise<string> {
    const digest = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'bytes32', 'uint16', 'string', 'string', 'uint256'],
        [candidate, resumeHash, score, model, reportURI, chainId]
      )
    );
    
    const messageHash = ethers.hashMessage(ethers.getBytes(digest));
    return await this.signer.signMessage(ethers.getBytes(messageHash));
  }

  /**
   * Generate signature for match submission
   */
  async generateMatchSignature(
    jobId: number,
    candidate: string,
    score: number,
    reportURI: string,
    chainId: number
  ): Promise<string> {
    const digest = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'address', 'uint16', 'string', 'uint256'],
        [jobId, candidate, score, reportURI, chainId]
      )
    );
    
    const messageHash = ethers.hashMessage(ethers.getBytes(digest));
    return await this.signer.signMessage(ethers.getBytes(messageHash));
  }

  /**
   * Get current chain ID
   */
  async getChainId(): Promise<number> {
    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  /**
   * Get signer address
   */
  async getSignerAddress(): Promise<string> {
    return await this.signer.getAddress();
  }
}







