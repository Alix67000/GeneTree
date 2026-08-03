import React, { useState, useMemo, useRef } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { getExtendedRelatives } from '@/lib/kinship';
import { Person } from '@/types';
import { getInitials } from '@/lib/utils';
import { FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';
import { Link } from 'react-router-dom';

interface RadialNode {
  id: string;
  person: Person;
  title: string;
  isCenter: boolean;
  ring: number;
  x: number;
  y: number;
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

  const { nodes, links, rings } = useMemo(() => {
    if (!activeCenterId || persons.length === 0) return { nodes: [], links: [], rings: [] };

    const centerPerson = persons.find(p => p.id === activeCenterId);
    if (!centerPerson) return { nodes: [], links: [], rings: [] };

    const relatives = getExtendedRelatives(activeCenterId, persons);

    // Group relatives by ring distance
    const ringGroups = new Map<number, typeof relatives>();
    relatives.forEach(r => {
      const ring = Math.min(Math.max(r.distance, 1), 3); // Ring 1, 2, or 3
      if (!ringGroups.has(ring)) ringGroups.set(ring, []);
      ringGroups.get(ring)!.push(r);
    });

    const RADIUS_MAP: Record<number, number> = { 1: 200, 2: 360, 3: 520 };
    const nList: RadialNode[] = [
      {
        id: activeCenterId,
        person: centerPerson,
        title: 'Moi (Centre)',
        isCenter: true,
        ring: 0,
        x: 0,
        y: 0,
      }
    ];

    ringGroups.forEach((group, ringNum) => {
      const radius = RADIUS_MAP[ringNum] || 520;
      const total = group.length;
      group.forEach((r, idx) => {
        const angle = (idx / total) * 2 * Math.PI - Math.PI / 2; // start from top
        nList.push({
          id: r.person.id,
          person: r.person,
          title: r.relationshipTitle,
          isCenter: false,
          ring: ringNum,
          x: Math.round(radius * Math.cos(angle)),
          y: Math.round(radius * Math.sin(angle)),
        });
      });
    });

    const lList = nList.filter(n => !n.isCenter).map(n => ({
      source: activeCenterId,
      target: n.id,
      ring: n.ring,
    }));

    return {
      nodes: nList,
      links: lList,
      rings: [200, 360, 520],
    };
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

  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
      touchStartScaleRef.current = transform.scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      }));
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const newScale = Math.min(Math.max(touchStartScaleRef.current * (newDist / touchStartDistRef.current), 0.3), 2.5);
      setTransform(prev => ({ ...prev, scale: newScale }));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

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
          <h2 className="text-xl font-display font-bold text-text-primary">Système Solaire de Parenté</h2>
          <p className="text-xs text-text-secondary">Anneaux concentriques : Proches (Anneau 1) à Éloignés (Anneau 3)</p>
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
              {rings.map((r, idx) => (
                <circle
                  key={idx}
                  cx={window.innerWidth / 2}
                  cy={window.innerHeight / 2}
                  r={r}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="6,6"
                />
              ))}

              {links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;
                const sx = sourceNode.x + window.innerWidth / 2;
                const sy = sourceNode.y + window.innerHeight / 2;
                const tx = targetNode.x + window.innerWidth / 2;
                const ty = targetNode.y + window.innerHeight / 2;

                return (
                  <line
                    key={idx}
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeOpacity={0.5}
                  />
                );
              })}
            </svg>

            {nodes.map(node => {
              const left = node.x + window.innerWidth / 2 - 75;
              const top = node.y + window.innerHeight / 2 - 65;
              const badgeColor = node.isCenter
                ? 'bg-primary text-white'
                : node.ring === 1
                ? 'bg-emerald-600 text-white'
                : node.ring === 2
                ? 'bg-amber-600 text-white'
                : 'bg-slate-600 text-white';

              return (
                <div
                  key={node.id}
                  onClick={() => setCenterId(node.id)}
                  style={{ left, top }}
                  className={`node-card absolute w-[150px] p-2.5 bg-white rounded-xl border-2 shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center ${
                    node.isCenter ? 'border-primary ring-4 ring-primary/30 scale-110 z-30' : 'border-border z-10'
                  }`}
                >
                  <div className={`absolute -top-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${badgeColor}`}>
                    {node.title}
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-accent bg-border shadow flex items-center justify-center text-xs font-display font-semibold text-text-primary overflow-hidden mt-1.5">
                    {node.person.photoUrl ? (
                      <img src={node.person.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(node.person.firstName, node.person.lastName)
                    )}
                  </div>
                  <h4 className="font-display font-bold text-[11px] text-text-primary mt-1.5 truncate w-full">
                    {node.person.firstName} {node.person.lastName}
                  </h4>
                  <Link
                    to={`/person/${node.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 text-[9px] bg-primary text-white px-2 py-0.5 rounded hover:bg-primary/90"
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
