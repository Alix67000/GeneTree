import React, { useState, useMemo, useRef } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { getExtendedRelatives } from '@/lib/kinship';
import { Person } from '@/types';
import { getInitials } from '@/lib/utils';
import * as d3 from 'd3';
import { FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';
import { Link } from 'react-router-dom';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  person: Person;
  title: string;
  isCenter: boolean;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export function NetworkView() {
  const { persons } = usePersons();
  const [centerId, setCenterId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const activeCenterId = useMemo(() => {
    if (centerId && persons.some(p => p.id === centerId)) return centerId;
    return persons.length > 0 ? persons[0].id : null;
  }, [centerId, persons]);

  const { nodes, links } = useMemo(() => {
    if (!activeCenterId || persons.length === 0) return { nodes: [], links: [] };

    const centerPerson = persons.find(p => p.id === activeCenterId);
    if (!centerPerson) return { nodes: [], links: [] };

    const relatives = getExtendedRelatives(activeCenterId, persons);
    const nMap = new Map<string, GraphNode>();

    nMap.set(activeCenterId, {
      id: activeCenterId,
      person: centerPerson,
      title: 'Moi (Centre)',
      isCenter: true,
      x: 0,
      y: 0,
    });

    relatives.forEach(r => {
      nMap.set(r.person.id, {
        id: r.person.id,
        person: r.person,
        title: r.relationshipTitle,
        isCenter: false,
      });
    });

    const l: GraphLink[] = [];
    const relativeIds = new Set(nMap.keys());

    persons.forEach(p => {
      if (!relativeIds.has(p.id)) return;
      if (p.parentId1 && relativeIds.has(p.parentId1)) {
        l.push({ source: p.id, target: p.parentId1, type: 'U' });
      }
      if (p.parentId2 && relativeIds.has(p.parentId2)) {
        l.push({ source: p.id, target: p.parentId2, type: 'U' });
      }
      if (p.spouseId && relativeIds.has(p.spouseId)) {
        const exists = l.some(link =>
          (link.source === p.id && link.target === p.spouseId) ||
          (link.source === p.spouseId && link.target === p.id)
        );
        if (!exists) {
          l.push({ source: p.id, target: p.spouseId, type: 'S' });
        }
      }
    });

    const nodeArray = Array.from(nMap.values());
    const d3Links = l.map(link => ({ source: link.source, target: link.target, type: link.type }));

    const simulation = d3.forceSimulation(nodeArray)
      .force("link", d3.forceLink(d3Links).id((d: any) => d.id).distance(220))
      .force("charge", d3.forceManyBody().strength(-1400))
      .force("collision", d3.forceCollide().radius(110))
      .stop();

    for (let i = 0; i < 300; ++i) {
      simulation.tick();
    }

    return { nodes: nodeArray, links: l };
  }, [activeCenterId, persons]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card') || (e.target as HTMLElement).closest('.zoom-toolbar')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (delta: number) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale + delta, 0.3), 2.5),
    }));
  };

  const handleResetZoom = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="p-4 border-b border-border bg-surface flex flex-col sm:flex-row gap-4 justify-between items-center z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Réseau de Parenté Étendu</h2>
          <p className="text-xs text-text-secondary">Explorez tous les liens (cousins, oncles, aïeux) autour d'une personne</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeCenterId || ''}
            onChange={(e) => setCenterId(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-xs bg-background min-w-[220px]"
          >
            {persons.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="flex-1 relative overflow-hidden bg-[#f8fafc] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {persons.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm">
            Aucun membre dans l'arbre.
          </div>
        ) : (
          <div
            className="absolute inset-0 origin-center transition-transform duration-75"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          >
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
              {links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === (typeof link.source === 'object' ? (link.source as any).id : link.source));
                const targetNode = nodes.find(n => n.id === (typeof link.target === 'object' ? (link.target as any).id : link.target));
                if (!sourceNode || !targetNode) return null;
                const sx = (sourceNode.x || 0) + window.innerWidth / 2;
                const sy = (sourceNode.y || 0) + window.innerHeight / 2;
                const tx = (targetNode.x || 0) + window.innerWidth / 2;
                const ty = (targetNode.y || 0) + window.innerHeight / 2;

                return (
                  <line
                    key={idx}
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    stroke={link.type === 'S' ? '#f43f5e' : '#94a3b8'}
                    strokeWidth={link.type === 'S' ? 3 : 2}
                    strokeDasharray={link.type === 'S' ? '6,6' : 'none'}
                    strokeOpacity={0.7}
                  />
                );
              })}
            </svg>

            {nodes.map(node => {
              const left = (node.x || 0) + window.innerWidth / 2 - 80;
              const top = (node.y || 0) + window.innerHeight / 2 - 70;
              const badgeColor = node.isCenter ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700';

              return (
                <div
                  key={node.id}
                  onClick={() => setCenterId(node.id)}
                  style={{ left, top }}
                  className={`node-card absolute w-[160px] p-3 bg-white rounded-xl border-2 shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center ${
                    node.isCenter ? 'border-primary ring-4 ring-primary/20 scale-105 z-20' : 'border-border z-10'
                  }`}
                >
                  <div className={`absolute -top-3 px-3 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${badgeColor}`}>
                    {node.title}
                  </div>
                  <div className="w-14 h-14 rounded-full border-2 border-accent bg-border shadow flex items-center justify-center text-sm font-display font-semibold text-text-primary overflow-hidden mt-2">
                    {node.person.photoUrl ? (
                      <img src={node.person.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(node.person.firstName, node.person.lastName)
                    )}
                  </div>
                  <h4 className="font-display font-bold text-xs text-text-primary mt-2 truncate w-full">
                    {node.person.firstName} {node.person.lastName}
                  </h4>
                  <Link
                    to={`/person/${node.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 text-[10px] bg-primary text-white px-2 py-0.5 rounded hover:bg-primary/90"
                  >
                    Fiche
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="zoom-toolbar absolute bottom-6 right-6 flex flex-col gap-1 bg-surface p-1.5 rounded-xl shadow-lg border border-border z-30">
          <button onClick={() => handleZoom(0.2)} className="p-2 hover:bg-background rounded-lg" title="Zoom In">
            <FiZoomIn className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={() => handleZoom(-0.2)} className="p-2 hover:bg-background rounded-lg" title="Zoom Out">
            <FiZoomOut className="w-4 h-4 text-text-secondary" />
          </button>
          <div className="h-px bg-border my-0.5"></div>
          <button onClick={handleResetZoom} className="p-2 hover:bg-background rounded-lg" title="Reset">
            <FiMaximize className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </div>
  );
}
