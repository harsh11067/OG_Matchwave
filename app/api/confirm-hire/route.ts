// app/api/confirm-hire/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { OGStorageService } from '@/lib/0g-storage';

export const dynamic = 'force-dynamic';

const WEIGHTS_PATH = path.join(process.cwd(), 'data', 'weights.json');

function defaultWeights() {
  return { skills: 0.4, location: 0.2, salary: 0.15, education: 0.15, experience: 0.1 };
}

function applyOutcomeToWeights(weights: any, outcome: any, lr = 0.02) {
  const job = outcome.jobMeta || {};
  const cand = outcome.candidateMeta || {};
  const jobSkills = job.skills || [];
  const candSkills = (cand.skills || []).map((s: string) => s.toLowerCase());
  const matched = jobSkills.filter((s: string) => candSkills.includes(s.toLowerCase())).length;
  const skillSignal = Math.min(1, matched / Math.max(1, jobSkills.length || 1));
  const sign = outcome.hired ? 1 : -1;

  const newWeights = { ...weights };
  newWeights.skills = Math.max(0.01, newWeights.skills + sign * lr * skillSignal);

  const locMatch = (job.location || '').toLowerCase() === (cand.location || '').toLowerCase() ? 1 : 0;
  newWeights.location = Math.max(0.01, newWeights.location + sign * lr * locMatch);

  const j = job.salary || { min: 0, max: 1 };
  const c = cand.salary || { min: j.min, max: j.max };
  const jobMid = (j.min + j.max) / 2 || 1;
  const candMid = (c.min + c.max) / 2 || jobMid;
  const salarySignal = Math.max(0, 1 - Math.abs(jobMid - candMid) / Math.max(1, jobMid));
  newWeights.salary = Math.max(0.01, newWeights.salary + sign * lr * salarySignal);

  const eduSignal = cand.education === job.education ? 1 : 0;
  newWeights.education = Math.max(0.01, newWeights.education + sign * lr * eduSignal);

  const expReq = job.experience || 0;
  const expCand = cand.experience || 0;
  const expSignal = Math.min(1, expCand / Math.max(1, expReq || 1));
  newWeights.experience = Math.max(0.01, newWeights.experience + sign * lr * expSignal);

  // normalize
  const total = Object.values(newWeights).reduce((a: any, b: any) => a + b, 0) as number;
  Object.keys(newWeights).forEach(k => { 
    newWeights[k] = Number((newWeights[k] / total).toFixed(4)); 
  });

  return newWeights;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobMeta, candidateMeta, hired, jobId, candidate, analysis } = body;
    
    // Support both formats: direct jobMeta/candidateMeta or derived from jobId/candidate
    let finalJobMeta = jobMeta;
    let finalCandidateMeta = candidateMeta;
    
    if (!finalJobMeta || !finalCandidateMeta) {
      // Try to construct from jobId and candidate if provided
      if (jobId && candidate && analysis) {
        // This would need to fetch from store or database
        // For now, construct from analysis
        finalCandidateMeta = {
          skills: analysis.skills?.found || [],
          location: candidate.preferences?.location || '',
          salary: candidate.preferences?.salary || { min: 0, max: 0 },
          education: analysis.education?.degree || '',
          experience: analysis.experience?.years || 0
        };
        // jobMeta would need to be fetched from jobId
      }
    }
    
    if (!finalJobMeta || !finalCandidateMeta) {
      return NextResponse.json({ success: false, error: 'jobMeta and candidateMeta required' }, { status: 400 });
    }

    // Construct outcome
    const outcome = {
      hired: hired !== undefined ? !!hired : true,
      jobMeta: finalJobMeta,
      candidateMeta: finalCandidateMeta,
      createdAt: new Date().toISOString()
    };

    // Upload outcome with OGStorageService (uses real 0G Storage on mainnet)
    const storage = new OGStorageService(process.env.PRIVATE_KEY);
    const uploadRes = await storage.uploadJSON(outcome);
    const outcomeURI = uploadRes.storageURI; // Will be zgs://... on mainnet
    
    console.log(`✅ Outcome uploaded to 0G Storage: ${outcomeURI}`);

    // read existing weights
    let weights = defaultWeights();
    try {
      const raw = await fs.readFile(WEIGHTS_PATH, 'utf8');
      weights = JSON.parse(raw);
    } catch (err: any) {
      // file missing -> use default
    }

    // update weights
    const updated = applyOutcomeToWeights(weights, outcome, 0.03); // slightly stronger lr for hack demo
    await fs.mkdir(path.dirname(WEIGHTS_PATH), { recursive: true });
    await fs.writeFile(WEIGHTS_PATH, JSON.stringify(updated, null, 2), 'utf8');

    // return new weights and outcomeURI
    return NextResponse.json({ success: true, weights: updated, outcomeURI });
  } catch (err: any) {
    console.error('confirm-hire error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
