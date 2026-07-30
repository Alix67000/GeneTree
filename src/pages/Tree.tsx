import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { getInitials } from '@/lib/utils';
import { 
  FiPlus, FiMinus, FiRefreshCcw, FiUser, FiGrid, FiGitCommit, 
  FiHeart, FiEye, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { Person } from '@/types';

export function Tree() {
  const { persons, loading } = usePersons();
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [centralPersonId, setCentralPersonId] = useState<string>('');
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);

  // Canvas Pan & Zoom State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialCenterDone = useRef(false);

  // Layout Engine
  const { xPos, levels } = useMemo(() => {
    const levelsMap = new Map<string, number>();
    
    // Ensure everyone gets a level, handle cycles safely
    const getLevel = (id: string, visited = new Set<string>()): number => {
      if (levelsMap.has(id)) return levelsMap.get(id)!;
      if (visited.has(id)) return 0;
      visited.add(id);
      const p = persons.find(per => per.id === id);
      if (!p) return 0;
      
      let level = 0;
      if (p.parentId1 || p.parentId2) {
        const l1 = p.parentId1 ? getLevel(p.parentId1, new Set(visited)) : 0;
        const l2 = p.parentId2 ? getLevel(p.parentId2, new Set(visited)) : 0;
        level = Math.max(l1, l2) + 1;
      }
      levelsMap.set(id, level);
      
      if (p.spouseId && !levelsMap.has(p.spouseId)) {
        levelsMap.set(p.spouseId, level);
      }
      return level;
    };
    
    persons.forEach(p => getLevel(p.id));
    
    const levelGroups = new Map<number, string[]>();
    persons.forEach(p => {
      const l = levelsMap.get(p.id) || 0;
      if (!levelGroups.has(l)) levelGroups.set(l, []);
      levelGroups.get(l)!.push(p.id);
    });
    
    const xPosMap = new Map<string, number>();
    const CARD_X_SPACING = 350;
    
    Array.from(levelGroups.keys()).sort((a,b)=>a-b).forEach(l => {
      const group = levelGroups.get(l)!;
      
      const sortedGroup: string[] = [];
      const added = new Set<string>();
      group.forEach(id => {
        if (added.has(id)) return;
        sortedGroup.push(id);
        added.add(id);
        const p = persons.find(per=>per.id === id);
        if (p?.spouseId && group.includes(p.spouseId) && !added.has(p.spouseId)) {
          sortedGroup.push(p.spouseId);
          added.add(p.spouseId);
        }
      });
      
      sortedGroup.forEach((id, index) => {
        const p = persons.find(per => per.id === id);
        let idealX = index * CARD_X_SPACING;
        
        if (p?.parentId1 || p?.parentId2) {
          const p1x = p.parentId1 && xPosMap.has(p.parentId1) ? xPosMap.get(p.parentId1)! : null;
          const p2x = p.parentId2 && xPosMap.has(p.parentId2) ? xPosMap.get(p.parentId2)! : null;
          if (p1x !== null && p2x !== null) idealX = (p1x + p2x) / 2;
          else if (p1x !== null) idealX = p1x;
          else if (p2x !== null) idealX = p2x;
        }
        xPosMap.set(id, idealX);
      });
      
      const sortedByX = sortedGroup.sort((a,b) => (xPosMap.get(a) || 0) - (xPosMap.get(b) || 0));
      for (let i = 1; i < sortedByX.length; i++) {
        const prev = sortedByX[i-1];
        const curr = sortedByX[i];
        const prevX = xPosMap.get(prev)!;
        const currX = xPosMap.get(curr)!;
        
        const pCurr = persons.find(per=>per.id === curr);
        const isSpouse = pCurr?.spouseId === prev;
        const minSpacing = isSpouse ? 280 : CARD_X_SPACING;
        
        if (currX - prevX < minSpacing) {
          xPosMap.set(curr, prevX + minSpacing);
        }
      }
    });
    
    return { xPos: xPosMap, levels: levelsMap };
  }, [persons]);

  // Set default central person when persons load
  useEffect(() => {
    if (persons.length > 0 && !centralPersonId) {
      const sorted = [...persons].sort((a, b) => {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      });
      setCentralPersonId(sorted[0].id);
    }
  }, [persons, centralPersonId]);

  const centerOnPoint = (x: number, y: number, targetScale = transform.scale) => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setTransform({
      x: width / 2 - x * targetScale,
      y: height / 2 - y * targetScale,
      scale: targetScale
    });
  };

  useEffect(() => {
    if (!initialCenterDone.current && persons.length > 0 && xPos.size > 0 && containerRef.current) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      
      persons.forEach(p => {
        const x = xPos.get(p.id) || 0;
        const y = (levels.get(p.id) || 0) * 350;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
      
      const width = maxX - minX + 300; // card width + padding
      const height = maxY - minY + 250; // card height + padding
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const scaleX = (containerRect.width - 40) / width;
      const scaleY = (containerRect.height - 40) / height;
      
      let scale = Math.min(scaleX, scaleY);
      scale = Math.max(0.3, Math.min(scale, 1.2)); // clamp
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      setTransform({
        x: containerRect.width / 2 - centerX * scale,
        y: containerRect.height / 2 - centerY * scale,
        scale: scale
      });
      
      initialCenterDone.current = true;
    }
  }, [persons, xPos, levels]);

  const handleSelectCentral = (id: string) => {
    setCentralPersonId(id);
    setHighlightedPersonId(id);
    const x = xPos.get(id) || 0;
    const y = (levels.get(id) || 0) * 350;
    centerOnPoint(x, y, 1); // Reset scale to 1 on selection for clear view
    setTimeout(() => {
      setHighlightedPersonId(null);
    }, 2500);
  };

  // Pan and Zoom Handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomFactor = -e.deltaY * 0.002;
        setTransform(prev => {
          const newScale = Math.min(Math.max(0.3, prev.scale + zoomFactor * prev.scale), 2.5);
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          const targetX = (mouseX - prev.x) / prev.scale;
          const targetY = (mouseY - prev.y) / prev.scale;
          
          const newX = mouseX - targetX * newScale;
          const newY = mouseY - targetY * newScale;
          
          return { x: newX, y: newY, scale: newScale };
        });
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleZoom = (delta: number) => {
    setTransform(prev => {
      const newScale = Math.min(Math.max(0.2, prev.scale + delta), 2.5);
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const centerX = width / 2;
        const centerY = height / 2;
        const x = centerX - (centerX - prev.x) * (newScale / prev.scale);
        const y = centerY - (centerY - prev.y) * (newScale / prev.scale);
        return { x, y, scale: newScale };
      }
      return { ...prev, scale: newScale };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.person-card') || (e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    if ((e.target as HTMLElement).closest('.person-card') || (e.target as HTMLElement).closest('button')) return;
    if (Math.abs(e.clientX - dragStartPos.x) < 5 && Math.abs(e.clientY - dragStartPos.y) < 5) {
      setFocusedPersonId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  }

  const centralPerson = persons.find(p => p.id === centralPersonId) || persons[0];

  const isConnectedToFocused = (pId: string) => {
    if (!focusedPersonId) return false;
    if (focusedPersonId === pId) return true;
    const p = persons.find(per => per.id === focusedPersonId);
    if (!p) return false;
    return p.parentId1 === pId || p.parentId2 === pId || p.spouseId === pId || 
           persons.some(c => (c.parentId1 === focusedPersonId || c.parentId2 === focusedPersonId) && c.id === pId);
  };

  const renderPersonCard = (p: Person, roleLabel: string, badgeStyle: string, isCentral = false) => {
    const isFocused = focusedPersonId ? isConnectedToFocused(p.id) : false;
    const isDimmed = focusedPersonId ? !isFocused : false;
    const isHighlighted = highlightedPersonId === p.id;
    const cParentsCount = (p.parentId1 ? 1 : 0) + (p.parentId2 ? 1 : 0);
    const cChildrenCount = persons.filter(c => c.parentId1 === p.id || c.parentId2 === p.id).length;

    return (
      <div 
        className={`flex flex-col items-center transition-all duration-300 ${isDimmed ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'} ${isHighlighted ? 'scale-105 ring-4 ring-accent rounded-2xl p-1 bg-accent/10 z-20' : 'z-10'}`}
        onClick={(e) => { e.stopPropagation(); setFocusedPersonId(p.id); }}
      >
        <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-3 py-1 rounded-full border shadow-xs transition-colors ${badgeStyle}`}>
          {roleLabel}
        </span>
        <Card className={`transition-all w-64 p-5 flex flex-col items-center text-center space-y-3 bg-white border ${isCentral ? 'ring-4 ring-primary/30 border-primary shadow-lg' : isFocused ? 'ring-2 ring-primary border-primary shadow-xl' : 'border-border/80 hover:shadow-md cursor-pointer'}`}>
          <div className="w-16 h-16 rounded-full border-2 border-accent bg-border ring-4 ring-primary/5 shadow-md flex items-center justify-center text-xl font-display font-medium text-text-primary overflow-hidden shrink-0">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt={`${p.firstName} ${p.lastName}`} className="w-full h-full object-cover" />
            ) : (
              getInitials(p.firstName, p.lastName)
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-text-primary leading-tight">{p.firstName} {p.lastName}</h3>
            <p className="text-[11px] text-text-secondary mt-1 italic">
              {p.birthDate ? new Date(p.birthDate).getFullYear() : 'Unknown'} {p.deathDate ? `— ${new Date(p.deathDate).getFullYear()}` : '— Present'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 w-full py-1.5 px-2 bg-slate-50 rounded-xl text-[10px] font-semibold text-slate-600 border border-slate-100">
            <span className="flex items-center gap-1"><FiArrowUp className="w-3 h-3" /> {cParentsCount}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><FiArrowDown className="w-3 h-3" /> {cChildrenCount}</span>
          </div>

          <div className="flex items-center gap-2 w-full pt-2 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-[11px] py-1 h-7"
              onClick={() => handleSelectCentral(p.id)}
            >
              <FiGitCommit className="mr-1" /> Centrer
            </Button>
            <Link to={`/person/${p.id}`} className="flex-1">
              <Button variant="primary" size="sm" className="w-full text-[11px] py-1 h-7">
                <FiEye className="mr-1" /> Fiche
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-3xl font-display font-semibold text-text-primary">Family Tree</h1>
          <p className="text-sm text-text-secondary mt-1">Explore and navigate your family lineage</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-background p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'tree' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <FiGitCommit /> Canevas Infini
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <FiGrid /> Grille
            </button>
          </div>

          <Link to="/person/add">
            <Button className="inline-flex items-center gap-2">
              <FiPlus /> Add Person
            </Button>
          </Link>
        </div>
      </div>

      {persons.length === 0 ? (
        <Card className="text-center py-16 flex flex-col items-center justify-center space-y-4 bg-white">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <FiUser size={24} />
          </div>
          <h2 className="text-xl font-display font-medium text-text-primary">Your tree is empty</h2>
          <p className="text-text-secondary">Start building your family tree by adding the first person.</p>
          <Link to="/person/add" className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-medium mt-4">
            <FiPlus /> Add First Person
          </Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {persons.map(person => (
            <Card 
              key={person.id} 
              className="hover:shadow-lg transition-all cursor-pointer h-full flex flex-col items-center text-center p-6 space-y-4 bg-white"
              onClick={() => handleSelectCentral(person.id)}
            >
              <div className="w-20 h-20 rounded-full border-2 border-accent bg-border ring-4 ring-white shadow-lg flex items-center justify-center text-2xl font-display font-medium text-text-primary overflow-hidden">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={`${person.firstName} ${person.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  getInitials(person.firstName, person.lastName)
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-text-primary">{person.firstName} {person.lastName}</h3>
                <p className="text-sm text-text-secondary mt-1 italic">
                  {person.birthDate ? new Date(person.birthDate).getFullYear() : 'Unknown'} {person.deathDate ? `— ${new Date(person.deathDate).getFullYear()}` : '— Present'}
                </p>
              </div>
              <div className="flex gap-2 w-full pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs"
                  onClick={(e) => { e.stopPropagation(); handleSelectCentral(person.id); setViewMode('tree'); }}
                >
                  Centrer dans l'arbre
                </Button>
                <Link to={`/person/${person.id}`} onClick={(e) => e.stopPropagation()} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full text-xs">Fiche</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Infinite Canvas Tree Mode */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white p-4 rounded-2xl border border-border max-w-xl mx-auto shadow-xs">
            <label className="text-sm font-semibold text-text-primary whitespace-nowrap flex items-center gap-2">
              <FiUser className="text-primary" /> Personne centrale :
            </label>
            <select
              value={centralPersonId}
              onChange={(e) => handleSelectCentral(e.target.value)}
              className="w-full sm:w-auto flex-1 px-4 py-2 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {persons.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div 
            ref={containerRef}
            className={`relative w-full h-[65vh] min-h-[500px] bg-slate-50 rounded-2xl border border-border shadow-inner overflow-hidden active:cursor-grabbing ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <style>{`
              @keyframes flowDash {
                to { stroke-dashoffset: -12; }
              }
              .animate-flow {
                stroke-dasharray: 6 6;
                animation: flowDash 1s linear infinite;
              }
            `}</style>

            <div 
              className={`absolute inset-0 origin-top-left ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
              style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
            >
              <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
                <defs>
                  <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
                  </marker>
                  <marker id="arrow-inactive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-300" />
                  </marker>
                </defs>
                {persons.map(p => {
                  const paths = [];
                  const childX = xPos.get(p.id) || 0;
                  const childY = (levels.get(p.id) || 0) * 350;
                  const offset = 120; // Half of card height + padding
                  
                  if (p.parentId1) {
                    const p1X = xPos.get(p.parentId1) || 0;
                    const p1Y = (levels.get(p.parentId1) || 0) * 350;
                    const isActive = focusedPersonId ? (p.id === focusedPersonId || p.parentId1 === focusedPersonId) : false;
                    paths.push(
                      <path 
                        key={`${p.id}-p1`}
                        d={`M ${p1X} ${p1Y + offset} C ${p1X} ${p1Y + offset + 80}, ${childX} ${childY - offset - 80}, ${childX} ${childY - offset}`}
                        markerEnd={`url(#arrow-${isActive ? 'active' : 'inactive'})`}
                        className={`fill-none stroke-2 transition-all duration-300 ${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}`}
                      />
                    );
                  }
                  if (p.parentId2) {
                    const p2X = xPos.get(p.parentId2) || 0;
                    const p2Y = (levels.get(p.parentId2) || 0) * 350;
                    const isActive = focusedPersonId ? (p.id === focusedPersonId || p.parentId2 === focusedPersonId) : false;
                    paths.push(
                      <path 
                        key={`${p.id}-p2`}
                        d={`M ${p2X} ${p2Y + offset} C ${p2X} ${p2Y + offset + 80}, ${childX} ${childY - offset - 80}, ${childX} ${childY - offset}`}
                        markerEnd={`url(#arrow-${isActive ? 'active' : 'inactive'})`}
                        className={`fill-none stroke-2 transition-all duration-300 ${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}`}
                      />
                    );
                  }
                  
                  if (p.spouseId && p.id < p.spouseId) {
                    const sX = xPos.get(p.spouseId) || 0;
                    const sY = (levels.get(p.spouseId) || 0) * 350;
                    const isActive = focusedPersonId ? (p.id === focusedPersonId || p.spouseId === focusedPersonId) : false;
                    paths.push(
                      <g key={`${p.id}-spouse`}>
                        <path 
                          d={`M ${childX + 130} ${childY} L ${sX - 130} ${sY}`}
                          className={`fill-none stroke-2 transition-all duration-300 ${isActive ? 'stroke-rose-400 animate-flow' : 'stroke-rose-200 stroke-dasharray-[4_4]'}`}
                        />
                        <rect x={(childX + sX)/2 - 12} y={childY - 12} width="24" height="24" rx="12" fill="#fff" className="stroke-rose-200 stroke-1" />
                        <text x={(childX + sX)/2} y={childY + 4} textAnchor="middle" fontSize="12" fill="#f43f5e">♥</text>
                      </g>
                    )
                  }
                  return paths;
                })}
              </svg>
              
              {persons.map(p => {
                const x = xPos.get(p.id) || 0;
                const y = (levels.get(p.id) || 0) * 350;
                
                let role = 'Membre';
                let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                const isCentral = p.id === centralPersonId;
                
                if (isCentral) {
                  role = 'Personne Centrale';
                  badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';
                } else if (p.id === centralPerson?.parentId1 || p.id === centralPerson?.parentId2) {
                  role = 'Parent';
                  badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                } else if (p.id === centralPerson?.spouseId) {
                  role = 'Conjoint(e)';
                  badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                } else if (centralPerson && (p.parentId1 === centralPerson.id || p.parentId2 === centralPerson.id)) {
                  role = 'Enfant';
                  badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                }

                return (
                  <div 
                    key={p.id}
                    className="absolute person-card"
                    style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => e.stopPropagation()} 
                  >
                    {renderPersonCard(p, role, badgeStyle, isCentral)}
                  </div>
                )
              })}
            </div>

            {/* Toolbar */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow-lg z-30">
              <Button variant="ghost" size="sm" onClick={() => handleZoom(0.2)} className="h-10 w-10 p-0 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl">
                <FiPlus size={20} />
              </Button>
              <div className="w-6 h-px bg-border/60 mx-auto my-0.5"></div>
              <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.2)} className="h-10 w-10 p-0 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl">
                <FiMinus size={20} />
              </Button>
              <div className="w-6 h-px bg-border/60 mx-auto my-0.5"></div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  let minX = Infinity;
                  let maxX = -Infinity;
                  let minY = Infinity;
                  let maxY = -Infinity;
                  
                  persons.forEach(p => {
                    const x = xPos.get(p.id) || 0;
                    const y = (levels.get(p.id) || 0) * 350;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  });
                  
                  const width = maxX - minX + 300;
                  const height = maxY - minY + 250;
                  
                  const containerRect = containerRef.current?.getBoundingClientRect();
                  if (containerRect) {
                    const scaleX = (containerRect.width - 40) / width;
                    const scaleY = (containerRect.height - 40) / height;
                    
                    let scale = Math.min(scaleX, scaleY);
                    scale = Math.max(0.3, Math.min(scale, 1.2));
                    
                    const centerX = (minX + maxX) / 2;
                    const centerY = (minY + maxY) / 2;
                    
                    setTransform({
                      x: containerRect.width / 2 - centerX * scale,
                      y: containerRect.height / 2 - centerY * scale,
                      scale: scale
                    });
                  }
                }} 
                title="Fit to Screen" 
                className="h-10 w-10 p-0 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl"
              >
                <FiRefreshCcw size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
