import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

type Weights = Record<string, number>;

const DEFAULT_WEIGHTS: Weights = {
  skills: 0.4,
  location: 0.2,
  salary: 0.15,
  education: 0.15,
  experience: 0.1
};

function normalize(w: Weights) {
  const s = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const n: Weights = {};
  for (const k of Object.keys(w)) n[k] = Math.max(0, (w[k] || 0) / s);
  return n;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jobId = body.jobId ?? `job-${Date.now()}`;
    const candidateId = body.candidateId ?? body.candidate ?? `candidate-${Math.floor(Math.random() * 1000)}`;
    const hired = typeof body.hired === "boolean" ? body.hired : true;
    const outcomeURI = body.outcomeURI ?? `mock://outcome-${Date.now()}`;

    const dataDir = path.join(process.cwd(), "data");
    const weightsPath = path.join(dataDir, "weights.json");
    const outcomesDir = path.join(dataDir, "outcomes");

    // ensure dirs
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(outcomesDir, { recursive: true });

    // read or create weights
    let prevWeights: Weights = DEFAULT_WEIGHTS;
    try {
      const raw = await fs.readFile(weightsPath, "utf8");
      prevWeights = JSON.parse(raw);
    } catch (err: any) {
      // create default
      await fs.writeFile(weightsPath, JSON.stringify(DEFAULT_WEIGHTS, null, 2));
      prevWeights = DEFAULT_WEIGHTS;
    }

    // create outcome object
    const outcome = {
      jobId,
      candidateId,
      hired,
      outcomeURI,
      timestamp: new Date().toISOString(),
      notes: body.notes ?? (hired ? "Simulated hire (successful)" : "Simulated hire (failed)"),
      metrics: {
        performanceScore: hired ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.3
      }
    };

    // save outcome file
    const fileName = `outcome-${Date.now()}-${Math.floor(Math.random()*10000)}.json`;
    const outcomeFile = path.join(outcomesDir, fileName);
    await fs.writeFile(outcomeFile, JSON.stringify(outcome, null, 2));

    // update weights: small adjustment based on hired true/false.
    const deltaScale = hired ? 0.03 : -0.02;
    const adjust: Weights = { ...prevWeights };

    adjust.skills = Math.max(0, (adjust.skills || 0) + deltaScale * (hired ? 1.0 : -1.0));
    adjust.experience = Math.max(0, (adjust.experience || 0) + deltaScale * 0.6 * (hired ? 1 : -1));
    adjust.location = Math.max(0, (adjust.location || 0) + deltaScale * 0.2 * (hired ? 1 : -1));
    adjust.salary = Math.max(0, (adjust.salary || 0) + deltaScale * 0.1 * (hired ? 1 : -1));
    adjust.education = Math.max(0, (adjust.education || 0) + deltaScale * 0.1 * (hired ? 1 : -1));

    // normalize so they sum to 1
    const newWeights = normalize(adjust);

    // write back
    await fs.writeFile(weightsPath, JSON.stringify(newWeights, null, 2));

    return NextResponse.json({
      success: true,
      outcomeFile: `/data/outcomes/${fileName}`,
      outcome,
      previousWeights: prevWeights,
      newWeights
    });
  } catch (err: any) {
    console.error("simulate-hire error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

