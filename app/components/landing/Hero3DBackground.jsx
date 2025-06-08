// app/components/landing/Hero3DBackground.jsx
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Generates random points in a sphere
function RandomPoints({ count = 5000 }) {
  const pointsRef = useRef();

  const [sphere] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const radius = 2.5; // Radius of the sphere
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 2 * radius;
      const y = (Math.random() - 0.5) * 2 * radius;
      const z = (Math.random() - 0.5) * 2 * radius;
      // Ensure points are within a spherical distribution
      const d = Math.sqrt(x*x + y*y + z*z);
      if (d <= radius) {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      } else { // If outside, regenerate (simple approach)
        i--;
      }
    }
    return [positions];
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x -= delta / 20;
      pointsRef.current.rotation.y -= delta / 25;
    }
  });

  return (
    <Points ref={pointsRef} positions={sphere} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.010}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

export default function Hero3DBackground() {
  return (
    <div className="absolute inset-0 z-0 opacity-50"> {/* Adjust opacity as needed */}
      <Canvas camera={{ position: [0, 0, 3.5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <RandomPoints />
      </Canvas>
    </div>
  );
}