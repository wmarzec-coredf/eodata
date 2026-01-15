import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DataTransferProps {
  startOrbitRadius: number;
  endOrbitRadius: number;
  startAngle: number;
  endAngle: number;
  startTilt: number;
  endTilt: number;
  color: string;
  speed?: number;
}

const DataTransfer = ({
  startOrbitRadius,
  endOrbitRadius,
  startAngle,
  endAngle,
  startTilt,
  endTilt,
  color,
  speed = 2,
}: DataTransferProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const progressRef = useRef(Math.random());

  const { positions, particleCount } = useMemo(() => {
    const count = 20;
    const pos = new Float32Array(count * 3);

    // Calculate start and end positions
    const startX = Math.cos(startAngle) * startOrbitRadius;
    const startZ = Math.sin(startAngle) * startOrbitRadius;
    const startY = startZ * Math.sin(startTilt);
    const adjustedStartZ = startZ * Math.cos(startTilt);

    const endX = Math.cos(endAngle) * endOrbitRadius;
    const endZ = Math.sin(endAngle) * endOrbitRadius;
    const endY = endZ * Math.sin(endTilt);
    const adjustedEndZ = endZ * Math.cos(endTilt);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      pos[i * 3] = startX + (endX - startX) * t;
      pos[i * 3 + 1] = startY + (endY - startY) * t;
      pos[i * 3 + 2] = adjustedStartZ + (adjustedEndZ - adjustedStartZ) * t;
    }

    return { positions: pos, particleCount: count };
  }, [startOrbitRadius, endOrbitRadius, startAngle, endAngle, startTilt, endTilt]);

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [positions]);

  useFrame((_, delta) => {
    progressRef.current += delta * speed;
    if (progressRef.current > 1) {
      progressRef.current = 0;
    }

    if (particlesRef.current) {
      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.3 + Math.sin(progressRef.current * Math.PI) * 0.7;
    }
  });

  return (
    <points ref={particlesRef} geometry={particleGeometry}>
      <pointsMaterial
        color={color}
        size={0.03}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default DataTransfer;
