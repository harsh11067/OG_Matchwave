// pages/api/post-job-multi.js
import JOBBOARD_ABI from '../../lib/abis/JobBoard.json';
import { getSignerForChain } from '../../lib/providers';

export default async function handler(req, res) {
  try {
    const { jobMeta, chainIds } = req.body; // chainIds = [16602, 137]
    const results = [];

    for (const chainId of chainIds) {
      const signer = getSignerForChain(chainId);
      const jobBoardAddr = process.env.NEXT_PUBLIC_JOB_BOARD_ADDRESS; // or separate per chain if deployed differently
      const contract = new ethers.Contract(jobBoardAddr, JOBBOARD_ABI, signer);
      const tx = await contract.createJob(JSON.stringify(jobMeta)); // adjust to your contract signature
      const receipt = await tx.wait();
      results.push({ chainId, txHash: receipt.transactionHash });
    }
    res.status(200).json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
