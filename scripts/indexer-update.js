// scripts/indexer-update.js
import fs from 'fs/promises';
import path from 'path';

export async function updateWeights(outcome, alpha = 0.05) {
  const weightsPath = path.join(process.cwd(), 'data', 'weights.json');
  
  let w;
  try {
    const raw = await fs.readFile(weightsPath, 'utf8');
    w = JSON.parse(raw);
  } catch (err) {
    // If file doesn't exist, create with defaults
    w = {
      skills: 0.4,
      location: 0.2,
      salary: 0.15,
      education: 0.15,
      experience: 0.1
    };
    await fs.mkdir(path.dirname(weightsPath), { recursive: true });
  }

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

  await fs.writeFile(weightsPath, JSON.stringify(w, null, 2));
}
