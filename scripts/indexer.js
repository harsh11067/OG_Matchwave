import { ethers } from 'ethers';
import fs from 'fs/promises';
import { updateWeights } from './indexer-update.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC = process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
const JOB_BOARD_ADDRESS = process.env.NEXT_PUBLIC_JOB_BOARD_ADDRESS;

async function startIndexer() {
  if (!JOB_BOARD_ADDRESS) {
    console.error('❌ NEXT_PUBLIC_JOB_BOARD_ADDRESS not set');
    return;
  }

  try {
    // Load ABI from artifacts
    const abiPath = path.join(__dirname, '../artifacts/contracts/JobBoard.sol/JobBoard.json');
    const abiFile = await fs.readFile(abiPath, 'utf8');
    const JobBoardABI = JSON.parse(abiFile);

    const provider = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(JOB_BOARD_ADDRESS, JobBoardABI.abi, provider);

    console.log('👂 Listening for HireConfirmed events...');
    console.log('📍 JobBoard:', JOB_BOARD_ADDRESS);
    console.log('🌐 RPC:', RPC);

    contract.on('HireConfirmed', async (recruiter, candidate, jobId, outcomeURI, event) => {
      console.log(`\n✅ HireConfirmed Event:`);
      console.log(`   Recruiter: ${recruiter}`);
      console.log(`   Candidate: ${candidate}`);
      console.log(`   Job ID: ${jobId.toString()}`);
      console.log(`   Outcome URI: ${outcomeURI}`);

      try {
        // Fetch outcome data from 0G Storage
        const outcomeUrl = outcomeURI.startsWith('zgs://')
          ? `${process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai'}/preview/${outcomeURI.replace('zgs://', '')}`
          : outcomeURI;
        
        const res = await fetch(outcomeUrl);
        if (!res.ok) throw new Error(`Failed to fetch outcome: ${res.statusText}`);
        
        const outcome = await res.json();
        console.log('📊 Outcome data:', JSON.stringify(outcome, null, 2));

        // Update weights using the indexer-update logic
        await updateWeights(outcome);
        console.log('🔁 Weights updated based on real hire event!');
      } catch (e) {
        console.error('❌ Failed to process hire outcome:', e);
      }
    });

    console.log('✅ Indexer started successfully');
  } catch (error) {
    console.error('❌ Indexer startup error:', error);
    process.exit(1);
  }
}

startIndexer();
