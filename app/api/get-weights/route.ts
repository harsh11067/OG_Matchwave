import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const weightsPath = path.join(process.cwd(), 'data', 'weights.json');
    
    try {
      const raw = await fs.readFile(weightsPath, 'utf8');
      const weights = JSON.parse(raw);
      return NextResponse.json({ success: true, weights });
    } catch (err: any) {
      // If file doesn't exist, return default weights
      if (err.code === 'ENOENT') {
        const defaultWeights = {
          skills: 0.4,
          location: 0.2,
          salary: 0.15,
          education: 0.15,
          experience: 0.1
        };
        // Create directory if it doesn't exist
        await fs.mkdir(path.dirname(weightsPath), { recursive: true });
        await fs.writeFile(weightsPath, JSON.stringify(defaultWeights, null, 2));
        return NextResponse.json({ success: true, weights: defaultWeights });
      }
      throw err;
    }
  } catch (err: any) {
    console.error('get-weights error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

