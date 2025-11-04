// pages/api/compare-match.js
import fs from 'fs/promises';
import path from 'path';
import { computeMatchScore } from '../../lib/match-utils'; // small helper you create

export default async function handler(req, res) {
  try {
    const candidate = req.body.candidate; // candidate profile
    if (!candidate) return res.status(400).json({ success:false, error:'Missing candidate' });

    // load jobs merged across chains (could call your search-crosschain logic or reuse code)
    const jobs = await fetch(`${process.env.NEXT_PUBLIC_SITE_ORIGIN}/api/search-crosschain?network=all`) // or call internal function
      .then(r => r.json()).then(j => j.results || []);

    // current weights
    const wPath = path.join(process.cwd(),'data','weights.json');
    const weights = JSON.parse(await fs.readFile(wPath, 'utf8'));

    // compute scores with current weights
    const scoredNow = await Promise.all(jobs.map(async job => {
      const score = await computeMatchScore(job.metadata, candidate, weights);
      return { job, score };
    }));

    // optional: if previousWeights provided, compute with those too
    const previousWeights = req.body.previousWeights || null;
    const scoredBefore = previousWeights ? (await Promise.all(jobs.map(async job => {
      const score = await computeMatchScore(job.metadata, candidate, previousWeights);
      return { job, score };
    }))) : null;

    // sort
    scoredNow.sort((a,b)=>b.score-a.score);
    if (scoredBefore) scoredBefore.sort((a,b)=>b.score-a.score);

    res.status(200).json({ success:true, before: scoredBefore, after: scoredNow, weights });
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
}
