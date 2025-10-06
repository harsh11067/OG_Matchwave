import { NextRequest, NextResponse } from 'next/server';
import { OGComputeService } from '@/lib/0g-compute';
import { JobPosting, Candidate } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { job, candidates } = await request.json();
    
    const computeService = new OGComputeService();
    const matches = await computeService.matchCandidates(job, candidates);
    
    return NextResponse.json({ success: true, matches });
  } catch (error) {
    console.error('Candidate matching error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to match candidates' },
      { status: 500 }
    );
  }
}

