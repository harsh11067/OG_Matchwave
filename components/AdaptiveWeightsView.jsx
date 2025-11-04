import { useState, useEffect } from 'react';

export default function AdaptiveWeightsView() {
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(false);

  async function fetchWeights() {
    setLoading(true);
    const res = await fetch('/api/get-weights');
    const data = await res.json();
    setWeights(data.weights || {});
    setLoading(false);
  }

  useEffect(() => {
    fetchWeights();
  }, []);

  return (
    <div className="card p-4">
      <h3 className="text-lg font-bold mb-2">Adaptive Model Weights</h3>
      <button onClick={fetchWeights} className="btn-secondary mb-3">
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
      <table className="text-sm w-full">
        <thead>
          <tr>
            <th className="text-left">Feature</th>
            <th className="text-right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(weights).map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td className="text-right">{v.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
