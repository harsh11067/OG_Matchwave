import { NextRequest, NextResponse } from 'next/server';
import { OGStorageService } from '../../lib/0g-storage';

export async function POST(request: NextRequest) {
  try {
    const { credential, privateKey } = await request.json();

    if (!credential || !privateKey) {
      return NextResponse.json(
        { success: false, error: 'Missing credential data or private key' },
        { status: 400 }
      );
    }

    // Upload credential JSON to 0G Storage
    const storage = new OGStorageService(privateKey);
    const result = await storage.uploadJSON(credential);

    return NextResponse.json({
      success: true,
      result: {
        rootHash: result.rootHash,
        storageURI: result.storageURI,
        txHash: result.txHash,
      },
    });
  } catch (error: any) {
    console.error('❌ Upload Credential Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
