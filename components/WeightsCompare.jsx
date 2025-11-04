import { useState, useEffect } from "react";

function Bar({ label, value }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs">
        <div>{label}</div>
        <div>{(value).toFixed(3)}</div>
      </div>
      <div className="h-3 bg-gray-200 rounded overflow-hidden">
        <div style={{ width: `${Math.min(100, value*100)}%` }} className="h-full bg-green-500"></div>
      </div>
    </div>
  );
}

export default function WeightsCompare({ onRefresh }) {
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(false);

  async function fetchWeights(){
    setLoading(true);
    const res = await fetch('/api/get-weights');
    const json = await res.json();
    setWeights(json.weights || {});
    setLoading(false);
  }

  function handleCompareMatches() {
    // Scroll to MatchChangeView component or trigger its refresh
    const matchView = document.querySelector('[data-match-view]');
    if (matchView) {
      matchView.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Trigger a small highlight animation
      matchView.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        matchView.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
    // Call onRefresh if provided
    if (onRefresh) onRefresh();
  }

  useEffect(()=>{ fetchWeights(); }, []);

  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Adaptive Weights</h3>
        <div>
          <button onClick={fetchWeights} className="btn-secondary mr-2" disabled={loading}>
            {loading?'...':'Refresh'}
          </button>
          <button onClick={handleCompareMatches} className="btn-secondary">Compare Matches</button>
        </div>
      </div>

      {Object.keys(weights).length === 0 ? <p>No weights yet</p> : (
        Object.entries(weights).map(([k,v]) => <Bar key={k} label={k} value={v} />)
      )}
    </div>
  );
}
