import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

interface SatelliteProps {
  orbitRadius: number;
  orbitSpeed: number;
  orbitTilt: number;
  orbitOffset: number;
  color: string;
  size?: number;
  label?: string;
  onClick?: () => void;
}

const Satellite = ({
  orbitRadius,
  orbitSpeed,
  orbitTilt,
  orbitOffset,
  color,
  size = 0.08,
  onClick,
}: SatelliteProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const satelliteRef = useRef<THREE.Group>(null);
  const angleRef = useRef(orbitOffset);

  // Create orbit line points
  const orbitPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      points.push([
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius,
      ]);
    }
    return points;
  }, [orbitRadius]);

  useFrame((_, delta) => {
    angleRef.current += delta * orbitSpeed;
    
    if (satelliteRef.current) {
      satelliteRef.current.position.x = Math.cos(angleRef.current) * orbitRadius;
      satelliteRef.current.position.z = Math.sin(angleRef.current) * orbitRadius;
      
      // Make satellite face direction of travel
      satelliteRef.current.rotation.y = -angleRef.current + Math.PI / 2;
    }
  });

  return (
    <group ref={groupRef} rotation={[orbitTilt, 0, 0]}>
      {/* Orbit path */}
      <Line
        points={orbitPoints}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.3}
      />

      {/* Satellite */}
      <group ref={satelliteRef} onClick={onClick}>
        {/* Main body */}
        <mesh>
          <boxGeometry args={[size, size * 0.5, size * 0.5]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} emissive={color} emissiveIntensity={0.5} />
        </mesh>

        {/* Solar panels */}
        <mesh position={[size * 1.2, 0, 0]}>
          <boxGeometry args={[size * 1.5, size * 0.05, size * 0.8]} />
          <meshStandardMaterial color="#60a5fa" metalness={0.4} roughness={0.3} emissive="#3b82f6" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-size * 1.2, 0, 0]}>
          <boxGeometry args={[size * 1.5, size * 0.05, size * 0.8]} />
          <meshStandardMaterial color="#60a5fa" metalness={0.4} roughness={0.3} emissive="#3b82f6" emissiveIntensity={0.3} />
        </mesh>

        {/* Antenna */}
        <mesh position={[0, size * 0.5, 0]}>
          <cylinderGeometry args={[size * 0.05, size * 0.05, size * 0.3]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Clickable hitbox (larger invisible sphere) */}
        {onClick && (
          <mesh visible={false}>
            <sphereGeometry args={[size * 3, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}

        {/* Signal glow */}
        <pointLight color={color} intensity={1.5} distance={2} />
      </group>
    </group>
  );
};

export default Satellite;
