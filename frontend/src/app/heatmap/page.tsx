"use client";

import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/@observablehq/world-atlas@1/countries-110m.json";

export default function HeatmapPage() {
  const [points, setPoints] = useState<any[]>([]);

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
      <div className="glass-card p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">India Fraud Heatmap</h2>
          <p className="text-sm text-slate-400">Geographical distribution of risky transactions</p>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-hidden relative bg-[#050a14]">
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
                    fill="#1e293b"
                    stroke="#0f172a"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#334155", outline: "none" },
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
                  fill={pt.risk_level === "red" ? "#ff006e" : (pt.risk_level === "yellow" ? "#ffbe0b" : "#00f5a0")}
                  fillOpacity={pt.risk_level === "red" ? 0.8 : 0.4}
                  stroke="none"
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>
    </div>
  );
}
