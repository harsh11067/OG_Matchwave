// app/api/create-did/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { OGStorageService } from '@/lib/0g-storage';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { didDoc, signature, candidateId } = body;
    if (!didDoc || !signature) return NextResponse.json({ success:false, error:'didDoc and signature required' }, { status:400 });

    // Recover address from signature of the DID doc
    const message = JSON.stringify(didDoc);
    const signerAddress = ethers.verifyMessage(message, signature);

    // Ensure signerAddress matches controller in DID doc
    if (!didDoc.controller || didDoc.controller.toLowerCase() !== signerAddress.toLowerCase()) {
      return NextResponse.json({ success:false, error:'signature does not match controller' }, { status:400 });
    }

    // Upload DID doc + signature to 0G Storage (or mock)
    const storage = new OGStorageService(process.env.PRIVATE_KEY);
    const payload = { didDoc, signature, uploadedAt: new Date().toISOString() };
    const res = await storage.uploadJSON(payload);

    const didUri = res.storageURI; // Should be zgs://... on mainnet
    
    // Log if still getting mock URI
    if (didUri.startsWith('mock://')) {
      console.warn('⚠️ DID uploaded but got mock URI. Check 0G Storage configuration and private key.');
      console.warn('   Indexer URL:', process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || 'not set');
      console.warn('   Private Key:', process.env.PRIVATE_KEY ? 'set' : 'not set');
    } else {
      console.log('✅ DID uploaded to real 0G Storage:', didUri);
    }
    
    // Update candidate record with DID if candidateId is provided
    if (candidateId) {
      try {
        const candidatesPath = path.join(process.cwd(), 'data', 'candidates.json');
        const raw = await fs.readFile(candidatesPath, 'utf8');
        const candidates = JSON.parse(raw);
        const candidateIndex = candidates.findIndex((c: any) => c.id === candidateId);
        if (candidateIndex !== -1) {
          candidates[candidateIndex].did = didDoc.id;
          candidates[candidateIndex].didUri = didUri;
          await fs.writeFile(candidatesPath, JSON.stringify(candidates, null, 2), 'utf8');
        }
        
        // Also update in Zustand store if available (client-side will sync)
        // This ensures the UI updates immediately
      } catch (err) {
        console.error('Failed to update candidate DID:', err);
      }
    }
    
    return NextResponse.json({ success:true, did: didDoc.id, didUri, storageRes: res });
  } catch (err:any) {
    console.error('create-did error', err);
    return NextResponse.json({ success:false, error: err.message }, { status:500 });
  }
}
