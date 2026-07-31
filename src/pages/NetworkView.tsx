import React, { useEffect, useRef, useState, useMemo } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { getExtendedRelatives } from '@/lib/kinship';
import { Person } from '@/types';
import * as d3 from 'd3';
import { FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  person: Person;
  title: string;
  isCenter: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

export function NetworkView() {
  const { persons } = usePersons();
  const [centerId, setCenterId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!centerId && persons.length > 0) {
      setCenterId(persons[0].id);
    }
  }, [persons, centerId]);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomBehavior, setZoomBehavior] = useState<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const { nodes, links } = useMemo(() => {
    if (!centerId || persons.length === 0) return { nodes: [], links: [] };

    const centerPerson = persons.find(p => p.id === centerId);
    if (!centerPerson) return { nodes: [], links: [] };

    const relatives = getExtendedRelatives(centerId, persons);
    
    const n: GraphNode[] = [
      { id: centerId, person: centerPerson, title: 'Moi (Centre)', isCenter: true }
    ];

    const relativeIds = new Set<string>([centerId]);

    relatives.forEach(r => {
      n.push({
        id: r.person.id,
        person: r.person,
        title: r.relationshipTitle,
        isCenter: false
      });
      relativeIds.add(r.person.id);
    });

    const l: GraphLink[] = [];
    
    persons.forEach(p => {
      if (!relativeIds.has(p.id)) return;
      
      if (p.parentId1 && relativeIds.has(p.parentId1)) {
        l.push({ source: p.id, target: p.parentId1, type: 'U' });
      }
      if (p.parentId2 && relativeIds.has(p.parentId2)) {
        l.push({ source: p.id, target: p.parentId2, type: 'U' });
      }
      if (p.spouseId && relativeIds.has(p.spouseId)) {
        const exists = l.find(link => 
          (link.source === p.id && link.target === p.spouseId) || 
          (link.source === p.spouseId && link.target === p.id)
        );
        if (!exists) {
          l.push({ source: p.id, target: p.spouseId, type: 'S' });
        }
      }
    });

    return { nodes: n, links: l };
  }, [centerId, persons]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
      });
      
    svg.call(zoom);
    setZoomBehavior(zoom);

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-1500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(100));

    const link = g.append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.8)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => d.type === 'S' ? 3 : 2)
      .attr("stroke-dasharray", d => d.type === 'S' ? "6,6" : "none");

    const nodeWidth = 160;
    const nodeHeight = 150;

    const node = g.append("g")
      .selectAll("foreignObject")
      .data(nodes)
      .join("foreignObject")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("x", -nodeWidth / 2)
      .attr("y", -nodeHeight / 2)
      .call(d3.drag<SVGForeignObjectElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("xhtml:div")
      .attr("style", "width: 100%; height: 100%;")
      .html(d => {
        const initials = d.person.firstName.charAt(0) + (d.person.lastName?.charAt(0) || '');
        const photoHtml = d.person.photoUrl 
          ? `<img src="${d.person.photoUrl}" class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mb-2 mx-auto" />`
          : `<div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-2 mx-auto border-2 border-white shadow-sm">${initials}</div>`;
        
        const badgeColor = d.isCenter ? 'bg-primary text-white' : 'bg-[#e2e8f0] text-gray-700';
        const badge = d.isCenter ? 'Moi' : d.title;
          
        return `
          <div class="w-full h-[140px] mt-[5px] bg-white rounded-xl border-2 flex flex-col items-center justify-start cursor-pointer shadow-md hover:shadow-lg transition-shadow relative ${d.isCenter ? 'border-primary ring-4 ring-primary/20' : 'border-border'}" onclick="document.dispatchEvent(new CustomEvent('nodeClicked', {detail: '${d.id}'}))">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 ${badgeColor} text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm z-10">
              ${badge}
            </div>
            <div class="mt-5 w-full flex flex-col items-center px-2">
              ${photoHtml}
              <div class="text-sm font-bold text-center leading-tight truncate w-full text-gray-800">${d.person.firstName} ${d.person.lastName}</div>
              <div class="text-[11px] text-gray-500 mt-1">${d.person.birthDate || ''}</div>
            </div>
          </div>
        `;
      });

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      node
        .attr("x", d => d.x! - nodeWidth / 2)
        .attr("y", d => d.y! - nodeHeight / 2);
    });

    const clickHandler = (e: any) => {
      if (e.detail) setCenterId(e.detail);
    };
    document.addEventListener('nodeClicked', clickHandler);

    return () => {
      simulation.stop();
      document.removeEventListener('nodeClicked', clickHandler);
    };
  }, [nodes, links]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehavior) {
      d3.select(svgRef.current).transition().call(zoomBehavior.scaleBy, 1.2);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehavior) {
      d3.select(svgRef.current).transition().call(zoomBehavior.scaleBy, 0.8);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehavior) {
      d3.select(svgRef.current).transition().call(zoomBehavior.transform, d3.zoomIdentity);
    }
  };

  function dragstarted(e: any, d: GraphNode) {
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(e: any, d: GraphNode) {
    d.fx = e.x;
    d.fy = e.y;
  }

  function dragended(e: any, d: GraphNode) {
    d.fx = null;
    d.fy = null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="p-4 border-b border-border bg-surface flex flex-col sm:flex-row gap-4 justify-between items-center z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Réseau étendu</h2>
          <p className="text-sm text-text-secondary">Cliquez sur un membre pour voir ses liens de parenté.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <select 
              value={centerId || ''} 
              onChange={(e) => setCenterId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background min-w-[200px]"
           >
             {persons.map(p => (
               <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
             ))}
           </select>
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#f8fafc]">
        {persons.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
            Aucun membre dans l'arbre.
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        )}
        
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-surface p-2 rounded-xl shadow-lg border border-border">
          <button 
            className="p-3 hover:bg-background rounded-lg transition-colors"
            title="Zoom In"
            onClick={handleZoomIn}
          >
            <FiZoomIn className="w-5 h-5 text-text-secondary" />
          </button>
          <button 
            className="p-3 hover:bg-background rounded-lg transition-colors"
            title="Zoom Out"
            onClick={handleZoomOut}
          >
            <FiZoomOut className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="h-px bg-border my-1"></div>
          <button 
            className="p-3 hover:bg-background rounded-lg transition-colors"
            title="Reset"
            onClick={handleResetZoom}
          >
            <FiMaximize className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>
    </div>
  );
}
