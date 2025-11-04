//💡 Purpose: lets you demonstrate “model learning” locally during judging — run once, refresh dashboard, and show the weights changing.

// scripts/test-emitter.js
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mockOutcome = {
  hired: true,
  jobMeta: {
    skills: ['Solidity', 'React', 'Node.js'],
    location: 'India',
    salary: { min: 60000, max: 80000 },
    education: 'Bachelors',
    experience: 2
  },
  candidateMeta: {
    skills: ['Solidity', 'React', 'Python'],
    location: 'India',
    salary: { min: 50000, max: 70000 },
    education: 'Masters',
    experience: 3
  }
};

async function simulateHire() {
  // save local mock outcome file
  await fs.writeFile(path.join(__dirname, '../data/mockOutcome.json'), JSON.stringify(mockOutcome, null, 2));
  console.log('✅ Mock outcome JSON created at data/mockOutcome.json');

  // now trigger indexer weights update manually
  console.log('⚙️ Updating adaptive weights...');
  const { updateWeights } = await import('./indexer-update.js');
  await updateWeights(mockOutcome);
  console.log('✅ Weights updated based on mock hire outcome');
}

simulateHire().catch(console.error);



Now create a helper module used by the above:

// scripts/indexer-update.js
import fs from 'fs/promises';

export async function updateWeights(outcome, alpha = 0.05) {
  const w = JSON.parse(await fs.readFile('./data/weights.json', 'utf8'));

  const job = outcome.jobMeta;
  const cand = outcome.candidateMeta;

  const skills = (() => {
    const j = job.skills || [], c = cand.skills || [];
    const matched = j.filter(s => c.includes(s)).length;
    return j.length ? matched / j.length : 0;
  })();
  const location = job.location === cand.location ? 1 : 0;
  const salary = (() => {
    const jm = (job.salary.min + job.salary.max) / 2;
    const cm = (cand.salary.min + cand.salary.max) / 2;
    return 1 - Math.min(Math.abs(jm - cm) / jm, 1);
  })();
  const education = cand.education === job.education ? 1 : 0.9;
  const experience = Math.min(cand.experience / job.experience, 1);

  const f = { skills, location, salary, education, experience };
  const y = outcome.hired ? 1 : 0;
  const keys = Object.keys(w);
  let numerator = 0, denom = 0;
  for (const k of keys) { numerator += w[k] * f[k]; denom += w[k]; }
  const p = denom > 0 ? numerator / denom : 0;
  const err = y - p;

  for (const k of keys) {
    w[k] += alpha * err * f[k];
  }
  const total = keys.reduce((s, k) => s + w[k], 0);
  for (const k of keys) w[k] /= total;

  await fs.writeFile('./data/weights.json', JSON.stringify(w, null, 2));
}