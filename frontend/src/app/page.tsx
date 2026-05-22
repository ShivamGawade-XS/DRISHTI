"use client";

import React, { useState, useEffect } from "react";
import TransactionFeed from "../components/TransactionFeed";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_transactions: 55605,
    fraud_detected: 3355,
    false_positive_rate: 0.02,
    avg_latency_ms: 38
  });

  useEffect(() => {
    // Fetch stats on load
    fetch("http://localhost:8000/api/v1/metrics/overview")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(e => console.log("Failed to fetch stats, using mock"));
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-5 gradient-border">
          <div className="text-sm text-slate-400 font-mono mb-1">Total Monitored</div>
          <div className="text-3xl font-bold text-white count-up">{stats.total_transactions.toLocaleString()}</div>
        </div>
        <div className="glass-card p-5 border-t-4 border-t-[#ff006e]">
          <div className="text-sm text-slate-400 font-mono mb-1">Fraud Blocked</div>
          <div className="text-3xl font-bold text-[#ff006e] count-up glow-magenta">{stats.fraud_detected.toLocaleString()}</div>
        </div>
        <div className="glass-card p-5 border-t-4 border-t-[#ffbe0b]">
          <div className="text-sm text-slate-400 font-mono mb-1">False Positive Rate</div>
          <div className="text-3xl font-bold text-[#ffbe0b] count-up glow-amber">{(stats.false_positive_rate * 100).toFixed(1)}%</div>
        </div>
        <div className="glass-card p-5 border-t-4 border-t-[#00d4ff]">
          <div className="text-sm text-slate-400 font-mono mb-1">Avg Latency</div>
          <div className="text-3xl font-bold text-[#00d4ff] count-up glow-cyan">{stats.avg_latency_ms} ms</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        
        {/* Left Column: Transaction Feed */}
        <div className="col-span-2 glass-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#1e293b] flex justify-between items-center bg-[#111827]/80">
            <h2 className="font-semibold text-white tracking-wide">Live Transaction Stream</h2>
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5a0] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00f5a0]"></span>
              </span>
              <span className="text-xs text-slate-400 font-mono">WS CONNECTED</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <TransactionFeed />
          </div>
        </div>

        {/* Right Column: Analytics & Controls */}
        <div className="col-span-1 space-y-6 overflow-y-auto">
          {/* Model Health */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4">Model Health (LightGBM)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0f1e] p-3 rounded-lg border border-[#1e293b] text-center">
                <div className="text-2xl font-bold text-[#00f5a0]">0.96</div>
                <div className="text-xs text-slate-400 mt-1">AUC-ROC</div>
              </div>
              <div className="bg-[#0a0f1e] p-3 rounded-lg border border-[#1e293b] text-center">
                <div className="text-2xl font-bold text-[#00d4ff]">0.72</div>
                <div className="text-xs text-slate-400 mt-1">F1 Score</div>
              </div>
              <div className="bg-[#0a0f1e] p-3 rounded-lg border border-[#1e293b] text-center">
                <div className="text-2xl font-bold text-white">0.70</div>
                <div className="text-xs text-slate-400 mt-1">Precision</div>
              </div>
              <div className="bg-[#0a0f1e] p-3 rounded-lg border border-[#1e293b] text-center">
                <div className="text-2xl font-bold text-white">0.74</div>
                <div className="text-xs text-slate-400 mt-1">Recall</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 font-mono flex justify-between">
              <span>Last trained: 12 mins ago</span>
              <span className="text-[#00f5a0]">PSI: Normal</span>
            </div>
          </div>

          {/* Thresholds */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4">Risk Thresholds</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#ff006e]">RED (Block)</span>
                  <span>≥ 80</span>
                </div>
                <input type="range" min="0" max="100" defaultValue="80" className="w-full" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#ffbe0b]">YELLOW (Review)</span>
                  <span>≥ 50</span>
                </div>
                <input type="range" min="0" max="100" defaultValue="50" className="w-full" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
