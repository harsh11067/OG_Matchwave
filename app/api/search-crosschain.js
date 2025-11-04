// pages/api/search-crosschain.js
import fs from 'fs/promises';
import { ethers } from 'ethers';
import fetch from 'node-fetch';
import JOBBOARD_ABI from '../../lib/abis/JobBoard.json'; // adjust path

const CHAINS = [
  { chainId: 16602, name: 'Galileo', rpc: process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai/' },
  { chainId: 137,   name: 'Polygon', rpc: 'https://polygon-rpc.com/' }
];

// helper: convert zgs://<root> -> preview HTTP URL (indexer gateway)
// adjust if your indexer has a different preview path
function resolveZgsToHttp(zgs) {
  if (!zgs) return null;
  const root = zgs.replace('zgs://','');
  return `${process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai'}/preview/${root}`;
}

// compute simple match score using weights stored in data/weights.json
async function computeMatchScore(jobMeta, candidateMeta) {
  // load weights
  const raw = await fs.readFile('./data/weights.json', 'utf8');
  const w = JSON.parse(raw);

  // features 0..1
  const skillsOverlap = (() => {
    if (!jobMeta.skills || !candidateMeta.skills) return 0;
    const jobSkills = Array.from(new Set(jobMeta.skills.map(s => s.toLowerCase())));
    const candSkills = Array.from(new Set(candidateMeta.skills.map(s => s.toLowerCase())));
    const matched = jobSkills.filter(s => candSkills.includes(s)).length;
    return jobSkills.length ? matched / jobSkills.length : 0;
  })();

  const locationMatch = jobMeta.location && candidateMeta.location && jobMeta.location.toLowerCase() === candidateMeta.location.toLowerCase() ? 1 : 0;
  const salaryMatch = (() => {
    if (!jobMeta.salary || !candidateMeta.salary) return 0.5;
    const jobMid = (jobMeta.salary.min + jobMeta.salary.max) / 2;
    const candMid = (candidateMeta.salary.min + candidateMeta.salary.max) / 2;
    const diff = Math.abs(jobMid - candMid) / (jobMid || 1);
    return Math.max(0, 1 - diff); // 1 when equal, decreases as difference grows
  })();

  const educationScore = (() => {
    // map degree strings to numbers: PhD=4, Masters=3, Bachelors=2
    const map = { phd: 4, masters: 3, ms: 3, msc: 3, bachelor: 2, bs: 2, bsc: 2, associate: 1 };
    const req = (jobMeta.education || '').toLowerCase();
    const cand = (candidateMeta.education || '').toLowerCase();
    const r = map[req] || 2;
    const c = map[cand] || 2;
    return c >= r ? 1 : c / r;
  })();

  const experienceScore = (() => {
    const req = jobMeta.experience || 0;
    const cand = candidateMeta.experience || 0;
    if (!req) return 1;
    return Math.min(1, cand / req);
  })();

  const features = {
    skills: skillsOverlap,
    location: locationMatch,
    salary: salaryMatch,
    education: educationScore,
    experience: experienceScore,
  };

  // weighted sum normalized to 0..100
  let numerator = 0, denom = 0;
  for (const k of Object.keys(w)) {
    numerator += (w[k] || 0) * features[k];
    denom += (w[k] || 0);
  }
  const score = denom > 0 ? (numerator / denom) * 100 : 0;
  return Math.round(score);
}

export default async function handler(req, res) {
  try {
    const { skill = '', region = '', network = 'all' } = req.query;

    // Query all chains concurrently
    const chainPromises = CHAINS.map(async (c) => {
      const provider = new ethers.JsonRpcProvider(c.rpc);
      const contract = new ethers.Contract(process.env.JOBBOARD_ADDRESS, JOBBOARD_ABI, provider);

      // adjust if your contract has a different method
      const rawJobs = await contract.getActiveJobs(); // must return array [{ id, metadataURI, owner, ... }]
      const jobs = await Promise.all(rawJobs.map(async (j) => {
        // fetch metadata from storage (resolve zgs to http)
        let meta = {};
        try {
          const http = resolveZgsToHttp(j.metadataURI);
          if (http) {
            const r = await fetch(http);
            if (r.ok) meta = await r.json();
          }
        } catch (e) { /* ignore */ }

        return {
          id: j.id?.toString?.() || j.id,
          owner: j.owner || j.poster || null,
          metadataURI: j.metadataURI || null,
          metadata: meta,
          chainId: c.chainId,
          networkName: c.name,
        };
      }));

      return jobs;
    });

    const resultsArrays = await Promise.all(chainPromises);
    const merged = resultsArrays.flat();

    // For demo: we need candidate data to compute match; accept candidate profile in query or use sample candidate store
    // If client provides candidate profile, compute scores; otherwise return aggregated list
    let candidateProfile = null;
    if (req.query.candidateProfile) {
      candidateProfile = JSON.parse(req.query.candidateProfile);
    }

    const enriched = await Promise.all(merged.map(async (job) => {
      const score = candidateProfile ? await computeMatchScore(job.metadata, candidateProfile) : null;
      return { ...job, matchScore: score };
    }));

    // optional filtering by skill/region
    let filtered = enriched;
    if (skill) {
      filtered = filtered.filter(j => (j.metadata?.skills || []).map(s => s.toLowerCase()).includes(skill.toLowerCase()));
    }
    if (region) {
      filtered = filtered.filter(j => (j.metadata?.location || '').toLowerCase().includes(region.toLowerCase()));
    }
    if (network !== 'all') {
      filtered = filtered.filter(j => j.networkName.toLowerCase() === network.toLowerCase());
    }

    // sort by matchScore if present
    filtered.sort((a,b) => (b.matchScore || 0) - (a.matchScore || 0));

    res.status(200).json({ success: true, results: filtered });
  } catch (err) {
    console.error('search-crosschain error', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
