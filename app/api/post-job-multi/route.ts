import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getSignerForChain } from '../../../lib/provider';
import JobBoardABI from '../../../lib/abis/JobBoard.json';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { jobMeta, chainIds } = await request.json();

    if (!jobMeta || !chainIds || !Array.isArray(chainIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing jobMeta or chainIds array' },
        { status: 400 }
      );
    }

    const results = [];

    for (const chainId of chainIds) {
      try {
        const signer = getSignerForChain(chainId);
        const jobBoardAddr = process.env.NEXT_PUBLIC_JOB_BOARD_ADDRESS;

        if (!jobBoardAddr) {
          throw new Error(`JobBoard address not configured for chain ${chainId}`);
        }

        const contract = new ethers.Contract(jobBoardAddr, JobBoardABI, signer);
        
        // Adjust to your contract's createJob signature
        const jobMetaString = JSON.stringify(jobMeta);
        const tx = await contract.createJob(jobMetaString);
        const receipt = await tx.wait();

        results.push({
          chainId,
          txHash: receipt.hash,
          networkName: getNetworkName(chainId)
        });
      } catch (err: any) {
        console.error(`Error posting to chain ${chainId}:`, err);
        results.push({
          chainId,
          error: err.message || 'Failed to post job'
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Post job multi error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    16602: '0G Chain (Galileo)',
    137: 'Polygon',
    534352: 'Scroll'
  };
  return networks[chainId] || `Chain ${chainId}`;
}

