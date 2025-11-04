import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In a real app, this would query multiple chains or a database
// For now, we'll return an empty array since jobs are stored client-side
async function getJobsFromStore() {
  // In production, this would fetch from a database or multiple chains
  // For now, return empty array - jobs are managed client-side via Zustand
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'all';

    // Get jobs from store (in production, this would query multiple chains)
    const jobs: any[] = await getJobsFromStore();

    let filteredJobs: any[] = jobs;

    // Filter by network if specified
    if (network !== 'all') {
      const chainMap: Record<string, number> = {
        '0g': 16602,
        'galileo': 16602,
        'polygon': 137,
        'scroll': 534352
      };
      const chainId = chainMap[network.toLowerCase()];
      if (chainId) {
        filteredJobs = jobs.filter(job => job.chainId === chainId);
      }
    }

    // Format results with network badges
    const results = filteredJobs.map(job => ({
      ...job,
      networkName: job.networkName || getNetworkName(job.chainId || 16602),
      chainId: job.chainId || 16602
    }));

    return NextResponse.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error: any) {
    console.error('Search crosschain error:', error);
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

