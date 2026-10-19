"use client";

import React, { useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CentralBriefingTableProps {
  position: [number, number, number];
  onClick?: () => void;
}

export const CentralBriefingTable = memo(function CentralBriefingTable({ position, onClick }: CentralBriefingTableProps) {
  const hologramRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (hologramRef.current) {
      hologramRef.current.rotation.y = time * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -time * 0.3;
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.25;
    }
  });

  return (
    <group 
      position={position} 
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      {/* Basis Permukaan Meja Rapat Bundar */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.4, 0.1, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Kaki Meja Pusat */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 0.7, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Garis LED Melingkar di Tepi Meja */}
      <mesh position={[0, 0.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.9, 32]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
      </mesh>

      {/* Proyektor & Proyeksi Hologram Pusat */}
      <group position={[0, 0.78, 0]}>
        <mesh ref={hologramRef} position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.8, 1.2, 1.8, 32, 1, true]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.28} wireframe side={THREE.DoubleSide} />
        </mesh>

        <mesh ref={ringRef} position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>

        <pointLight position={[0, 1.2, 0]} color="#38bdf8" intensity={4} distance={6} />
      </group>
    </group>
  );
});