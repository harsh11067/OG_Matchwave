import { NextRequest, NextResponse } from 'next/server';
import { OGStorageService } from '@/lib/0g-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
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
    const result = await storageService.uploadResume(file);
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
}

