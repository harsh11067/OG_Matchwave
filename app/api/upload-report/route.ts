import { NextRequest, NextResponse } from 'next/server';
import { OGStorageService } from '@/lib/0g-storage';

export async function POST(request: NextRequest) {
  try {
    const { report } = await request.json();
    
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'No report provided' },
        { status: 400 }
      );
    }

    // Get private key from request headers (in production, use proper auth)
    const privateKey = request.headers.get('x-private-key');
    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: 'Private key not provided' },
        { status: 401 }
      );
    }

    const storageService = new OGStorageService(privateKey);
    const result = await storageService.uploadReport(report);
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Report upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload report' },
      { status: 500 }
    );
  }
}

