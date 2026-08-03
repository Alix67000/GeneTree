import React, { useMemo, useState, useEffect, useRef } from 'react';
import { usePersons } from '@/hooks/usePersons';
import { Person } from '@/types';
import { getInitials } from '@/lib/utils';

export function FloatingPhotoGalaxy() {
  const { persons } = usePersons();

  const { nodes, totalPhotos } = useMemo(() => {
    // 1. Filter persons with photos
    const withPhoto = persons.filter(p => p.photoUrl && p.photoUrl.trim() !== '');
    const withoutPhoto = persons.filter(p => !p.photoUrl || p.photoUrl.trim() === '');
    
    // We want exactly 24 nodes
    const targetCount = 24;
    let baseNodes: Person[] = [...withPhoto];
    
    if (baseNodes.length < targetCount) {
      const needed = targetCount - baseNodes.length;
      const toAdd = withoutPhoto.slice(0, needed);
      baseNodes = [...baseNodes, ...toAdd];
    }
    
    if (baseNodes.length < 15 && baseNodes.length > 0) {
      let i = 0;
      while (baseNodes.length < targetCount) {
        baseNodes.push(baseNodes[i % baseNodes.length]);
        i++;
      }
    } else {
       baseNodes = baseNodes.slice(0, targetCount);
    }

    const shuffled = [...baseNodes].sort(() => 0.5 - Math.random());

    // Generate Fibonacci sphere points
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const n = shuffled.length;
    
    const formattedNodes = shuffled.map((person, i) => {
      // Fibonacci sphere mapping
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / n);
      
      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(phi);
      
      return {
        person,
        x,
        y,
        z,
        id: `${person.id}-${i}` // unique id for duplicates
      };
    });

    return { nodes: formattedNodes, totalPhotos: withPhoto.length };
  }, [persons]);

  const [rotationY, setRotationY] = useState(0);
  const requestRef = useRef<number>();

  const animate = () => {
    setRotationY(prev => prev + 0.005);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col items-center my-8">
      <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] flex items-center justify-center">
        <div className="relative w-full h-full">
          {nodes.map((node) => {
            // Apply Y-axis rotation
            const s = Math.sin(rotationY);
            const c = Math.cos(rotationY);
            
            const rx = node.x * c - node.z * s;
            const rz = node.x * s + node.z * c;
            const ry = node.y;
            
            // Map 3D to 2D
            // rz is between -1 and 1
            // scale: 0.6 to 1.2
            // opacity: 0.4 to 1
            const scale = 0.9 + rz * 0.3; 
            const opacity = 0.7 + rz * 0.3; 
            const zIndex = Math.round((rz + 1) * 100);
            
            // Sphere radius in pixels
            const radius = 140; // Adjust for spread
            const left = `calc(50% + ${rx * radius}px)`;
            const top = `calc(50% + ${ry * radius}px)`;

            return (
              <div
                key={node.id}
                className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center"
                style={{
                  left,
                  top,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                }}
              >
                {node.person.photoUrl ? (
                  <img 
                    src={node.person.photoUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-medium text-xs sm:text-sm">
                    {getInitials(node.person.firstName || '', node.person.lastName || '')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-sm font-medium text-text-secondary mt-6">
        Family Heritage • {totalPhotos} preserved photos in the album
      </p>
    </div>
  );
}
