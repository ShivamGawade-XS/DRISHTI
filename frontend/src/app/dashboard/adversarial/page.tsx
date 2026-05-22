"use client";

import React, { useState } from "react";
import { PayloadForm } from "./components/PayloadForm";
import { SimulationResult } from "./components/SimulationResult";

export default function AdversarialPage() {
  const [formData, setFormData] = useState({
    amount: 15000,
    timestamp: new Date().toISOString(),
    is_new_beneficiary: false,
    new_device_flag: false,
    txn_count_1h: 1,
    amount_avg_1h: 1000,
    fraud_template: ""
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        transaction_id: `adv_${Math.floor(Math.random()*10000)}`,
        sender_upi: "attacker@upi",
        receiver_upi: "victim@upi",
        amount: formData.amount,
        timestamp: formData.timestamp,
        device_id: formData.new_device_flag ? "new_device_xyz" : "known_device_abc",
        lat: 19.0,
        lon: 72.0,
        is_new_beneficiary: formData.is_new_beneficiary,
        new_device_flag: formData.new_device_flag,
        txn_count_1h: formData.txn_count_1h,
        amount_avg_1h: formData.amount_avg_1h,
        fraud_template: formData.fraud_template ? formData.fraud_template : undefined
      };

      const res = await fetch("http://localhost:8000/api/v1/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
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

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col space-y-2 mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-ui-text">Adversarial Simulation Lab</h2>
        <p className="text-base text-ui-muted">Inject custom payloads to stress-test the LightGBM & Rule Engine constraints.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-y-auto pb-8">
        <PayloadForm 
          formData={formData} 
          setFormData={setFormData} 
          handleSubmit={handleSubmit} 
          loading={loading} 
        />
        <SimulationResult result={result} />
      </div>
    </div>
  );
}
