"use client";

import React, { useRef, memo, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DeskPropProps {
  position: [number, number, number];
  division?: string;
  role?: string;
}

export const DeskProp = memo(function DeskProp({ position, division }: DeskPropProps) {
  const [x, y, z] = position;
  const screenMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Membuat Canvas 2D & Tekstur dinamis
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const texture = new THREE.CanvasTexture(canvas);
    return { canvas, texture };
  }, []);

  // Animasi per frame untuk merender visual tugas spesifik tiap divisi secara real-time
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const ctx = canvas.getContext("2d");

    if (ctx) {
      let bgColor = "#0f172a";
      let accentColor = "#38bdf8";
      let title = "WORKSPACE_ACTIVE";

      switch (division) {
        case "Technology":
          bgColor = "#090d16";
          accentColor = "#38bdf8";
          title = ">> IDE / TERMINAL_RUN";
          break;
        case "Data & AI":
          bgColor = "#2e1065";
          accentColor = "#c084fc";
          title = "AI_NEURAL_WEIGHTS";
          break;
        case "Executive":
          bgColor = "#451a03";
          accentColor = "#fcd34d";
          title = "FINANCIAL_DASHBOARD";
          break;
        case "Marketing":
          bgColor = "#831843";
          accentColor = "#f472b6";
          title = "VIDEO_TIMELINE_RENDER";
          break;
        case "Operations":
          bgColor = "#064e3b";
          accentColor = "#34d399";
          title = "LOGISTICS_PIPELINE";
          break;
        case "Product":
          bgColor = "#312e81";
          accentColor = "#818cf8";
          title = "UI_WIREFRAME_MAP";
          break;
        default:
          bgColor = "#0f172a";
          accentColor = "#38bdf8";
          title = "SYSTEM_ACTIVE";
      }

      // Background Layar
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header Bar Aplikasi
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, canvas.width, 22);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(title, 10, 15);

      // --- ANIMASI SPESIFIK BERDASARKAN DIVISI ---
      if (division === "Technology") {
        ctx.font = "9px monospace";
        ctx.fillStyle = "#38bdf8";
        const offset = Math.floor(time * 4) % 5;
        const lines = [
          "const app = Express();",
          "async function initAI() {",
          "  await model.loadWeights();",
          "  console.log('Online 24/7');",
          "}",
          "export default app;"
        ];
        for (let i = 0; i < 4; i++) {
          const idx = (i + offset) % lines.length;
          ctx.fillText(lines[idx], 10, 42 + i * 18);
        }
      } 
      else if (division === "Data & AI") {
        ctx.fillStyle = "#a855f7";
        for (let i = 0; i < 6; i++) {
          const h = 20 + Math.sin(time * 3 + i * 0.7) * 35;
          ctx.fillRect(20 + i * 35, 110 - h, 22, h);
        }
      } 
      else if (division === "Executive") {
        ctx.strokeStyle = "#fcd34d";
        ctx.beginPath();
        for (let px = 10; px < canvas.width - 10; px += 15) {
          const py = 75 + Math.sin(px * 0.05 + time * 2) * 25;
          if (px === 10) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.lineWidth = 3;
        ctx.stroke();
      } 
      else if (division === "Marketing") {
        ctx.fillStyle = "#db2777";
        ctx.fillRect(15, 38, 226, 16);
        ctx.fillStyle = "#f472b6";
        ctx.fillRect(15, 60, 160, 14);
        ctx.fillRect(15, 82, 190, 14);
        
        const playheadX = 20 + ((time * 60) % 200);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 30);
        ctx.lineTo(playheadX, 115);
        ctx.stroke();
      } 
      else if (division === "Operations") {
        ctx.fillStyle = "#10b981";
        ctx.fillRect(15, 45, 50, 40);
        ctx.fillRect(80, 45, 50, 40);
        ctx.fillRect(145, 45, 50, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px monospace";
        ctx.fillText("→     →     →", 67, 70);
      } 
      else if (division === "Product") {
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 32, 90, 75);
        ctx.strokeRect(125, 32, 110, 32);
        ctx.strokeRect(125, 74, 110, 33);
      }
      else {
        ctx.fillStyle = accentColor;
        ctx.fillRect(20, 35, 100, 70);
      }
    }

    texture.needsUpdate = true;
    if (screenMatRef.current) {
      screenMatRef.current.emissiveIntensity = 0.55 + Math.sin(time * 4) * 0.15;
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Setup Meja Kerja & Peripheral PC */}
      <group position={[0, 0, 0.55]}>
        {/* Permukaan Meja Utama */}
        <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.05, 0.72]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>

        {/* Kaki Meja Besi (Kiri & Kanan) */}
        <mesh position={[-0.6, 0.33, 0]} castShadow>
          <boxGeometry args={[0.05, 0.66, 0.64]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
        </mesh>
        <mesh position={[0.6, 0.33, 0]} castShadow>
          <boxGeometry args={[0.05, 0.66, 0.64]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
        </mesh>

        {/* Stand & Dudukan Monitor PC */}
        <mesh position={[0, 0.69, 0.17]} castShadow>
          <boxGeometry args={[0.21, 0.02, 0.17]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.83, 0.19]} castShadow>
          <boxGeometry args={[0.04, 0.25, 0.03]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>

        {/* Bodi Monitor PC */}
        <mesh position={[0, 0.97, 0.17]} castShadow>
          <boxGeometry args={[0.75, 0.44, 0.03]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} />
        </mesh>

        {/* Layar Monitor dengan Animasi Tekstur Sesuai Divisi */}
        <mesh position={[0, 0.97, 0.152]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.7, 0.39]} />
          <meshStandardMaterial
            ref={screenMatRef}
            map={texture}
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={0.6}
            roughness={0.1}
          />
        </mesh>

        {/* Casing PC Tower RGB */}
        <mesh position={[0.48, 0.89, 0.07]} castShadow>
          <boxGeometry args={[0.19, 0.4, 0.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* --- MOUSE GAMING ERGONOMIS & MOUSEPAD --- */}
        <group position={[-0.28, 0.685, -0.14]}>
          {/* Alas Mousepad */}
          <mesh position={[0, 0.002, 0]} receiveShadow>
            <boxGeometry args={[0.2, 0.004, 0.22]} />
            <meshStandardMaterial color="#020617" roughness={0.8} />
          </mesh>
          {/* Lis RGB Mousepad */}
          <mesh position={[0, 0.001, 0]}>
            <boxGeometry args={[0.208, 0.002, 0.228]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} />
          </mesh>

          {/* Bodi Utama Mouse (Punggung Ergonomis) */}
          <mesh position={[0, 0.018, 0.01]} castShadow>
            <boxGeometry args={[0.062, 0.024, 0.095]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Tombol Klik Kiri & Kanan */}
          <mesh position={[-0.014, 0.022, -0.026]} castShadow>
            <boxGeometry args={[0.026, 0.012, 0.04]} />
            <meshStandardMaterial color="#1e293b" roughness={0.2} />
          </mesh>
          <mesh position={[0.014, 0.022, -0.026]} castShadow>
            <boxGeometry args={[0.026, 0.012, 0.04]} />
            <meshStandardMaterial color="#1e293b" roughness={0.2} />
          </mesh>
          {/* Scroll Wheel Metalik */}
          <mesh position={[0, 0.025, -0.025]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.01, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Strip LED RGB Belakang Mouse */}
          <mesh position={[0, 0.02, 0.04]}>
            <boxGeometry args={[0.04, 0.004, 0.008]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
        </group>

        {/* --- KEYBOARD MECHANICAL GAMING --- */}
        <group position={[0.08, 0.685, -0.14]} rotation={[0.06, 0, 0]}>
          {/* Sasis Base Aluminium Keyboard */}
          <mesh position={[0, 0.01, 0]} castShadow>
            <boxGeometry args={[0.42, 0.018, 0.145]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Layer Underglow RGB Keyboard */}
          <mesh position={[0, 0.019, 0]}>
            <boxGeometry args={[0.405, 0.002, 0.13]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
          </mesh>

          {/* Top Plate Keyboard */}
          <mesh position={[0, 0.021, 0]}>
            <boxGeometry args={[0.4, 0.004, 0.125]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>

          {/* Cluster Keycaps Alfabet */}
          <mesh position={[-0.075, 0.027, 0]} castShadow>
            <boxGeometry args={[0.23, 0.008, 0.108]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
          {/* Cluster Keycaps Navigasi / Panah */}
          <mesh position={[0.065, 0.027, 0]} castShadow>
            <boxGeometry args={[0.038, 0.008, 0.108]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
          {/* Cluster Keycaps Numpad */}
          <mesh position={[0.135, 0.027, 0]} castShadow>
            <boxGeometry args={[0.068, 0.008, 0.108]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
          {/* Spacebar Aksen Custom */}
          <mesh position={[-0.075, 0.029, 0.038]} castShadow>
            <boxGeometry args={[0.09, 0.006, 0.018]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
});