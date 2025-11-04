// scripts/simulate-hire.js
import fs from 'fs/promises';
import path from 'path';
import { updateWeights } from './indexer-update.js'; // ensure this exports updateWeights

async function main() {
  const mockOutcome = {
    hired: true,
    jobMeta: { skills: ['JavaScript','React'], location: 'California', salary: {min:60000,max:90000}, education:'Bachelors', experience:3 },
    candidateMeta: { skills: ['JavaScript','React'], location: 'California', salary:{min:65000,max:85000}, education:'Bachelors', experience:4 }
  };

  const outPath = path.join(process.cwd(), 'data', 'mockOutcome.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(mockOutcome, null, 2), 'utf8');
  console.log('Mock outcome saved ->', outPath);

  // call indexer updater to update weights (same logic as real indexer)
  if (typeof updateWeights === 'function') {
    await updateWeights(mockOutcome, 0.05);
    console.log('Weights updated using indexer-update logic.');
  } else {
    console.log('updateWeights not found — ensure scripts/indexer-update.js exports updateWeights');
  }

  const weightsPath = path.join(process.cwd(),'data','weights.json');
  const final = await fs.readFile(weightsPath,'utf8');
  console.log('New weights:\n', final);
}

main().catch(err => { console.error(err); process.exit(1); });
