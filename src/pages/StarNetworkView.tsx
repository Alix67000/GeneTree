import React, { useState, useMemo, useRef } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Person } from '@/types';
import { getInitials } from '@/lib/utils';
import { FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';
import { Link } from 'react-router-dom';

interface StarNode {
  id: string;
  person: Person;
  x: number;
  y: number;
  color: string;
  title: string;
  isCenter?: boolean;
}

interface StarLink {
  source: string;
  target: string;
  color: string;
}

export function StarNetworkView() {
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

    const getParents = (id: string) => persons.filter(p => {
      const child = persons.find(x => x.id === id);
      return child && (p.id === child.parentId1 || p.id === child.parentId2);
    });
    const getChildren = (id: string) => persons.filter(p => p.parentId1 === id || p.parentId2 === id);
    const getSiblings = (id: string) => {
      const person = persons.find(x => x.id === id);
      if (!person) return [];
      const parentIds = [person.parentId1, person.parentId2].filter(Boolean);
      if (parentIds.length === 0) return [];
      return persons.filter(p => p.id !== id && (parentIds.includes(p.parentId1!) || parentIds.includes(p.parentId2!)));
    };

    const nList: StarNode[] = [];
    const lList: StarLink[] = [];
    const addedIds = new Set<string>();

    // Center
    addedIds.add(activeCenterId);
    nList.push({ id: activeCenterId, person: centerPerson, x: 0, y: 0, color: 'primary', title: 'Center', isCenter: true });

    // Top (Ascendants - Blue)
    const parents = getParents(activeCenterId).filter(p => !addedIds.has(p.id));
    parents.forEach((p, idx) => {
      addedIds.add(p.id);
      const x = (idx - (parents.length - 1) / 2) * 250;
      nList.push({ id: p.id, person: p, x, y: -250, color: 'blue', title: p.gender === 'male' ? 'Father' : p.gender === 'female' ? 'Mother' : 'Parent' });
      lList.push({ source: activeCenterId, target: p.id, color: '#3b82f6' });
      
      const gp = getParents(p.id).filter(g => !addedIds.has(g.id));
      gp.forEach((g, gIdx) => {
        addedIds.add(g.id);
        const gx = x + (gIdx - (gp.length - 1) / 2) * 160;
        nList.push({ id: g.id, person: g, x: gx, y: -450, color: 'blue', title: g.gender === 'male' ? 'Grandfather' : g.gender === 'female' ? 'Grandmother' : 'Grandparent' });
        lList.push({ source: p.id, target: g.id, color: '#3b82f6' });
      });
    });

    // Bottom (Descendants - Green)
    const children = getChildren(activeCenterId).filter(p => !addedIds.has(p.id));
    children.forEach((c, idx) => {
      addedIds.add(c.id);
      const x = (idx - (children.length - 1) / 2) * 250;
      nList.push({ id: c.id, person: c, x, y: 250, color: 'green', title: c.gender === 'male' ? 'Son' : c.gender === 'female' ? 'Daughter' : 'Child' });
      lList.push({ source: activeCenterId, target: c.id, color: '#22c55e' });
      
      const gc = getChildren(c.id).filter(g => !addedIds.has(g.id));
      gc.forEach((g, gIdx) => {
        addedIds.add(g.id);
        const gx = x + (gIdx - (gc.length - 1) / 2) * 160;
        nList.push({ id: g.id, person: g, x: gx, y: 450, color: 'green', title: g.gender === 'male' ? 'Grandson' : g.gender === 'female' ? 'Granddaughter' : 'Grandchild' });
        lList.push({ source: c.id, target: g.id, color: '#22c55e' });
      });
    });

    // Right (Paternal - Orange)
    const centerParents = getParents(activeCenterId);
    const father = centerParents.find(p => p.gender === 'male') || centerParents[0];
    if (father) {
      const fatherSibs = getSiblings(father.id).filter(p => !addedIds.has(p.id));
      fatherSibs.forEach((fs, idx) => {
        addedIds.add(fs.id);
        const y = (idx - (fatherSibs.length - 1) / 2) * 250;
        nList.push({ id: fs.id, person: fs, x: 350, y, color: 'orange', title: fs.gender === 'male' ? 'Paternal Uncle' : fs.gender === 'female' ? 'Paternal Aunt' : 'Paternal Uncle/Aunt' });
        lList.push({ source: activeCenterId, target: fs.id, color: '#f97316' });
        
        const cousins = getChildren(fs.id).filter(c => !addedIds.has(c.id));
        cousins.forEach((c, cIdx) => {
          addedIds.add(c.id);
          const cy = y + (cIdx - (cousins.length - 1) / 2) * 160;
          nList.push({ id: c.id, person: c, x: 600, y: cy, color: 'orange', title: 'Paternal Cousin' });
          lList.push({ source: fs.id, target: c.id, color: '#f97316' });
        });
      });
    }

    // Left (Maternal - Purple)
    const mother = centerParents.find(p => p.gender === 'female') || (centerParents.length > 1 ? centerParents[1] : null);
    if (mother && mother.id !== father?.id) {
      const motherSibs = getSiblings(mother.id).filter(p => !addedIds.has(p.id));
      motherSibs.forEach((ms, idx) => {
        addedIds.add(ms.id);
        const y = (idx - (motherSibs.length - 1) / 2) * 250;
        nList.push({ id: ms.id, person: ms, x: -350, y, color: 'purple', title: ms.gender === 'male' ? 'Maternal Uncle' : ms.gender === 'female' ? 'Maternal Aunt' : 'Maternal Uncle/Aunt' });
        lList.push({ source: activeCenterId, target: ms.id, color: '#a855f7' });
        
        const cousins = getChildren(ms.id).filter(c => !addedIds.has(c.id));
        cousins.forEach((c, cIdx) => {
          addedIds.add(c.id);
          const cy = y + (cIdx - (cousins.length - 1) / 2) * 160;
          nList.push({ id: c.id, person: c, x: -600, y: cy, color: 'purple', title: 'Maternal Cousin' });
          lList.push({ source: ms.id, target: c.id, color: '#a855f7' });
        });
      });
    }

    return { nodes: nList, links: lList };
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
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / touchStartDistRef.current;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(touchStartScaleRef.current * scaleFactor, 0.2), 2.5),
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  const handleZoom = (delta: number) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale + delta, 0.2), 2.5),
    }));
  };

  const handleResetZoom = () => setTransform({ x: 0, y: 0, scale: 1 });

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return { border: 'border-blue-500', badge: 'bg-blue-500' };
      case 'green': return { border: 'border-emerald-500', badge: 'bg-emerald-500' };
      case 'orange': return { border: 'border-orange-500', badge: 'bg-orange-500' };
      case 'purple': return { border: 'border-purple-500', badge: 'bg-purple-500' };
      case 'primary': return { border: 'border-primary ring-4 ring-primary/30 shadow-2xl scale-110 z-30', badge: 'bg-primary' };
      default: return { border: 'border-slate-500', badge: 'bg-slate-500' };
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="p-4 border-b border-border bg-surface flex flex-col sm:flex-row gap-4 justify-between items-center z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Star Network</h2>
          <p className="text-xs text-text-secondary">Explore directional lineage clusters around a central member</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeCenterId || ''}
            onChange={(e) => setCenterId(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background min-w-[220px]"
          >
            {persons.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      <div
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
            No members in the family tree.
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
                    stroke={link.color}
                    strokeWidth="2.5"
                    strokeOpacity={0.4}
                  />
                );
              })}
            </svg>

            {nodes.map(node => {
              const left = node.x + window.innerWidth / 2 - 75; // width 150 -> 75
              const top = node.y + window.innerHeight / 2 - 65; // height ~130 -> 65
              const colors = getColorClasses(node.color);

              return (
                <div
                  key={node.id}
                  onClick={() => setCenterId(node.id)}
                  style={{ left, top }}
                  className={`node-card absolute w-[150px] p-3 bg-white rounded-xl border-2 shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center z-10 ${colors.border} ${node.isCenter ? 'z-30' : ''}`}
                >
                  <div className={`absolute -top-3 px-3 py-0.5 rounded-full text-[10px] font-bold shadow-sm text-white ${colors.badge}`}>
                    {node.title}
                  </div>
                  <div className={`w-14 h-14 rounded-full border-2 bg-slate-50 shadow-inner flex items-center justify-center text-sm font-display font-semibold text-slate-700 overflow-hidden mt-1.5 ${colors.border}`}>
                    {node.person.photoUrl ? (
                      <img src={node.person.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(node.person.firstName, node.person.lastName)
                    )}
                  </div>
                  <h4 className="font-display font-bold text-xs text-slate-800 mt-2 truncate w-full">
                    {node.person.firstName} {node.person.lastName}
                  </h4>
                  <Link
                    to={`/person/${node.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`mt-2 text-[10px] text-white px-3 py-1 rounded-md hover:opacity-90 transition-opacity ${colors.badge}`}
                  >
                    View Profile
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="zoom-toolbar absolute bottom-6 right-6 flex flex-col gap-1 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200 z-30">
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
