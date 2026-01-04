import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

import { DFAGraph, DFAState, DFATransition } from '../types';

interface DFAVisualizerProps {
  graph: DFAGraph;
  title: string;
}

const DFAVisualizer: React.FC<DFAVisualizerProps> = ({ graph, title }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || !graph.states.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;

    // DATA VALIDATION & PREPARATION
    // Ensure all links reference valid nodes. D3 will replace source/target strings with object refs.
    const validNodes: DFAState[] = JSON.parse(JSON.stringify(graph.states));
    const nodeMap = new Map(validNodes.map(n => [n.id, n]));

    const d3Links = graph.transitions
      .filter(t => nodeMap.has(t.from) && nodeMap.has(t.to))
      .map(t => ({
        source: t.from, // D3 will use nodeMap to resolve this via .id()
        target: t.to,
        label: t.label,
        originalFrom: t.from,
        originalTo: t.to
      }));

    // Setup Simulation
    const simulation = d3.forceSimulation<DFAState>(validNodes)
      .force("link", d3.forceLink<DFAState, any>(d3Links).id(d => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-1800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(80));

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Markers for Arrows
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 38)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    const container = svg.append("g");

    // Links
    const link = container.append("g")
      .selectAll("path")
      .data(d3Links)
      .enter().append("path")
      .attr("stroke", "#334155")
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)");

    // Labels
    const linkLabels = container.append("g")
      .selectAll("text")
      .data(d3Links)
      .enter().append("text")
      .attr("fill", "#38bdf8")
      .attr("font-size", "11px")
      .attr("font-family", "Fira Code, monospace")
      .attr("font-weight", "600")
      .attr("text-anchor", "middle")
      .text(d => d.label);

    // Nodes
    const node = container.append("g")
      .selectAll("g")
      .data(validNodes)
      .enter().append("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append("circle")
      .attr("r", 30)
      .attr("fill", d => d.isAccepting ? "#064e3b" : d.isInitial ? "#1e3a8a" : "#0f172a")
      .attr("stroke", d => d.isAccepting ? "#10b981" : d.isInitial ? "#3b82f6" : "#475569")
      .attr("stroke-width", 3)
      .attr("class", "transition-all duration-300");

    node.filter(d => d.isAccepting)
      .append("circle")
      .attr("r", 24)
      .attr("fill", "none")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,2");

    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#f1f5f9")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("class", "pointer-events-none")
      .text(d => d.id.split('_').pop() || d.id);

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const s = d.source;
        const t = d.target;
        if (!s || !t || s.x === undefined || t.x === undefined) return "";

        if (s.id === t.id) {
          const x = s.x;
          const y = s.y;
          return `M${x+15},${y-26} A30,30 0 1,1 ${x+26},${y-15}`;
        }
        
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${s.x},${s.y}A${dr * 1.5},${dr * 1.5} 0 0,1 ${t.x},${t.y}`;
      });

      linkLabels.attr("transform", (d: any) => {
        const s = d.source;
        const t = d.target;
        if (!s || !t || s.x === undefined || t.x === undefined) return "";

        if (s.id === t.id) {
          return `translate(${s.x + 40}, ${s.y - 50})`;
        }
        const midX = (s.x + t.x) / 2 + (t.y - s.y) * 0.2;
        const midY = (s.y + t.y) / 2 - (t.x - s.x) * 0.2;
        return `translate(${midX}, ${midY})`;
      });

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graph]);

  return (
    <div className="bg-slate-900 rounded-2xl sm:rounded-[3rem] p-4 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-4 relative z-10">
        <div className="space-y-1">
          <h3 className="text-xl sm:text-3xl font-black text-slate-100 flex items-center gap-2 sm:gap-4 tracking-tight">
            <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl sm:rounded-2xl border border-blue-500/20">
               <i className="fas fa-microchip text-blue-400"></i>
            </div>
            Operational Graph
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-[0.2em] pl-0 sm:pl-1">Deterministic State Machine</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono bg-slate-950 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-800 uppercase tracking-widest font-black shadow-xl">
            Scale: {zoomLevel.toFixed(1)}x
          </div>
        </div>
      </div>
      
      <div className="relative overflow-hidden bg-slate-950 rounded-xl sm:rounded-[2.5rem] border-2 border-slate-800/60 cursor-grab active:cursor-grabbing shadow-inner">
        <svg ref={svgRef} width="100%" height="500" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" className="transition-opacity duration-500" />
        
        <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 flex gap-2 sm:gap-3">
           <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-900/90 backdrop-blur-md rounded-lg sm:rounded-xl border border-slate-800 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 sm:gap-3">
             <i className="fas fa-info-circle text-blue-500"></i>
             Scroll to zoom • Drag nodes • Pan canvas
           </div>
        </div>
      </div>
      
      <div className="mt-6 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <LegendItem color="bg-blue-600 shadow-blue-500/40" title="Start State" sub="Initial Entry" />
        <LegendItem color="bg-emerald-600 shadow-emerald-500/40" title="Accepting" sub="Valid Match" />
        <LegendItem color="bg-slate-800 border-slate-600" title="Internal" sub="Processing" />
        <LegendItem icon="fas fa-long-arrow-alt-right" title="Transition" sub="Symbol Key" />
      </div>
    </div>
  );
};

const LegendItem = ({ color, icon, title, sub }: any) => (
  <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-5 bg-slate-950/40 rounded-xl sm:rounded-[2rem] border border-slate-800/50 hover:bg-slate-900/40 transition-all group/item">
    {color ? (
      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white/10 ${color}`}></div>
    ) : (
      <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-slate-500 text-lg sm:text-xl">
        <i className={icon}></i>
      </div>
    )}
    <div className="flex flex-col">
      <span className="text-[10px] sm:text-[11px] font-black text-slate-100 uppercase tracking-wider group-hover/item:text-blue-400 transition-colors">{title}</span>
      <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase">{sub}</span>
    </div>
  </div>
);

export default DFAVisualizer;