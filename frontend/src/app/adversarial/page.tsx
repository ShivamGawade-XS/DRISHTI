"use client";

import React, { useState } from "react";
import ExplainabilityCard from "../../components/ExplainabilityCard";

export default function AdversarialPage() {
  const [formData, setFormData] = useState({
    amount: 15000,
    timestamp: new Date().toISOString(),
    is_new_beneficiary: false,
    new_device_flag: false,
    txn_count_1h: 1,
    amount_avg_1h: 1000
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create full payload matching TransactionRequest
      const payload = {
        transaction_id: `adv_${Math.floor(Math.random()*10000)}`,
        sender_upi: "attacker@upi",
        receiver_upi: "victim@upi",
        amount: formData.amount,
        timestamp: formData.timestamp,
        device_id: formData.new_device_flag ? "new_device_xyz" : "known_device_abc",
        lat: 19.0,
        lon: 72.0
      };

      const res = await fetch("http://localhost:8000/api/v1/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      // Since explanation is generated async, we wait 1s and fetch it, or just show the SHAP values
      // For this hackathon demo, the explainability card will handle "generating" state 
      // but without WS it might stay stuck, so we mock explanation if needed.
      if (!data.explanation) {
        data.explanation = "Simulated explanation for adversarial transaction.";
        data.explanation_hi = "प्रतिकूल लेनदेन के लिए नकली स्पष्टीकरण।";
        data.explanation_status = "ready";
      }
      
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (preset: string) => {
    if (preset === "OTP Relay") {
      setFormData({ ...formData, amount: 95000, is_new_beneficiary: true, new_device_flag: true, txn_count_1h: 3, amount_avg_1h: 1000, timestamp: new Date().toISOString() });
    } else if (preset === "Mule Funnel") {
      setFormData({ ...formData, amount: 2000, is_new_beneficiary: false, new_device_flag: false, txn_count_1h: 15, amount_avg_1h: 2000, timestamp: new Date().toISOString() });
    } else if (preset === "Night Burst") {
      const nightTime = new Date(); nightTime.setHours(2, 30);
      setFormData({ ...formData, amount: 45000, is_new_beneficiary: true, new_device_flag: false, txn_count_1h: 5, amount_avg_1h: 500, timestamp: nightTime.toISOString() });
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="glass-card p-4">
        <h2 className="text-xl font-bold text-white">Adversarial Simulation Lab</h2>
        <p className="text-sm text-slate-400">Inject custom payloads to stress-test the LightGBM & Rule Engine</p>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Craft Payload</h3>
            <div className="space-x-2">
              <button onClick={() => setPreset("OTP Relay")} className="text-xs bg-[#ff006e]/20 text-[#ff006e] px-2 py-1 rounded">OTP Relay</button>
              <button onClick={() => setPreset("Mule Funnel")} className="text-xs bg-[#ffbe0b]/20 text-[#ffbe0b] px-2 py-1 rounded">Mule Funnel</button>
              <button onClick={() => setPreset("Night Burst")} className="text-xs bg-[#00d4ff]/20 text-[#00d4ff] px-2 py-1 rounded">Night Burst</button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">AMOUNT (₹)</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                className="w-full bg-[#0a0f1e] border border-[#1e293b] rounded p-2 text-white outline-none focus:border-[#00d4ff]"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">TIMESTAMP</label>
              <input 
                type="text" 
                value={formData.timestamp}
                onChange={e => setFormData({...formData, timestamp: e.target.value})}
                className="w-full bg-[#0a0f1e] border border-[#1e293b] rounded p-2 text-white outline-none focus:border-[#00d4ff]"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="new_device"
                checked={formData.new_device_flag}
                onChange={e => setFormData({...formData, new_device_flag: e.target.checked})}
                className="bg-[#0a0f1e] border border-[#1e293b]"
              />
              <label htmlFor="new_device" className="text-sm text-slate-300">New Unrecognized Device</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="new_ben"
                checked={formData.is_new_beneficiary}
                onChange={e => setFormData({...formData, is_new_beneficiary: e.target.checked})}
                className="bg-[#0a0f1e] border border-[#1e293b]"
              />
              <label htmlFor="new_ben" className="text-sm text-slate-300">New Beneficiary</label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#ffbe0b] to-[#ff006e] text-white font-bold rounded hover:opacity-90 transition-opacity"
            >
              {loading ? "INJECTING..." : "INJECT PAYLOAD"}
            </button>
          </form>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Engine Response</h3>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0a0f1e] rounded border border-[#1e293b]">
                <span className="text-slate-400 font-mono text-sm">RISK SCORE</span>
                <span className={`text-2xl font-bold ${result.risk_level === 'red' ? 'text-[#ff006e]' : result.risk_level === 'yellow' ? 'text-[#ffbe0b]' : 'text-[#00f5a0]'}`}>
                  {result.risk_score}
                </span>
              </div>
              
              {result.rule_flags?.length > 0 && (
                <div className="p-4 bg-[#0a0f1e] rounded border border-[#1e293b]">
                  <span className="text-slate-400 font-mono text-sm block mb-2">RULES FIRED</span>
                  <div className="flex flex-wrap gap-2">
                    {result.rule_flags.map((r: string) => (
                      <span key={r} className="px-2 py-1 text-xs bg-[#1e293b] text-white rounded font-mono">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              <ExplainabilityCard txn={result} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 italic text-sm border border-dashed border-[#1e293b] rounded">
              Awaiting payload injection...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
