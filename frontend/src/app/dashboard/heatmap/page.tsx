"use client";

import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/@observablehq/world-atlas@1/countries-110m.json";

export default function HeatmapPage() {
  const [points, setPoints] = useState<any[]>([]);
  const [tooltip, setTooltip] = useState<{content: any, x: number, y: number} | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/heatmap")
      .then(r => r.json())
      .then(d => {
        if (d && d.length > 0) {
          setPoints(d);
        } else {
          // Mock data
          const mock = Array.from({ length: 50 }).map(() => ({
            lon: 72 + Math.random() * 15, // India longitude range roughly 68 to 97
            lat: 10 + Math.random() * 20, // India latitude range roughly 8 to 37
            amount: Math.random() * 100000,
            risk_level: Math.random() > 0.8 ? "red" : (Math.random() > 0.5 ? "yellow" : "green")
          }));
          setPoints(mock);
        }
      })
      .catch(e => console.log("Heatmap fetch failed"));
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-ui-card border border-ui-border rounded-xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ui-text">India Fraud Heatmap</h2>
          <p className="text-base text-ui-muted">Geographical distribution of risky transactions</p>
        </div>
      </div>

      <div className="flex-1 bg-ui-card border border-ui-border rounded-xl shadow-sm overflow-hidden relative">
        <ComposableMap
          projectionConfig={{
            scale: 1200,
            center: [82, 22] // Center on India
          }}
          className="w-full h-full"
        >
          <ZoomableGroup zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="rgba(63, 60, 57, 0.5)"
                    stroke="#1C1B1A"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "rgba(63, 60, 57, 0.8)", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {points.map((pt, i) => (
              <Marker key={i} coordinates={[pt.lon, pt.lat]}>
                <circle 
                  r={Math.max(2, (pt.amount / 10000))} 
                  fill={pt.risk_level === "red" ? "#E05243" : (pt.risk_level === "yellow" ? "#F0A04B" : "#7D9C65")}
                  fillOpacity={pt.risk_level === "red" ? 0.8 : 0.4}
                  stroke="none"
                  onMouseEnter={(e) => {
                    setTooltip({
                      content: pt,
                      x: e.pageX,
                      y: e.pageY
                    });
                  }}
                  onMouseLeave={() => {
                    setTooltip(null);
                  }}
                  onMouseMove={(e) => {
                    setTooltip({
                      content: pt,
                      x: e.pageX,
                      y: e.pageY
                    });
                  }}
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
        
        {tooltip && (
          <div 
            className="absolute z-50 bg-ui-card/90 backdrop-blur-md p-4 border border-ui-border shadow-lg rounded-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px]"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="font-bold text-ui-text mb-2 tracking-tight">Transaction Node</div>
            <div className="text-ui-muted text-sm font-mono mb-1">Location: {tooltip.content.lat.toFixed(2)}, {tooltip.content.lon.toFixed(2)}</div>
            <div className="text-ui-muted text-sm font-mono mb-2">Amount: ₹{tooltip.content.amount.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
            <div className="flex items-center mt-2">
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                tooltip.content.risk_level === "red" ? "bg-ui-riskRed/10 text-ui-riskRed border border-ui-riskRed/20" : 
                tooltip.content.risk_level === "yellow" ? "bg-ui-riskAmber/10 text-ui-riskAmber border border-ui-riskAmber/20" : 
                "bg-ui-riskGreen/10 text-ui-riskGreen border border-ui-riskGreen/20"
              }`}>
                {tooltip.content.risk_level} RISK
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
