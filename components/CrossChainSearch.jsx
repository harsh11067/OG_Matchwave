// components/CrossChainSearch.jsx
import { useState } from 'react';

export default function CrossChainSearch() {
  const [skill, setSkill] = useState('');
  const [region, setRegion] = useState('');
  const [results, setResults] = useState([]);

  async function runSearch() {
    const res = await fetch(`/api/search-crosschain?skill=${encodeURIComponent(skill)}&region=${encodeURIComponent(region)}`);
    const json = await res.json();
    setResults(json.results || []);
  }

  return (
    <div>
      <div className="flex gap-2">
        <input placeholder="Skill (e.g. Solidity)" value={skill} onChange={e=>setSkill(e.target.value)} />
        <input placeholder="Region (e.g. India)" value={region} onChange={e=>setRegion(e.target.value)} />
        <button onClick={runSearch} className="btn-primary">Search</button>
      </div>

      <div className="mt-4 grid gap-3">
        {results.map(r => (
          <div key={`${r.chainId}-${r.id}`} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <strong>{r.metadata?.title || 'Job'}</strong>
                <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">{r.networkName}</span>
              </div>
              <div className="text-sm text-gray-600">{r.metadata?.company || r.owner}</div>
              <div className="text-xs mt-1">Match: {r.matchScore ?? '—'}%</div>
            </div>
            <div className="text-right">
              <a href={r.metadataURI ? `https://indexer-storage-testnet-turbo.0g.ai/preview/${r.metadataURI.replace('zgs://','')}` : '#'} target="_blank" rel="noreferrer" className="text-sm text-primary-600">View</a>
              <div className="mt-2 text-xs">{r.metadata?.location}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
