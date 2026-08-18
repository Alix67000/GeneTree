import React, { useState, useMemo, useRef, useEffect } from 'react';
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

  const canvasRef = useRef<HTMLDivElement>(null);
  const [personQuery, setPersonQuery] = useState('');
  const [personListOpen, setPersonListOpen] = useState(false);

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
        title: 'Me (Center)',
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

  useEffect(() => {
    if (!activeCenterId) { setPersonQuery(''); return; }
    const p = persons.find(x => x.id === activeCenterId);
    if (p) setPersonQuery(`${(p.lastName || '').toUpperCase()} ${p.firstName}`);
  }, [activeCenterId, persons]);

  const personSuggestions = useMemo(() => {
    if (personQuery.trim().length < 3) return [];
    const q = personQuery.toLowerCase();
    return [...persons]
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q))
      .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''));
  }, [personQuery, persons]);

  const fitAllCards = () => {
    const el = canvasRef.current;
    if (!el || nodes.length === 0) return;
    const canvasW = el.clientWidth;
    const canvasH = el.clientHeight;
    if (canvasW < 10 || canvasH < 10) return;
    const CARD_W = 150, CARD_H = 150, PAD = 28;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - CARD_W / 2);
      maxX = Math.max(maxX, n.x + CARD_W / 2);
      minY = Math.min(minY, n.y - CARD_H / 2);
      maxY = Math.max(maxY, n.y + CARD_H / 2);
    });
    const contentW = Math.max(maxX - minX, 1);
    const contentH = Math.max(maxY - minY, 1);
    const scale = Math.min((canvasW - PAD * 2) / contentW, (canvasH - PAD * 2) / contentH, 1);
    const clamped = Math.max(scale, 0.12);
    const graphCx = (minX + maxX) / 2 + window.innerWidth / 2;
    const graphCy = (minY + maxY) / 2 + window.innerHeight / 2;
    setTransform({
      x: -(graphCx - canvasW / 2) * clamped,
      y: -(graphCy - canvasH / 2) * clamped,
      scale: clamped,
    });
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => fitAllCards());
    return () => cancelAnimationFrame(id);
  }, [activeCenterId, nodes]);

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
    if (e.touches.length === 2 && e.cancelable) {
      e.preventDefault();
    }
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
      const newScale = Math.min(Math.max(touchStartScaleRef.current * (newDist / touchStartDistRef.current), 0.12), 2.5);
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
      scale: Math.min(Math.max(prev.scale + delta, 0.12), 2.5),
    }));
  };

  const handleResetZoom = () => fitAllCards();

  return (
    <div className="flex flex-col overflow-hidden overscroll-none bg-background -mx-2 -my-4 sm:-mx-4 md:-mx-8 h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)]">
      <div className="px-2 py-1.5 md:px-4 md:py-2 border-b border-border bg-surface flex flex-row items-center gap-2 shrink-0 z-10">
        <h2 className="text-sm md:text-xl font-display font-bold text-text-primary truncate shrink-0">Find your relative</h2>
        <div className="relative w-full min-w-0 flex-1">
          <input
            type="text"
            value={personQuery}
            onChange={(e) => { setPersonQuery(e.target.value); setPersonListOpen(true); }}
            onFocus={() => setPersonListOpen(true)}
            onBlur={() => setTimeout(() => setPersonListOpen(false), 200)}
            placeholder="Type 3 letters..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
          />
          {personListOpen && personQuery.trim().length >= 3 && personSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto">
              {personSuggestions.map(p => {
                const year = p.birthDate ? new Date(p.birthDate).getFullYear() : '?';
                return (
                  <button
                    type="button"
                    key={p.id}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs md:text-sm whitespace-nowrap truncate"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setCenterId(p.id); setPersonListOpen(false); }}
                  >
                    {(p.lastName || '').toUpperCase()} {p.firstName} ({year})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-[#f8fafc] cursor-grab active:cursor-grabbing select-none touch-none"
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
            No members found in the family tree.
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
                    Profile
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="zoom-toolbar absolute bottom-4 right-3 md:bottom-6 md:right-6 flex flex-col gap-1 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200 z-30 w-auto">
          <button onClick={() => handleZoom(0.2)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors" title="Zoom In">
            <FiZoomIn className="w-4 h-4 text-slate-600" />
          </button>
          <button onClick={() => handleZoom(-0.2)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors" title="Zoom Out">
            <FiZoomOut className="w-4 h-4 text-slate-600" />
          </button>
          <div className="h-px bg-slate-200 my-0.5"></div>
          <button onClick={handleResetZoom} className="p-2 hover:bg-slate-50 rounded-lg transition-colors" title="Reset">
            <FiMaximize className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
