"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function MuleGraphPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    // Fetch graph data from backend
    fetch("http://localhost:8000/api/v1/graph")
      .then(r => r.json())
      .then(d => {
        if (d.nodes && d.nodes.length > 0) {
          setGraphData(d);
        } else {
          // Fallback mock data if DB is empty
          const nodes: any[] = [];
          const links: any[] = [];
          // Central mule drain
          nodes.push({ id: "MULE_DRAIN", group: 0, val: 80, mule_suspect: true });
          // Add 3 clusters
          for (let c = 0; c < 3; c++) {
            const clusterCenter = `CLUSTER_${c}`;
            nodes.push({ id: clusterCenter, group: c + 1, val: 40, mule_suspect: true });
            links.push({ source: clusterCenter, target: "MULE_DRAIN", weight: 50000 });
            for (let i = 0; i < 5; i++) {
              const leaf = `VICTIM_${c}_${i}`;
              nodes.push({ id: leaf, group: c + 1, val: 10, mule_suspect: false });
              links.push({ source: leaf, target: clusterCenter, weight: Math.random() * 5000 });
            }
          }
          setGraphData({ nodes, links });
        }
      })
      .catch(e => console.log("Graph fetch failed"));

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="glass-card p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Mule Network Graph</h2>
          <p className="text-sm text-slate-400">Louvain community detection and betweenness centrality</p>
        </div>
        <div className="flex space-x-4 text-xs font-mono">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#ff006e] mr-2"></span> Mule Suspect</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#00d4ff] mr-2"></span> Community A</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#00f5a0] mr-2"></span> Community B</div>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-hidden" ref={containerRef}>
        {(typeof window !== "undefined") && (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeAutoColorBy="group"
            nodeRelSize={1}
            nodeVal={(node: any) => node.val}
            nodeColor={(node: any) => node.mule_suspect ? "#ff006e" : undefined}
            linkColor={() => "rgba(30, 41, 59, 0.8)"}
            linkWidth={(link: any) => Math.max(1, (link.weight || 0) / 1000)}
            backgroundColor="#0a0f1e"
          />
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="glass-card p-3 text-center border-t-2 border-[#00d4ff]">
          <div className="text-xl font-bold text-white">{graphData.nodes.length}</div>
          <div className="text-xs text-slate-400">Total Nodes</div>
        </div>
        <div className="glass-card p-3 text-center border-t-2 border-[#00d4ff]">
          <div className="text-xl font-bold text-white">{graphData.links.length}</div>
          <div className="text-xs text-slate-400">Total Edges</div>
        </div>
        <div className="glass-card p-3 text-center border-t-2 border-[#00f5a0]">
          <div className="text-xl font-bold text-white">{new Set(graphData.nodes.map((n:any) => n.group)).size}</div>
          <div className="text-xs text-slate-400">Communities</div>
        </div>
        <div className="glass-card p-3 text-center border-t-2 border-[#ff006e]">
          <div className="text-xl font-bold text-[#ff006e]">{graphData.nodes.filter((n:any) => n.mule_suspect).length}</div>
          <div className="text-xs text-slate-400">Mule Suspects</div>
        </div>
      </div>
    </div>
  );
}
