import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const p = path.join(process.cwd(), 'data', 'candidates.json');
    const raw = await fs.readFile(p, 'utf8');
    const candidates = JSON.parse(raw);
    return NextResponse.json({ success:true, candidates });
  } catch (err:any) {
    if (err.code === 'ENOENT') return NextResponse.json({ success:true, candidates: [] });
    return NextResponse.json({ success:false, error: err.message }, { status:500 });
  }
}
