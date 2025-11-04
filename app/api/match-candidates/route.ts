import { NextRequest, NextResponse } from 'next/server';
import { OGComputeService } from '@/lib/0g-compute';
import { JobPosting, Candidate } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { job, candidates: candidatesInput } = await request.json();
    
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job is required' }, { status: 400 });
    }

    // Load candidates from file if not provided or if provided array is empty
    let candidates: Candidate[] = candidatesInput || [];
    
    if (!candidates || candidates.length === 0) {
      try {
        const candidatesPath = path.join(process.cwd(), 'data', 'candidates.json');
        const raw = await fs.readFile(candidatesPath, 'utf8');
        candidates = JSON.parse(raw);
      } catch (err) {
        console.warn('Could not load candidates from file:', err);
        candidates = [];
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ 
        success: true, 
        matches: [],
        message: 'No candidates available for matching' 
      });
    }

    // Normalize job structure for matching
    const normalizedJob = {
      ...job,
      id: job.id || 'job-1',
      requirements: {
        skills: (job.skills || []).map((s: any) => typeof s === 'string' ? s : s.name || s),
        education: job.education?.degree || job.requirements?.education || 'Bachelors',
        experience: job.experience?.min || job.requirements?.experience || 0
      },
      location: job.location || '',
      salary: job.salary || { min: 0, max: 0 }
    };

    // Load weights for adaptive matching
    let weights: any = null;
    try {
      const weightsPath = path.join(process.cwd(), 'data', 'weights.json');
      const weightsRaw = await fs.readFile(weightsPath, 'utf8');
      weights = JSON.parse(weightsRaw);
    } catch (err) {
      // Use default weights if file doesn't exist
      weights = { skills: 0.4, location: 0.2, salary: 0.15, education: 0.15, experience: 0.1 };
    }

    const computeService = new OGComputeService(
      process.env.COMPUTE_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY,
      process.env.NEXT_PUBLIC_0G_RPC_URL
    );
    await computeService.initBroker?.();
    
    const matches = await computeService.matchCandidates(normalizedJob as JobPosting, candidates, weights);
    
    console.log(`✅ Matched ${matches.length} candidates for job ${normalizedJob.id}`);
    
    return NextResponse.json({ success: true, matches });
  } catch (error: any) {
    console.error('Candidate matching error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to match candidates' },
      { status: 500 }
    );
  }
}

