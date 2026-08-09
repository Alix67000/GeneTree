import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { getInitials, formatPersonAge } from '@/lib/utils';
import { BirthdaysWidget } from '@/components/BirthdaysWidget';
import { 
  FiPlus, FiMinus, FiRefreshCcw, FiUser, FiGrid, FiGitCommit, 
  FiHeart, FiEye, FiArrowUp, FiArrowDown, FiDownload, FiZoomIn, FiZoomOut, FiMaximize
} from 'react-icons/fi';
import { Person } from '@/types';
import { renderGroupedPersonOptions } from '@/lib/personUtils';

export function Tree() {
  const { persons, loading } = usePersons();
  const [viewMode, setViewMode] = useState<'tree' | 'canvas' | 'grid'>('tree');
  const [centralPersonId, setCentralPersonId] = useState<string>('');
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [isCloseView, setIsCloseView] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);

  // Canvas Pan & Zoom State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialCenterDone = useRef(false);

  // Layout Engine
    const { xPos, levels, layoutNodes } = useMemo(() => {
      type TreeNode = {
        id: string;
        isCouple: boolean;
        person1: string;
        person2?: string;
        children: string[];
        gen: number;
        x: number;
        width: number;
        subtreeWidth?: number;
      };

      const genMap = new Map<string, number>();
      persons.forEach(p => genMap.set(p.id, 0));
      
      let changed = true;
      let iter = 0;
      while(changed && iter < 100) {
         changed = false;
         iter++;
         persons.forEach(p => {
            let currentGen = genMap.get(p.id)!;
            let newGen = currentGen;
            
            if (p.parentId1 || p.parentId2) {
               const g1 = p.parentId1 ? genMap.get(p.parentId1)! : -999;
               const g2 = p.parentId2 ? genMap.get(p.parentId2)! : -999;
               const parentGen = Math.max(g1, g2);
               if (parentGen + 1 > newGen) {
                   newGen = parentGen + 1;
               }
            }
            if (p.spouseId) {
               const spouseGen = genMap.get(p.spouseId)!;
               if (spouseGen > newGen) {
                   newGen = spouseGen;
               }
            }
            
            if (newGen !== currentGen) {
               genMap.set(p.id, newGen);
               changed = true;
            }
         });
      }

      const coupleMap = new Map<string, string>();
      persons.forEach(p => {
        if (p.spouseId) {
           const coupleId = [p.id, p.spouseId].sort().join('-');
           coupleMap.set(p.id, coupleId);
           coupleMap.set(p.spouseId, coupleId);
        }
      });

      const nodes = new Map<string, TreeNode>();
      persons.forEach(p => {
         const gen = genMap.get(p.id)!;
         if (coupleMap.has(p.id)) {
            const coupleId = coupleMap.get(p.id)!;
            if (!nodes.has(coupleId)) {
               const [p1, p2] = coupleId.split('-');
               nodes.set(coupleId, { id: coupleId, isCouple: true, person1: p1, person2: p2, children: [], gen, x: 0, width: 110 + 50 + 110 });
            }
         } else {
            nodes.set(p.id, { id: p.id, isCouple: false, person1: p.id, children: [], gen, x: 0, width: 110 });
         }
      });

      persons.forEach(p => {
         if (p.parentId1 || p.parentId2) {
            let parentNodeId: string | null = null;
            if (p.parentId1 && p.parentId2) {
               const cId = [p.parentId1, p.parentId2].sort().join('-');
               if (nodes.has(cId)) parentNodeId = cId;
            }
            if (!parentNodeId && p.parentId1) {
               parentNodeId = coupleMap.get(p.parentId1) || p.parentId1;
            }
            if (!parentNodeId && p.parentId2) {
               parentNodeId = coupleMap.get(p.parentId2) || p.parentId2;
            }
            
            if (parentNodeId) {
               const childNodeId = coupleMap.get(p.id) || p.id;
               const parentNode = nodes.get(parentNodeId);
               if (parentNode && !parentNode.children.includes(childNodeId)) {
                  parentNode.children.push(childNodeId);
               }
            }
         }
      });

      const getBirthDate = (nodeId: string) => {
         const node = nodes.get(nodeId)!;
         const p = persons.find(per => per.id === node.person1);
         return p?.birthDate ? new Date(p.birthDate).getTime() : 0;
      };
      nodes.forEach(node => {
         node.children.sort((a, b) => getBirthDate(a) - getBirthDate(b));
      });

      // Top-Down Subtree Layout
      const NODE_SPACING = 25;
      const isChild = new Set<string>();
      nodes.forEach(n => {
         n.children.forEach(c => isChild.add(c));
      });
      const roots = Array.from(nodes.values()).filter(n => !isChild.has(n.id));

      const visitedCalc = new Set<string>();
      function calculateSubtreeWidth(nodeId: string): number {
         const node = nodes.get(nodeId)!;
         if (visitedCalc.has(nodeId)) return node.subtreeWidth || node.width;
         visitedCalc.add(nodeId);
         
         if (node.children.length === 0) {
            node.subtreeWidth = node.width;
            return node.subtreeWidth;
         }
         
         let childrenWidth = 0;
         node.children.forEach((cId, index) => {
            childrenWidth += calculateSubtreeWidth(cId);
            if (index < node.children.length - 1) {
               childrenWidth += NODE_SPACING;
            }
         });
         
         node.subtreeWidth = Math.max(node.width, childrenWidth);
         return node.subtreeWidth;
      }
      
      roots.forEach(r => calculateSubtreeWidth(r.id));
      nodes.forEach(n => {
          if (!visitedCalc.has(n.id)) {
              roots.push(n);
              calculateSubtreeWidth(n.id);
          }
      });

      const visitedAssign = new Set<string>();
      function assignXPositions(nodeId: string, startX: number) {
         const node = nodes.get(nodeId)!;
         if (visitedAssign.has(nodeId)) return;
         visitedAssign.add(nodeId);
         
         const center = startX + node.subtreeWidth! / 2;
         node.x = center;
         
         const unvisitedChildren = node.children.filter(cId => !visitedAssign.has(cId));
         if (unvisitedChildren.length > 0) {
            let childrenWidth = 0;
            unvisitedChildren.forEach(cId => {
               childrenWidth += nodes.get(cId)!.subtreeWidth!;
            });
            childrenWidth += (unvisitedChildren.length - 1) * NODE_SPACING;
            
            let currentX = center - (childrenWidth / 2);
            unvisitedChildren.forEach(cId => {
               const child = nodes.get(cId)!;
               assignXPositions(cId, currentX);
               currentX += child.subtreeWidth! + NODE_SPACING;
            });
         }
      }

      let currentRootX = 0;
      roots.forEach(r => {
         if (!visitedAssign.has(r.id)) {
             assignXPositions(r.id, currentRootX);
             currentRootX += nodes.get(r.id)!.subtreeWidth! + 40;
         }
      });

      const xPosMap = new Map<string, number>();
      nodes.forEach(n => {
         if (n.isCouple && n.person2) {
            xPosMap.set(n.person1, n.x - 65);
            xPosMap.set(n.person2, n.x + 65);
         } else {
            xPosMap.set(n.person1, n.x);
         }
      });

      if (isCloseView && centralPersonId) {
         const cp = persons.find(p => p.id === centralPersonId);
         if (cp) {
             const dynXPos = new Map<string, number>();
             const dynGen = new Map<string, number>();
             const dynNodes = new Map<string, TreeNode>();

             const getOrCreateNode = (id: string, isCouple: boolean, p1: string, p2?: string, gen = 0) => {
                 if (!dynNodes.has(id)) {
                     dynNodes.set(id, { id, isCouple, person1: p1, person2: p2, children: [], gen, x: 0, width: isCouple ? 270 : 110 });
                 }
                 return dynNodes.get(id)!;
             };

             // Gen 0
             dynGen.set(cp.id, 0);
             dynXPos.set(cp.id, -65);
             let cpNodeId = cp.id;
             if (cp.spouseId) {
                 dynGen.set(cp.spouseId, 0);
                 dynXPos.set(cp.spouseId, 65);
                 cpNodeId = [cp.id, cp.spouseId].sort().join('-');
                 const cpNode = getOrCreateNode(cpNodeId, true, cp.id, cp.spouseId, 0);
                 cpNode.x = 0;
             } else {
                 dynXPos.set(cp.id, 0);
                 const cpNode = getOrCreateNode(cpNodeId, false, cp.id, undefined, 0);
                 cpNode.x = 0;
             }

             // Parents (Gen -1)
             let parentNodeId: string | null = null;
             if (cp.parentId1 && cp.parentId2) {
                 parentNodeId = [cp.parentId1, cp.parentId2].sort().join('-');
                 dynGen.set(cp.parentId1, -1);
                 dynGen.set(cp.parentId2, -1);
                 dynXPos.set(cp.parentId1, -130);
                 dynXPos.set(cp.parentId2, 0);
                 const pNode = getOrCreateNode(parentNodeId, true, cp.parentId1, cp.parentId2, -1);
                 pNode.x = -65;
             } else if (cp.parentId1) {
                 parentNodeId = cp.parentId1;
                 dynGen.set(cp.parentId1, -1);
                 dynXPos.set(cp.parentId1, -65);
                 const pNode = getOrCreateNode(parentNodeId, false, cp.parentId1, undefined, -1);
                 pNode.x = -65;
             } else if (cp.parentId2) {
                 parentNodeId = cp.parentId2;
                 dynGen.set(cp.parentId2, -1);
                 dynXPos.set(cp.parentId2, -65);
                 const pNode = getOrCreateNode(parentNodeId, false, cp.parentId2, undefined, -1);
                 pNode.x = -65;
             }

             // Siblings
             const siblings = persons.filter(p => 
               p.id !== cp.id && (
                 (cp.parentId1 && (p.parentId1 === cp.parentId1 || p.parentId2 === cp.parentId1)) ||
                 (cp.parentId2 && (p.parentId1 === cp.parentId2 || p.parentId2 === cp.parentId2))
               )
             );

             let leftX = -230;
             let rightX = 230;
             siblings.forEach((sib, index) => {
                 dynGen.set(sib.id, 0);
                 let sibNodeId = sib.id;
                 let sibNodeX = 0;
                 if (index % 2 === 0) {
                     if (sib.spouseId) {
                         dynGen.set(sib.spouseId, 0);
                         dynXPos.set(sib.id, leftX - 65);
                         dynXPos.set(sib.spouseId, leftX + 65);
                         sibNodeX = leftX;
                         sibNodeId = [sib.id, sib.spouseId].sort().join('-');
                         getOrCreateNode(sibNodeId, true, sib.id, sib.spouseId, 0).x = sibNodeX;
                     } else {
                         dynXPos.set(sib.id, leftX);
                         sibNodeX = leftX;
                         getOrCreateNode(sibNodeId, false, sib.id, undefined, 0).x = sibNodeX;
                     }
                     leftX -= 250;
                 } else {
                     if (sib.spouseId) {
                         dynGen.set(sib.spouseId, 0);
                         dynXPos.set(sib.id, rightX - 65);
                         dynXPos.set(sib.spouseId, rightX + 65);
                         sibNodeX = rightX;
                         sibNodeId = [sib.id, sib.spouseId].sort().join('-');
                         getOrCreateNode(sibNodeId, true, sib.id, sib.spouseId, 0).x = sibNodeX;
                     } else {
                         dynXPos.set(sib.id, rightX);
                         sibNodeX = rightX;
                         getOrCreateNode(sibNodeId, false, sib.id, undefined, 0).x = sibNodeX;
                     }
                     rightX += 250;
                 }
                 if (parentNodeId) {
                     const pNode = getOrCreateNode(parentNodeId, false, '', '', -1);
                     pNode.children.push(sibNodeId);
                 }
             });

             if (parentNodeId) {
                 dynNodes.get(parentNodeId)!.children.push(cpNodeId);
             }

             // Children (Gen 1)
             const children = persons.filter(p => p.parentId1 === cp.id || p.parentId2 === cp.id);
             const childrenCount = children.length;
             children.forEach((child, idx) => {
                 dynGen.set(child.id, 1);
                 const cx = (idx - (childrenCount - 1) / 2) * 150;
                 dynXPos.set(child.id, cx);
                 const childNodeId = child.id;
                 getOrCreateNode(childNodeId, false, child.id, undefined, 1).x = cx;
                 dynNodes.get(cpNodeId)!.children.push(childNodeId);
             });

             return { xPos: dynXPos, levels: dynGen, layoutNodes: Array.from(dynNodes.values()) };
         }
      }

      return { xPos: xPosMap, levels: genMap, layoutNodes: Array.from(nodes.values()) };
    }, [persons, isCloseView, centralPersonId]);

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
        const y = (levels.get(p.id) || 0) * (isCloseView ? 180 : 200);
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

  useEffect(() => {
    if (isCloseView) {
      centerOnPoint(0, 0, 1);
    }
  }, [isCloseView]);

  const handleSelectCentral = (id: string) => {
    setCentralPersonId(id);
    setHighlightedPersonId(id);
    setFocusedPersonId(id);
    setViewMode('canvas');
    setIsCloseView(true); // Ouvre immédiatement sa Vue Famille Proche sur un seul écran
    centerOnPoint(0, 0, 1); // Centre l'écran parfaitement sur l'origine (0, 0)
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

  const handleResetZoom = () => setTransform({ x: 0, y: 0, scale: 1 });

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

  // Touch Handling for Panning & Pinch-to-Zoom
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y };
      setDragStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
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
        y: e.touches[0].clientY - dragStartRef.current.y
      }));
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / touchStartDistRef.current;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(touchStartScaleRef.current * scaleFactor, 0.3), 2.5),
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  }

  const centralPerson = persons.find(p => p.id === centralPersonId) || persons[0];

  const isConnectedToFocused = (pId: string) => {
    if (!focusedPersonId) return false;
    if (focusedPersonId === pId) return true;
    const p = persons.find(per => per.id === focusedPersonId);
    const other = persons.find(per => per.id === pId);
    if (!p || !other) return false;

    // 1. Parents directs
    if (p.parentId1 === pId || p.parentId2 === pId) return true;
    // 2. Conjoint(e)
    if (p.spouseId === pId || other.spouseId === focusedPersonId) return true;
    // 3. Enfants directs
    if (other.parentId1 === focusedPersonId || other.parentId2 === focusedPersonId) return true;
    // 4. Frères et sœurs (Siblings : partageant au moins un parent)
    if (
      (p.parentId1 && (other.parentId1 === p.parentId1 || other.parentId2 === p.parentId1)) ||
      (p.parentId2 && (other.parentId1 === p.parentId2 || other.parentId2 === p.parentId2))
    ) {
      return true;
    }

    return false;
  };

  const renderPersonCard = (p: Person, roleLabel: string, badgeStyle: string, isCentral = false) => {
    const isFocused = focusedPersonId ? isConnectedToFocused(p.id) : false;
    const isDimmed = focusedPersonId ? !isFocused : false;
    const isHighlighted = highlightedPersonId === p.id;

    return (
      <div 
        className={`flex flex-col items-center transition-all duration-300 ${isDimmed ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'} ${isHighlighted ? 'scale-105 ring-4 ring-accent rounded-2xl p-1 bg-accent/10 z-20' : 'z-10'}`}
        onClick={(e) => {
          e.stopPropagation();
          handleSelectCentral(p.id);
        }}
      >
        {roleLabel && roleLabel !== 'Membre' && roleLabel !== 'Member' && (
          <span className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 px-2.5 py-0.5 rounded-full border shadow-xs transition-colors ${badgeStyle}`}>
            {roleLabel}
          </span>
        )}
        <Card className={`relative transition-all w-[110px] p-2 flex flex-col items-center text-center bg-white border ${isCentral ? 'ring-4 ring-primary/40 border-primary shadow-lg' : isFocused ? 'ring-2 ring-primary border-primary shadow-md' : 'border-border/80 hover:shadow-md cursor-pointer'}`}>
          <div className="w-12 h-12 rounded-full border-2 border-accent bg-border ring-2 ring-white shadow flex items-center justify-center text-sm font-display font-semibold text-text-primary overflow-hidden shrink-0 my-1">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt={`${p.firstName} ${p.lastName}`} className="w-full h-full object-cover" />
            ) : (
              getInitials(p.firstName, p.lastName)
            )}
          </div>

          <div className="w-full truncate px-0.5 mt-1">
            <h3 className="font-display font-bold text-xs text-text-primary truncate">
              {p.firstName} {p.lastName}
            </h3>
          </div>
        </Card>
      </div>
    );
  };

  const handleExportTree = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(persons, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "family_tree.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-text-primary">Family Tree</h1>
          <p className="text-xs text-text-secondary">Explore and navigate your family lineage</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="inline-flex h-9 p-0.5 bg-background border border-border rounded-lg shrink-0">
            <button
              onClick={() => { setViewMode('canvas'); setIsCloseView(false); }}
              className={`px-3 h-full rounded-md text-xs font-medium transition-colors ${
                viewMode === 'canvas' || viewMode === 'tree' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Canevas Infini
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 h-full rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Grille
            </button>
          </div>
          <Link
            to="/person/add"
            className="h-9 px-4 inline-flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            + Add Person
          </Link>
        </div>
      </div>

      <BirthdaysWidget />

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
                  {formatPersonAge(person.birthDate, person.deathDate, person.isLiving)}
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
              {renderGroupedPersonOptions(persons)}
            </select>
          </div>

          <div 
            ref={containerRef}
            className={`relative w-full h-[65vh] min-h-[500px] bg-slate-50 rounded-2xl border border-border shadow-inner overflow-hidden active:cursor-grabbing touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {isCloseView && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsCloseView(false); }}
                className="absolute top-4 left-4 z-40 bg-white/95 backdrop-blur border border-border px-4 py-2 rounded-xl text-xs font-bold text-text-primary shadow-lg hover:bg-slate-50 transition-all cursor-pointer pointer-events-auto"
              >
                ← Retour à l'Arbre Global
              </button>
            )}
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
                {layoutNodes.map(node => {
                const paths = [];
                if (node.children.length > 0) {
                  const parentX = node.x;
                  const parentY = node.gen * (isCloseView ? 180 : 200);
                  const offset = 65; // drop down from center
                  const startY = parentY + offset;
                  const midY = startY + 30; // horizontal line Y
                  
                  const isActive = focusedPersonId ? (
                    node.person1 === focusedPersonId || 
                    node.person2 === focusedPersonId || 
                    node.children.some(cid => {
                       const c = layoutNodes.find(n => n.id === cid);
                       return c && (c.person1 === focusedPersonId || c.person2 === focusedPersonId);
                    })
                  ) : false;

                  paths.push(
                    <path
                      key={`${node.id}-trunk`}
                      d={`M ${parentX} ${startY} L ${parentX} ${midY}`}
                      className={`fill-none stroke-2 transition-all duration-300 ${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}`}
                    />
                  );

                  const childTargets = node.children.map(cid => {
                    const childNode = layoutNodes.find(n => n.id === cid);
                    let targetX = childNode ? childNode.x : 0;
                    if (childNode && childNode.isCouple) {
                       const p1 = persons.find(p => p.id === childNode.person1);
                       const p2 = persons.find(p => p.id === childNode.person2);
                       const isP1Child = p1?.parentId1 === node.person1 || p1?.parentId1 === node.person2 || p1?.parentId2 === node.person1 || p1?.parentId2 === node.person2;
                       const isP2Child = p2?.parentId1 === node.person1 || p2?.parentId1 === node.person2 || p2?.parentId2 === node.person1 || p2?.parentId2 === node.person2;
                       
                       if (isP1Child && !isP2Child) {
                           targetX = xPos.get(childNode.person1) || 0;
                       } else if (isP2Child && !isP1Child) {
                           targetX = childNode.person2 ? (xPos.get(childNode.person2) || 0) : 0;
                       }
                    }
                    return { cid, childNode, targetX };
                  });
                  
                  if (childTargets.length > 1) {
                     const sortedTargets = [...childTargets].sort((a, b) => a.targetX - b.targetX);
                     const minX = Math.min(sortedTargets[0].targetX, parentX);
                     const maxX = Math.max(sortedTargets[sortedTargets.length - 1].targetX, parentX);
                     
                     paths.push(
                       <path
                          key={`${node.id}-horiz`}
                          d={`M ${minX} ${midY} L ${maxX} ${midY}`}
                          className={`fill-none stroke-2 transition-all duration-300 ${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}`}
                       />
                     );
                  } else if (childTargets.length === 1) {
                     const tX = childTargets[0].targetX;
                     if (tX !== parentX) {
                       paths.push(
                         <path
                            key={`${node.id}-horiz`}
                            d={`M ${parentX} ${midY} L ${tX} ${midY}`}
                            className={`fill-none stroke-2 transition-all duration-300 ${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}`}
                         />
                       );
                     }
                  }
                  
                  childTargets.forEach(({ cid, childNode, targetX }) => {
                     if (!childNode) return;
                     const childY = childNode.gen * (isCloseView ? 180 : 200);
                     const childActive = isActive || (focusedPersonId && (childNode.person1 === focusedPersonId || childNode.person2 === focusedPersonId));

                     paths.push(
                       <path
                          key={`${node.id}-to-${cid}`}
                          d={`M ${targetX} ${midY} L ${targetX} ${childY - offset}`}
                          className={`fill-none stroke-2 transition-all duration-300 ${childActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}`}
                       />
                     );
                  });
                }
                
                if (node.isCouple && node.person2) {
                  const p1X = xPos.get(node.person1) || 0;
                  const p2X = xPos.get(node.person2) || 0;
                  const y = node.gen * (isCloseView ? 180 : 200);
                  
                  // Vérifie si l'un des deux conjoints fait partie de l'entourage illuminé
                  const isCoupleConnected = focusedPersonId ? (
                    isConnectedToFocused(node.person1) || isConnectedToFocused(node.person2)
                  ) : true;
                  
                  // N'affiche le cœur que si le couple est actif/connecté, sans jamais faire return null
                  if (isCoupleConnected) {
                    paths.push(
                      <g key={`${node.id}-couple`}>
                        <path 
                          d={`M ${Math.min(p1X, p2X) + 75} ${y} L ${Math.max(p1X, p2X) - 75} ${y}`}
                          className="fill-none stroke-2 stroke-rose-400 animate-flow"
                        />
                        <rect x={node.x - 12} y={y - 12} width="24" height="24" rx="12" fill="#fff" className="stroke-rose-200 stroke-1 shadow-sm" />
                        <text x={node.x} y={y + 4} textAnchor="middle" fontSize="12" fill="#f43f5e">♥</text>
                      </g>
                    );
                  }
                }
                return paths;
              })}
              </svg>
              {persons.map(p => {
                if (isCloseView && !xPos.has(p.id)) return null;
                const x = xPos.get(p.id) || 0;
                const y = (levels.get(p.id) || 0) * (isCloseView ? 180 : 200);
                
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

                let isCardActive = true;
                if (focusedPersonId) {
                  isCardActive = isConnectedToFocused(p.id);
                }

                return (
                  <div 
                    key={p.id}
                    className={`absolute person-card transition-all duration-300 ${!isCardActive ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}
                    style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: isCardActive ? 10 : 1 }}
                    onMouseDown={(e) => e.stopPropagation()} 
                    onClick={() => setFocusedPersonId(p.id)}
                  >
                    {renderPersonCard(p, role, badgeStyle, isCentral)}
                  </div>
                )
              })}
            </div>

            {/* Toolbar */}
            <div className="zoom-toolbar absolute bottom-6 right-6 flex flex-col gap-1 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200 z-30 w-auto">
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
      )}
    </div>
  );
}
