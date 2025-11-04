// components/CreateDidButton.tsx (React client)
'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

interface CreateDidButtonProps {
  walletAddress?: string | null;
  candidateId?: string | null;
}

export default function CreateDidButton({ walletAddress, candidateId }: CreateDidButtonProps) {
  const [status, setStatus] = useState('');
  const [didUri, setDidUri] = useState('');

  async function createDid() {
    try {
      if (!window.ethereum) return alert('Please install MetaMask');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // build simple DID doc
      const did = `did:ethr:${address}`;
      const didDoc = {
        id: did,
        controller: address,
        createdAt: new Date().toISOString(),
        // optionally add resume rootHash or storageURI if available
      };
      const message = JSON.stringify(didDoc);
      setStatus('Requesting wallet signature...');
      const signature = await signer.signMessage(message);

      setStatus('Uploading DID document...');
      const res = await fetch('/api/create-did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          didDoc, 
          signature,
          candidateId: candidateId || null // Pass candidate ID if available
        })
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'Failed');
      setDidUri(j.didUri);
      setStatus('✅ DID created: ' + j.did);
      
      // Update Zustand store if candidateId is available
      if (candidateId) {
        try {
          const { useAppStore } = await import('../lib/store');
          useAppStore.getState().updateCandidate(candidateId, {
            did: j.did,
            didUri: j.didUri
          });
        } catch (err) {
          console.warn('Failed to update store:', err);
        }
      }
      
      // Refresh page or update UI to show DID
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err:any) {
      console.error(err);
      setStatus('Error: ' + (err.message || err));
    }
  }

  return (
    <div>
      <button onClick={createDid} className="btn-primary">Create DID</button>
      <div className="text-sm mt-2">{status}</div>
      {didUri && <div className="mt-2">DID URI: <a target="_blank" rel="noreferrer" href={didUri}>{didUri}</a></div>}
    </div>
  );
}
