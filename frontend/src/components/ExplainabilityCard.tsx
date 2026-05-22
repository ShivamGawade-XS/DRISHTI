import React, { useState } from "react";

export default function ExplainabilityCard({ txn }: { txn: any }) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  
  if (!txn) return null;
  
  const isGenerating = txn.explanation_status === "generating";
  
  return (
    <div className="bg-[#0a0f1e] rounded-xl p-4 mt-4 border border-[#1e293b]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-white flex items-center">
          <svg className="w-4 h-4 mr-2 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          AI Explainability Card
        </h4>
        <div className="flex space-x-2 bg-[#111827] rounded-lg p-1">
          <button 
            onClick={() => setLang("en")}
            className={`text-xs px-2 py-1 rounded ${lang === "en" ? "bg-[#1e293b] text-white" : "text-slate-500 hover:text-white"}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang("hi")}
            className={`text-xs px-2 py-1 rounded ${lang === "hi" ? "bg-[#1e293b] text-white" : "text-slate-500 hover:text-white"}`}
          >
            HI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* SHAP Values Chart */}
        <div>
          <div className="text-xs text-slate-400 mb-2 font-mono">TOP RISK FACTORS (SHAP)</div>
          <div className="space-y-3">
            {txn.top_shap_features?.map((feat: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-mono truncate mr-2">{feat.feature}</span>
                  <span className="text-[#ff006e] font-mono">+{feat.contribution.toFixed(1)}</span>
                </div>
                <div className="w-full bg-[#1e293b] rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-[#ffbe0b] to-[#ff006e] h-1.5 rounded-full" style={{ width: `${Math.min(feat.contribution * 2, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NLP Explanation */}
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 mb-2 font-mono">NARRATIVE</div>
          <div className="flex-1 bg-[#111827] rounded-lg p-3 border border-[#1e293b] relative">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <div className="w-5 h-5 border-2 border-t-[#00d4ff] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-mono">Synthesizing...</span>
              </div>
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed">
                {lang === "en" ? txn.explanation : txn.explanation_hi}
              </p>
            )}
            
            {txn.fraud_template && (
              <div className="absolute bottom-3 right-3">
                <span className="px-2 py-1 bg-[#ff006e]/20 text-[#ff006e] text-[10px] font-mono rounded border border-[#ff006e]/30">
                  {txn.fraud_template}
                </span>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-3 mt-4">
            <button className="flex-1 py-2 bg-[#ff006e]/20 text-[#ff006e] hover:bg-[#ff006e]/30 rounded-lg text-sm font-semibold transition-colors border border-[#ff006e]/50">
              Block Account
            </button>
            <button className="flex-1 py-2 bg-[#1e293b] text-white hover:bg-[#334155] rounded-lg text-sm font-semibold transition-colors">
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
