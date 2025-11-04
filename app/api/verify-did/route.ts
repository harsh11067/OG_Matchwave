// app/api/verify-did/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { storageURI } = await req.json();
    if (!storageURI) return NextResponse.json({ success: false, error: 'storageURI required' }, { status: 400 });

    if (storageURI.startsWith('mock://')) {
      const hash = storageURI.replace('mock://', '');
      const file = path.join(process.cwd(), 'data', 'storage', `${hash}.json`);
      const raw = await fs.readFile(file, 'utf8');
      const wrapper = JSON.parse(raw);
      const payload = wrapper.content;
      // content may be base64 or JSON string; attempt parse
      let docObj;
      try {
        docObj = JSON.parse(payload);
      } catch {
        // if base64: decode and parse
        const decoded = Buffer.from(payload, 'base64').toString('utf8');
        docObj = JSON.parse(decoded);
      }
      const didDoc = docObj.didDoc;
      const signature = docObj.signature;
      if (!didDoc || !signature) return NextResponse.json({ success: false, error: 'didDoc or signature missing' }, { status: 400 });

      const message = JSON.stringify(didDoc);
      const recovered = ethers.verifyMessage(message, signature);
      const valid = recovered.toLowerCase() === (didDoc.controller || '').toLowerCase();
      return NextResponse.json({ success: true, valid, recovered, didDoc });
    } else if (storageURI.startsWith('zgs://')) {
      // For real zgs:// storage - fetch from 0G indexer/storage API
      const hash = storageURI.replace('zgs://', '');
      const indexerUrl = process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai';
      const previewUrl = `${indexerUrl}/preview/${hash}`;
      
      try {
        const res = await fetch(previewUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch from 0G Storage: ${res.statusText}`);
        }
        const wrapper = await res.json();
        const payload = wrapper.content || wrapper;
        
        // Parse payload (may be nested)
        let docObj: any;
        if (typeof payload === 'string') {
          try {
            docObj = JSON.parse(payload);
          } catch {
            docObj = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
          }
        } else {
          docObj = payload;
        }
        
        const didDoc = docObj.didDoc || docObj;
        const signature = docObj.signature;
        
        if (!didDoc || !signature) {
          return NextResponse.json({ success: false, error: 'didDoc or signature missing' }, { status: 400 });
        }

        const message = JSON.stringify(didDoc);
        const recovered = ethers.verifyMessage(message, signature);
        const valid = recovered.toLowerCase() === (didDoc.controller || '').toLowerCase();
        return NextResponse.json({ success: true, valid, recovered, didDoc });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Failed to verify from 0G Storage: ${err.message}` }, { status: 500 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Invalid storageURI format (must be mock:// or zgs://)' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
