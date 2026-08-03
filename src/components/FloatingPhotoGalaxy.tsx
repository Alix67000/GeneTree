import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { usePersons } from '@/hooks/usePersons';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalPosition {
  theta: number;
  phi: number;
  radius: number;
}

export interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
}

export interface ImageData {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  radiansToDegrees: (radians: number): number => radians * (180 / Math.PI),
  sphericalToCartesian: (radius: number, theta: number, phi: number): Position3D => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }),
  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  },
};

export function FloatingPhotoGalaxy() {
  const { persons } = usePersons();

  const images: ImageData[] = useMemo(() => {
    return persons
      .filter(p => p.photoUrl && p.photoUrl.trim() !== '')
      .map(p => ({
        id: p.id,
        src: p.photoUrl!,
        alt: `${p.firstName} ${p.lastName}`,
        title: `${p.firstName} ${p.lastName}`,
        description: p.birthDate ? `Born: ${p.birthDate}` : undefined,
      }));
  }, [persons]);

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [rotation, setRotation] = useState({ x: 15, y: 15, z: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [imagePositions, setImagePositions] = useState<SphericalPosition[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);

  const containerSize = 440;
  const actualSphereRadius = 180;
  const baseImageSize = containerSize * 0.16;
  const maxRotationSpeed = 3;
  const dragSensitivity = 0.5;
  const momentumDecay = 0.95;
  const autoRotate = true;
  const autoRotateSpeed = 0.18; // Slow, smooth rotation

  const generateSpherePositions = useCallback((): SphericalPosition[] => {
    const positions: SphericalPosition[] = [];
    const imageCount = images.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = (2 * Math.PI) / goldenRatio;

    for (let i = 0; i < imageCount; i++) {
      const t = i / imageCount;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;
      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;

      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
      if (phi < 90) phi = Math.max(15, phi - poleBonus);
      else phi = Math.min(165, phi + poleBonus);

      theta = (theta + (Math.random() - 0.5) * 15) % 360;
      phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 8));

      positions.push({ theta, phi, radius: actualSphereRadius });
    }
    return positions;
  }, [images.length, actualSphereRadius]);

  const calculateWorldPositions = useCallback((): WorldPosition[] => {
    return imagePositions.map((pos, index) => {
      const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
      const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
      const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
      const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);

      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1;
      z = z1;

      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2;
      z = z2;

      const isVisible = z > -160;
      const fadeOpacity = z <= -80 ? Math.max(0, (z + 160) / 80) : 1;
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      const distanceRatio = Math.min(distanceFromCenter / actualSphereRadius, 1);
      const centerScale = Math.max(0.35, 1 - distanceRatio * 0.65);
      const depthScale = (z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.45, 0.75 + depthScale * 0.35);

      return {
        x,
        y,
        z,
        scale,
        zIndex: Math.round(1000 + z),
        isVisible,
        fadeOpacity,
        originalIndex: index,
      };
    });
  }, [imagePositions, rotation, actualSphereRadius]);

  const clampRotationSpeed = useCallback((speed: number): number => {
    return Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));
  }, []);

  const updateMomentum = useCallback(() => {
    if (isDragging) return;
    setVelocity(prev => ({
      x: prev.x * momentumDecay,
      y: prev.y * momentumDecay,
    }));
    setRotation(prev => {
      let newY = prev.y + (autoRotate ? autoRotateSpeed : 0) + clampRotationSpeed(velocity.y);
      return {
        x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(velocity.x)),
        y: SPHERE_MATH.normalizeAngle(newY),
        z: prev.z,
      };
    });
  }, [isDragging, momentumDecay, velocity, clampRotationSpeed, autoRotate, autoRotateSpeed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    setRotation(prev => ({
      x: SPHERE_MATH.normalizeAngle(prev.x - deltaY * dragSensitivity),
      y: SPHERE_MATH.normalizeAngle(prev.y + deltaX * dragSensitivity),
      z: prev.z,
    }));
    setVelocity({
      x: clampRotationSpeed(-deltaY * dragSensitivity),
      y: clampRotationSpeed(deltaX * dragSensitivity),
    });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, dragSensitivity, clampRotationSpeed]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setImagePositions(generateSpherePositions());
  }, [generateSpherePositions]);

  useEffect(() => {
    const animate = () => {
      updateMomentum();
      animationFrame.current = requestAnimationFrame(animate);
    };
    if (isMounted) animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [isMounted, updateMomentum]);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMounted, handleMouseMove, handleMouseUp]);

  if (!isMounted || images.length === 0) return null;

  const worldPositions = calculateWorldPositions();

  return (
    <>
      <div
        ref={containerRef}
        className="relative select-none cursor-grab active:cursor-grabbing mx-auto my-4 overflow-hidden"
        style={{ width: containerSize, height: containerSize, perspective: '1000px' }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative w-full h-full" style={{ zIndex: 10 }}>
          {images.map((image, index) => {
            const position = worldPositions[index];
            if (!position || !position.isVisible) return null;
            const imageSize = baseImageSize * position.scale;
            const isHovered = hoveredIndex === index;
            const finalScale = isHovered ? Math.min(1.25, 1.25 / position.scale) : 1;

            return (
              <div
                key={image.id}
                className="absolute cursor-pointer select-none transition-transform duration-200 ease-out"
                style={{
                  width: `${imageSize}px`,
                  height: `${imageSize}px`,
                  left: `${containerSize / 2 + position.x}px`,
                  top: `${containerSize / 2 + position.y}px`,
                  opacity: position.fadeOpacity,
                  transform: `translate(-50%, -50%) scale(${finalScale})`,
                  zIndex: position.zIndex,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-xl border-2 border-white">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative p-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center hover:bg-black/70"
            >
              <X size={16} />
            </button>
            <div className="w-48 h-48 rounded-full overflow-hidden mx-auto border-4 border-primary shadow-lg mt-2">
              <img src={selectedImage.src} alt={selectedImage.alt} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold font-display mt-4">{selectedImage.title}</h3>
            {selectedImage.description && <p className="text-xs text-text-secondary mt-1">{selectedImage.description}</p>}
          </div>
        </div>
      )}
    </>
  );
}
