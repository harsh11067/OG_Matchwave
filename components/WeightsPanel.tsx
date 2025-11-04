// components/WeightsPanel.tsx
"use client";
import React, { useEffect, useState } from "react";

type Weights = Record<string, number>;

export default function WeightsPanel() {
  const [weights, setWeights] = useState<Weights | null>(null);
  const [prev, setPrev] = useState<Weights | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<any>(null);

  async function fetchWeights() {
    const res = await fetch("/api/get-weights");
    const json = await res.json();
    if (json.success && json.weights) setWeights(json.weights);
  }

  useEffect(() => { fetchWeights(); }, []);

  function format(n?: number) { return (typeof n === "number" ? (n*100).toFixed(1)+"%" : "-"); }

  async function simulateHire() {
    setLoading(true);
    setPrev(weights);
    try {
      const res = await fetch("/api/simulate-hire", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ hired: true }) });
      const json = await res.json();
      if (json.success) {
        setLastOutcome(json.outcome);
        setWeights(json.newWeights);
      } else {
        alert("Simulate failed: " + (json.error || "unknown"));
      }
    } catch (err: any) {
      alert("Simulate failed: " + err.message);
    } finally { setLoading(false); }
  }

  if (!weights) return <div className="p-4 bg-transparent backdrop-blur-sm rounded border border-gray-200/50">Loading weights...</div>;

  return (
    <div className="p-4 bg-transparent backdrop-blur-sm rounded border border-gray-200/50 shadow-sm space-y-4">
      <h3 className="text-lg font-medium text-black">Adaptive Weights</h3>

      <div className="grid grid-cols-2 gap-2">
        {Object.keys(weights).map(key => (
          <div key={key} className="p-2 border rounded">
            <div className="text-sm text-gray-500">{key}</div>
            <div className="text-xl font-semibold">{format(weights[key])}</div>
            <div className="text-xs text-gray-400">
              {prev ? format(weights[key] - (prev[key]||0)).replace("-", "") : ""}
              {prev && (weights[key] > (prev[key]||0) ? <span className="text-green-600 ml-2">▲</span> : (weights[key] < (prev[key]||0) ? <span className="text-red-600 ml-2">▼</span> : null))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <button onClick={fetchWeights} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm">Refresh</button>
        <button onClick={simulateHire} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-sm" disabled={loading}>
          {loading ? "Simulating..." : "Simulate Successful Hire"}
        </button>
      </div>

      {lastOutcome && (
        <div className="mt-3 p-3 bg-transparent backdrop-blur-sm border border-gray-200/50 rounded text-sm">
          <div><strong className="text-black">Outcome:</strong> <span className="text-gray-700">{lastOutcome.outcomeURI ?? "—"}</span></div>
          <div><strong className="text-black">Job:</strong> <span className="text-gray-700">{lastOutcome.jobId}</span></div>
          <div><strong className="text-black">Candidate:</strong> <span className="text-gray-700">{lastOutcome.candidateId}</span></div>
        </div>
      )}
    </div>
  );
}
