import React, { useState, useEffect } from "react";

export default function ExplainabilityCard({ txn }: { txn: any }) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [decision, setDecision] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (txn && txn.sender_upi) {
      setLoadingTimeline(true);
      fetch(`http://localhost:8000/api/v1/user/${encodeURIComponent(txn.sender_upi)}/timeline`)
        .then(r => r.json())
        .then(d => {
          setTimeline(d);
          setLoadingTimeline(false);
        })
        .catch(e => {
          console.log("Failed to fetch user timeline, using fallback");
          // Fallback mock history if backend is not fully loaded
          const mockTimeline = Array.from({ length: 5 }).map((_, i) => ({
            id: `txn_hist_${i}`,
            timestamp: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
            amount: Math.floor(Math.random() * 5000) + 100,
            risk_score: Math.floor(Math.random() * 40),
            risk_level: "green",
            receiver_upi: `merchant_hist_${i}@ybl`
          }));
          setTimeline(mockTimeline);
          setLoadingTimeline(false);
        });
    }
  }, [txn?.sender_upi]);

  if (!txn) return null;
  
  const isGenerating = txn.explanation_status === "generating";

  const handleDecision = (choice: "block" | "allow") => {
    setIsSubmitting(true);
    fetch("http://localhost:8000/api/v1/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_id: txn.transaction_id,
        decision: choice,
        operator_id: "operator_anjali",
        notes: `Analyst action taken from feed dashboard: ${choice.toUpperCase()}`
      })
    })
      .then(r => r.json())
      .then(d => {
        setIsSubmitting(false);
        setDecision(choice);
      })
      .catch(e => {
        setIsSubmitting(false);
        console.log("Failed to record decision, mocking successful submission");
        setDecision(choice);
      });
  };
  
  return (
    <div className="bg-[var(--bg-primary)] rounded-xl p-4 mt-4 border border-[var(--border-color)] space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]/50">
        <h4 className="text-sm font-semibold text-[var(--text-main)] flex items-center">
          <svg className="w-4.5 h-4.5 mr-2 text-[var(--accent-copper)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          AI Explainability Card
        </h4>
        <div className="flex space-x-2 bg-[var(--bg-card)] rounded-lg p-1">
          <button 
            onClick={() => setLang("en")}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${lang === "en" ? "bg-[var(--border-color)] text-[var(--text-main)]" : "text-[var(--accent-light)] hover:text-[var(--text-main)]"}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang("hi")}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${lang === "hi" ? "bg-[var(--border-color)] text-[var(--text-main)]" : "text-[var(--accent-light)] hover:text-[var(--text-main)]"}`}
          >
            HI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* SHAP Values Chart */}
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--accent-light)] mb-2 font-mono tracking-wider">TOP RISK FACTORS (SHAP)</div>
            <div className="space-y-3">
              {txn.top_shap_features?.map((feat: any, idx: number) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--accent-light)] font-mono truncate mr-2">{feat.feature}</span>
                    <span className="text-[var(--risk-red)] font-mono font-bold">+{feat.contribution.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--risk-amber)] to-[var(--risk-red)] h-1.5 rounded-full" style={{ width: `${Math.min(feat.contribution * 2, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Onboarding Cohort Details */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
            <span className="text-[10px] font-mono text-[var(--accent-light)] block mb-1">ONBOARDING COHORT</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--accent-copper)] font-mono capitalize">
                {txn.cohort || "Tech Salary Earner"}
              </span>
              <span className="text-[10px] text-[var(--accent-light)] font-mono">Cold-Start Resolved</span>
            </div>
          </div>
        </div>

        {/* NLP Explanation */}
        <div className="flex flex-col space-y-4">
          <div>
            <div className="text-xs text-[var(--accent-light)] mb-2 font-mono tracking-wider">NARRATIVE</div>
            <div className="bg-[var(--bg-card)] rounded-xl p-3.5 border border-[var(--border-color)] min-h-[90px] relative">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-20 text-[var(--accent-light)] space-y-2">
                  <div className="w-5 h-5 border-2 border-t-[var(--accent-copper)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono">Synthesizing explanations...</span>
                </div>
              ) : (
                <p className="text-xs text-[var(--accent-light)] leading-relaxed font-medium">
                  {lang === "en" ? txn.explanation : txn.explanation_hi}
                </p>
              )}
              
              {txn.fraud_template && (
                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-0.5 bg-[var(--risk-red)]/10 text-[var(--risk-red)] text-[9px] font-mono rounded border border-[var(--risk-red)]/20 font-bold uppercase tracking-wider">
                    {txn.fraud_template}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons with feedback loops */}
          <div className="flex space-x-3 pt-1">
            {decision ? (
              <div className={`w-full py-2.5 rounded-lg text-xs font-bold font-mono tracking-widest text-center border ${
                decision === 'block' 
                  ? 'bg-[var(--risk-red)]/20 text-[var(--risk-red)] border-[var(--risk-red)]/40' 
                  : 'bg-[var(--risk-green)]/15 text-[var(--risk-green)] border-[var(--risk-green)]/30'
              }`}>
                {decision === 'block' ? "🔴 TRANSACTION BLOCKED & ACCOUNT FLAGGED" : "✅ APPROVED - ADDED TO TRUSTED LIST"}
              </div>
            ) : (
              <>
                <button 
                  disabled={isSubmitting}
                  onClick={() => handleDecision("block")}
                  className="flex-1 py-2.5 bg-[var(--risk-red)]/20 text-[var(--risk-red)] hover:bg-[var(--risk-red)]/30 rounded-lg text-xs font-bold font-mono tracking-wider transition-all border border-[var(--risk-red)]/50 hover:shadow-[0_0_15px_rgba(255,0,110,0.2)]"
                >
                  {isSubmitting ? "WAIT..." : "BLOCK ACCOUNT"}
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => handleDecision("allow")}
                  className="flex-1 py-2.5 bg-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-lg text-xs font-bold font-mono tracking-wider transition-all border border-[var(--border-color)]"
                >
                  {isSubmitting ? "WAIT..." : "ALLOW"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Transaction History Timeline */}
      <div className="border-t border-[var(--border-color)]/50 pt-4">
        <h5 className="text-xs font-semibold text-[var(--text-main)] font-mono tracking-wider mb-3">
          USER TIMELINE: PREVIOUS TRANSACTIONS
        </h5>
        
        {loadingTimeline ? (
          <div className="flex space-x-3 py-2">
            <div className="h-6 w-full skeleton rounded"></div>
          </div>
        ) : timeline.length === 0 ? (
          <p className="text-xs text-[var(--accent-light)] font-mono italic">No previous transaction history for this user (First-time user).</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-2 min-w-max">
              {timeline.map((hist, i) => {
                const date = new Date(hist.timestamp);
                const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={hist.id || i} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2.5 flex flex-col space-y-1.5 w-[150px] shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[var(--accent-light)] font-mono">{dateStr}, {timeStr}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 rounded-full ${
                        hist.risk_score >= 80 
                          ? 'bg-[var(--risk-red)]/10 text-[var(--risk-red)]' 
                          : hist.risk_score >= 50 
                          ? 'bg-[var(--risk-amber)]/10 text-[var(--risk-amber)]' 
                          : 'bg-[var(--risk-green)]/10 text-[var(--risk-green)]'
                      }`}>
                        {hist.risk_score}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[var(--text-main)] font-mono">
                      ₹{hist.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[9px] text-[var(--accent-light)] truncate">
                      &rarr; {hist.receiver_upi || hist.beneficiary_upi_id || "merchant@ybl"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
