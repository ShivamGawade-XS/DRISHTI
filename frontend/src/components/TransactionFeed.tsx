import React, { useState, useEffect, useRef } from "react";
import ExplainabilityCard from "./ExplainabilityCard";

export default function TransactionFeed() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expandedTxn, setExpandedTxn] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Generate initial mock data just in case backend isn't ready
    const mockData = Array.from({ length: 15 }).map((_, i) => ({
      transaction_id: `txn_mock_${Math.floor(Math.random() * 100000)}`,
      sender_upi: `user${i}@okaxis`,
      receiver_upi: `merchant${i}@ybl`,
      amount: Math.floor(Math.random() * 15000),
      timestamp: new Date(Date.now() - i * 5000).toISOString(),
      risk_score: Math.floor(Math.random() * 100),
      risk_level: ["green", "yellow", "red"][Math.floor(Math.random() * 3)],
      top_shap_features: [
        { feature: 'amount_vs_7d_avg', contribution: 15 + Math.random() * 20 },
        { feature: 'new_device_flag', contribution: 10 + Math.random() * 15 },
        { feature: 'is_night', contribution: 5 + Math.random() * 10 },
      ],
      explanation: "User's typical daily spend is much lower; this transfer is significantly higher than normal. Transaction originated from an unrecognized device.",
      explanation_hi: "उपयोगकर्ता का सामान्य दैनिक खर्च बहुत कम है। लेनदेन एक अज्ञात डिवाइस से शुरू किया गया था।",
      explanation_status: "ready"
    }));
    setTransactions(mockData);

    // Connect WebSocket
    try {
      const ws = new WebSocket("ws://localhost:8000/ws/transactions");
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "explanation_ready") {
          // Update explanation for existing transaction
          setTransactions(prev => prev.map(t => 
            t.transaction_id === data.transaction_id 
              ? { ...t, explanation: data.explanation, explanation_hi: data.explanation_hi, explanation_status: "ready" } 
              : t
          ));
        } else {
          // New transaction
          setTransactions(prev => [data, ...prev].slice(0, 50));
        }
      };

      return () => {
        ws.close();
      };
    } catch (e) {
      console.log("WebSocket failed, using mock data");
    }
  }, []);

  const getRiskColor = (level: string) => {
    if (level === "red") return "text-[#ff006e]";
    if (level === "yellow") return "text-[#ffbe0b]";
    return "text-[#00f5a0]";
  };

  const getRiskBg = (level: string) => {
    if (level === "red") return "bg-[#ff006e]/10 border-[#ff006e]/30";
    if (level === "yellow") return "bg-[#ffbe0b]/10 border-[#ffbe0b]/30";
    return "bg-[#00f5a0]/5 border-[#00f5a0]/10";
  };

  return (
    <div className="flex flex-col">
      {/* Header Row */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-mono text-slate-500 sticky top-0 bg-[#0a0f1e] z-10 border-b border-[#1e293b]">
        <div className="col-span-2">TIME</div>
        <div className="col-span-3">SENDER &rarr; RECEIVER</div>
        <div className="col-span-2 text-right">AMOUNT</div>
        <div className="col-span-3">RISK SCORE</div>
        <div className="col-span-2 text-center">ACTION</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#1e293b]/50">
        {transactions.map((txn, idx) => {
          const timeStr = new Date(txn.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
          const isExpanded = expandedTxn === txn.transaction_id;
          
          return (
            <div key={`${txn.transaction_id}-${idx}`} className="flex flex-col">
              <div 
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transaction-row ${isExpanded ? 'bg-[#1e293b]/30' : ''}`}
                onClick={() => setExpandedTxn(isExpanded ? null : txn.transaction_id)}
              >
                {/* Time */}
                <div className="col-span-2 text-sm text-slate-400 font-mono">
                  {timeStr}
                </div>
                
                {/* Flow */}
                <div className="col-span-3 flex flex-col justify-center">
                  <span className="text-sm text-white truncate">{txn.sender_upi}</span>
                  <span className="text-xs text-slate-500 truncate mt-0.5">&rarr; {txn.receiver_upi}</span>
                </div>
                
                {/* Amount */}
                <div className="col-span-2 text-right text-sm font-mono text-slate-300">
                  ₹{txn.amount.toLocaleString('en-IN')}
                </div>
                
                {/* Risk Bar */}
                <div className="col-span-3 flex items-center space-x-3">
                  <div className="flex-1 bg-[#0a0f1e] rounded-full h-2 overflow-hidden border border-[#1e293b]">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${txn.risk_level === 'red' ? 'bg-[#ff006e]' : txn.risk_level === 'yellow' ? 'bg-[#ffbe0b]' : 'bg-[#00f5a0]'}`} 
                      style={{ width: `${txn.risk_score}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-mono font-bold w-6 ${getRiskColor(txn.risk_level)}`}>
                    {txn.risk_score}
                  </span>
                </div>
                
                {/* Status Badge */}
                <div className="col-span-2 flex justify-center">
                  <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded-full border ${getRiskBg(txn.risk_level)} ${txn.risk_level === 'red' ? 'risk-pulse-red' : ''}`}>
                    {txn.risk_level.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Expansion Panel */}
              {isExpanded && (
                <div className="px-6 pb-4 bg-[#1e293b]/10 border-b border-[#00d4ff]/20">
                  {(txn.risk_level === "red" || txn.risk_level === "yellow") ? (
                    <ExplainabilityCard txn={txn} />
                  ) : (
                    <div className="text-sm text-slate-400 p-4 text-center italic">
                      Low risk transaction. Auto-approved.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
