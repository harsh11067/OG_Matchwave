import { NextRequest, NextResponse } from 'next/server';
import { OGComputeService } from '@/lib/0g-compute';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, preferences } = await request.json();
    
    const computeService = new OGComputeService();
    const analysis = await computeService.analyzeResume(resumeText, preferences);
    
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Resume analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}

