import { useState, useEffect } from "react";

export default function MatchChangeView(){
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    setLoadingCandidates(true);
    try {
      const res = await fetch('/api/get-candidates');
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  }

  async function compare() {
    if (!selectedCandidateId) {
      alert('Please select a candidate');
      return;
    }
    
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    if (!candidate) {
      alert('Candidate not found');
      return;
    }

    setLoading(true);
    try {
      // fetch current weights
      const wRes = await fetch('/api/get-weights').then(r=>r.json());
      const prevWeights = wRes.weights; // copy as "before"
      // compute before (with prevWeights)
      const res = await fetch('/api/compare-match', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ candidate, previousWeights: prevWeights })
      }).then(r=>r.json());
      setResult(res);
    } catch (err) {
      console.error('Compare error:', err);
      alert('Failed to compare matches');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-transparent backdrop-blur-sm rounded-lg border border-gray-200/50 p-4 shadow-sm" data-match-view>
      <h3 className="font-bold text-black mb-2">Compare Match Rankings</h3>
      <p className="text-xs text-gray-600 mb-4">See how adaptive AI learning improves job matching accuracy</p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Candidate</label>
        <select 
          value={selectedCandidateId} 
          onChange={(e) => setSelectedCandidateId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loadingCandidates}
        >
          <option value="">-- Select a candidate --</option>
          {candidates.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email})
            </option>
          ))}
        </select>
        {loadingCandidates && <p className="text-xs text-gray-500 mt-1">Loading candidates...</p>}
      </div>
      <div className="flex gap-2">
        <button className="btn-primary" onClick={compare} disabled={loading || !selectedCandidateId}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
        <button className="btn-secondary" onClick={fetchCandidates} disabled={loadingCandidates}>
          {loadingCandidates ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {result && result.success && (
        <div className="mt-4 p-4 bg-transparent backdrop-blur-sm border border-gray-200/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-black mb-2">Before (Default Weights)</h4>
              <p className="text-xs text-gray-500 mb-2">Ranking with static/default weights</p>
              {result.before && result.before.length > 0 ? (
                result.before.slice(0,5).map((item, idx) => (
                  <div key={item.job?.id || idx} className="p-2 border border-gray-200 rounded mb-2 bg-white/50">
                    <div className="text-sm font-medium text-black">{item.job?.metadata?.title || item.job?.title || 'Job'}</div>
                    <div className="text-xs text-gray-600">Score: {Math.round(item.score)}%</div>
                    {item.job?.networkName && <div className="text-xs text-purple-600">{item.job.networkName}</div>}
                    <div className="text-xs text-gray-400">Rank: #{idx + 1}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">No before snapshot</div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-black mb-2">After (Adaptive Weights)</h4>
              <p className="text-xs text-gray-500 mb-2">Ranking with AI-learned weights</p>
              {result.after && result.after.length > 0 ? (
                result.after.slice(0,5).map((item, idx) => {
                  const beforeIdx = result.before?.findIndex((b) => b.job?.id === item.job?.id) ?? -1;
                  const rankChange = beforeIdx >= 0 ? (beforeIdx - idx) : 0;
                  return (
                    <div key={item.job?.id || idx} className={`p-2 border rounded mb-2 ${
                      rankChange > 0 ? 'border-green-500 bg-green-50/50' : rankChange < 0 ? 'border-red-500 bg-red-50/50' : 'border-gray-200 bg-white/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-black">{item.job?.metadata?.title || item.job?.title || 'Job'}</div>
                        {rankChange !== 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            rankChange > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rankChange > 0 ? '↑' : '↓'} {Math.abs(rankChange)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">Score: {Math.round(item.score)}%</div>
                      {item.job?.networkName && <div className="text-xs text-purple-600">{item.job.networkName}</div>}
                      <div className="text-xs text-gray-400">Rank: #{idx + 1}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-500">No after snapshot</div>
              )}
            </div>
          </div>
          {result.weights && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Current Adaptive Weights:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.weights).map(([key, value]) => (
                  <span key={key} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {key}: {(value * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
