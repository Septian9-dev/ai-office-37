"use client";

import React, { useRef, useEffect, useMemo, memo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

interface Agent3DProps {
  modelUrl: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  animationName?: string;
  scale?: number | [number, number, number];
  agentId: string;
  onClick?: () => void;
}

const SHIRT_COLORS = [
  "#2563eb", "#dc2626", "#059669", "#d97706",
  "#7c3aed", "#db2777", "#475569", "#0891b2"
];

export const Agent3D = memo(function Agent3D({
  modelUrl,
  position,
  rotation = [0, 0, 0],
  animationName = "Idle",
  scale = 0.01,
  agentId,
  onClick,
}: Agent3DProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelUrl);

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, group);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  // Variasi warna baju agen berdasarkan ID
  useEffect(() => {
    const numericId = parseInt(agentId.replace(/\D/g, "")) || 0;
    const shirtColor = SHIRT_COLORS[numericId % SHIRT_COLORS.length];

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();

        const isSkinOrHead =
          name.includes("head") ||
          name.includes("face") ||
          name.includes("skin") ||
          name.includes("eye") ||
          name.includes("body");

        if (!isSkinOrHead) {
          mesh.material = (mesh.material as THREE.Material).clone();
          if (
            name.includes("top") ||
            name.includes("shirt") ||
            name.includes("cloth") ||
            name.includes("suit") ||
            name.includes("bottom") ||
            name.includes("pant")
          ) {
            (mesh.material as THREE.MeshStandardMaterial).color = new THREE.Color(shirtColor);
          }
        }
      }
    });
  }, [clonedScene, agentId]);

  // Transisi animasi halus (crossfade) tanpa jeda reset ke T-Pose
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;

    const targetAction =
      actions[animationName] ||
      Object.values(actions).find((act) =>
        act?.getClip().name.toLowerCase().includes("idle")
      ) ||
      Object.values(actions)[0];

    if (!targetAction) return;

    const numericId = parseInt(agentId.replace(/\D/g, "")) || 0;
    const fixedSpeed = 0.85 + (numericId % 5) * 0.06;

    // Pastikan animasi meloop terus tanpa berhenti
    targetAction.setLoop(THREE.LoopRepeat, Infinity);
    targetAction.clampWhenFinished = false;
    targetAction.enabled = true;
    targetAction.setEffectiveTimeScale(fixedSpeed);

    const prevAction = activeActionRef.current;

    if (prevAction && prevAction !== targetAction) {
      targetAction.reset().play();
      prevAction.crossFadeTo(targetAction, 0.3, true);
    } else {
      targetAction.reset().fadeIn(0.25).play();
    }

    activeActionRef.current = targetAction;
  }, [animationName, actions, agentId]);

  return (
    <group ref={group} position={position} rotation={rotation} onClick={onClick} dispose={null}>
      <primitive object={clonedScene} scale={scale} />
    </group>
  );
});