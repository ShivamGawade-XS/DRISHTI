"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { NarrativeCards } from "./components/NarrativeCards";
import { Card } from "@/components/ui/Card";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function MuleGraphPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[], mule_rings?: any[] }>({ nodes: [], links: [] });
  const [selectedRing, setSelectedRing] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/graph")
      .then(r => r.json())
      .then(d => {
        if (d.nodes && d.nodes.length > 0) {
          setGraphData(d);
        } else {
          // Fallback mock data
          const nodes: any[] = [];
          const links: any[] = [];
          const mule_rings: any[] = [];
          nodes.push({ id: "MULE_DRAIN", group: 0, val: 80, mule_suspect: true });
          for (let c = 0; c < 3; c++) {
            const clusterCenter = `CLUSTER_${c}`;
            nodes.push({ id: clusterCenter, group: c + 1, val: 40, mule_suspect: true });
            links.push({ source: clusterCenter, target: "MULE_DRAIN", weight: 50000 });
            for (let i = 0; i < 5; i++) {
              const leaf = `VICTIM_${c}_${i}`;
              nodes.push({ id: leaf, group: c + 1, val: 10, mule_suspect: false });
              links.push({ source: leaf, target: clusterCenter, weight: Math.random() * 5000 });
            }
            mule_rings.push({
              community_id: c + 1,
              drain_node: clusterCenter,
              mule_score: 85,
              nodes_count: 6,
              total_volume: 25000,
              fan_in: 5,
              drain_ratio: 1.0,
              explanation: `Mule Ring Detected. 1 central drain account (${clusterCenter}) received 5 distinct low-value inflows totaling Rs.25,000, which was fully transferred out (Drain Ratio: 100%) within 2 hours. Pattern matches a classic high-velocity layering funnel.`
            });
          }
          setGraphData({ nodes, links, mule_rings });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ui-text">Mule Network Graph</h2>
          <p className="text-base text-ui-muted">Louvain community detection and betweenness centrality</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-mono font-medium">
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-ui-riskRed mr-2"></span> Mule Suspect</div>
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-ui-accent mr-2"></span> Community A</div>
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-ui-riskGreen mr-2"></span> Community B</div>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden min-h-[400px]" ref={containerRef}>
        {(typeof window !== "undefined") && (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeAutoColorBy="group"
            nodeRelSize={1}
            nodeVal={(node: any) => node.val}
            nodeColor={(node: any): string => {
              if (selectedRing) {
                return node.group === selectedRing.community_id ? "#E05243" : "rgba(63, 60, 57, 0.4)";
              }
              return node.mule_suspect ? "#E05243" : "#6B5A4D";
            }}
            linkColor={() => "rgba(63, 60, 57, 0.6)"}
            linkWidth={(link: any) => Math.max(1, (link.weight || 0) / 1000)}
            backgroundColor="#242220"
          />
        )}
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <Card className="p-4 flex flex-col items-center justify-center border-t-4 border-t-ui-accent border-x-0 border-b-0 rounded-b-xl rounded-t-sm shadow-none bg-ui-bg">
          <div className="text-2xl font-bold text-ui-text">{graphData.nodes.length}</div>
          <div className="text-xs text-ui-muted font-medium mt-1">Total Nodes</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center border-t-4 border-t-ui-accent border-x-0 border-b-0 rounded-b-xl rounded-t-sm shadow-none bg-ui-bg">
          <div className="text-2xl font-bold text-ui-text">{graphData.links.length}</div>
          <div className="text-xs text-ui-muted font-medium mt-1">Total Edges</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center border-t-4 border-t-ui-riskGreen border-x-0 border-b-0 rounded-b-xl rounded-t-sm shadow-none bg-ui-bg">
          <div className="text-2xl font-bold text-ui-text">{new Set(graphData.nodes.map((n:any) => n.group)).size}</div>
          <div className="text-xs text-ui-muted font-medium mt-1">Communities</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center border-t-4 border-t-ui-riskRed border-x-0 border-b-0 rounded-b-xl rounded-t-sm shadow-none bg-ui-bg">
          <div className="text-2xl font-bold text-ui-riskRed">{graphData.nodes.filter((n:any) => n.mule_suspect).length}</div>
          <div className="text-xs text-ui-muted font-medium mt-1">Mule Suspects</div>
        </Card>
      </div>

      <NarrativeCards 
        rings={graphData.mule_rings || []} 
        selectedRing={selectedRing} 
        setSelectedRing={setSelectedRing} 
      />
    </div>
  );
}
