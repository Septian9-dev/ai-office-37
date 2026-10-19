"use client";

import React, { memo } from "react";

interface DivisionCarpetProps {
  position: [number, number, number];
  division: string;
}

const DIVISION_COLORS: Record<string, string> = {
  Executive: "#6366f1",   // Indigo
  Technology: "#0284c7",  // Sky Blue
  "Data & AI": "#a855f7", // Purple
  Marketing: "#ec4899",   // Pink
  Operations: "#10b981",  // Emerald
  Product: "#f97316",     // Orange
};

export const DivisionCarpet = memo(function DivisionCarpet({
  position,
  division,
}: DivisionCarpetProps) {
  const color = DIVISION_COLORS[division] || "#64748b";

  return (
    <mesh
      position={[position[0], -0.015, position[2] + 0.2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[2.7, 2.7]} />
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
});