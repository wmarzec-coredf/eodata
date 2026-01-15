import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import * as satelliteLib from "satellite.js";
import { TLEData, parseTLE, getECIPosition, getOrbitColor, getOrbitType } from "@/lib/tle-service";

interface TLESatelliteProps {
  tle: TLEData;
  simulationTime: number;
  baseTime: Date;
  onClick?: () => void;
  showTrail?: boolean;
  showOrbit?: boolean;
  showGlow?: boolean;
  size?: number;
  selected?: boolean;
}

const TLESatellite = ({
  tle,
  simulationTime,
  baseTime,
  onClick,
  showTrail = true,
  showOrbit = true,
  showGlow = false,
  size = 0.06,
  selected = false,
}: TLESatelliteProps) => {
  const satelliteRef = useRef<THREE.Group>(null);
  const [trailPoints, setTrailPoints] = useState<[number, number, number][]>([]);
  const frameCountRef = useRef(0);
  
  const satrec = useMemo(() => parseTLE(tle), [tle]);
  
  // Calculate current position
  const currentDate = useMemo(() => {
    return new Date(baseTime.getTime() + simulationTime * 1000);
  }, [baseTime, simulationTime]);

  const position = useMemo(() => {
    if (!satrec) return null;
    return getECIPosition(satrec, currentDate);
  }, [satrec, currentDate]);

  // Get altitude for color
  const { orbitType, color } = useMemo(() => {
    if (!satrec) return { orbitType: "LEO" as const, color: "#4ade80" };
    
    try {
      const posVel = satelliteLib.propagate(satrec, currentDate);
      if (posVel.position && typeof posVel.position !== "boolean") {
        const pos = posVel.position as satelliteLib.EciVec3<number>;
        const altitude = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2) - 6371;
        const type = getOrbitType(altitude);
        return { orbitType: type, color: getOrbitColor(type) };
      }
    } catch {
      // Ignore errors
    }
    return { orbitType: "LEO" as const, color: "#4ade80" };
  }, [satrec, currentDate]);

  // Generate orbit path
  const orbitPoints = useMemo(() => {
    if (!satrec || !showOrbit) return [];
    
    const points: [number, number, number][] = [];
    const periodMinutes = satrec.no ? (2 * Math.PI / satrec.no) : 90; // Orbital period
    const steps = 128;
    const stepMs = (periodMinutes * 60 * 1000) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const time = new Date(currentDate.getTime() + i * stepMs);
      const pos = getECIPosition(satrec, time);
      if (pos) {
        points.push([pos.x, pos.y, pos.z]);
      }
    }
    
    return points;
  }, [satrec, showOrbit, currentDate]);

  // Update trail
  useFrame(() => {
    if (!position || !satelliteRef.current) return;
    
    satelliteRef.current.position.set(position.x, position.y, position.z);
    
    frameCountRef.current += 1;
    
    if (showTrail && frameCountRef.current % 5 === 0) {
      setTrailPoints((prev) => {
        const newPoint: [number, number, number] = [position.x, position.y, position.z];
        const updated = [...prev, newPoint];
        if (updated.length > 30) {
          return updated.slice(-30);
        }
        return updated;
      });
    }
  });

  // Trail colors with fade effect
  const trailColors = useMemo(() => {
    if (trailPoints.length < 2) return [];
    return trailPoints.map((_, i) => {
      const opacity = (i / trailPoints.length) * 0.8;
      const col = new THREE.Color(color);
      col.multiplyScalar(0.3 + opacity * 0.7);
      return col;
    });
  }, [trailPoints, color]);

  if (!position) return null;

  return (
    <group>
      {/* Orbit path */}
      {showOrbit && orbitPoints.length > 2 && (
        <Line
          points={orbitPoints}
          color={color}
          lineWidth={1}
          transparent
          opacity={0.2}
        />
      )}

      {/* Trail effect */}
      {showTrail && trailPoints.length > 1 && (
        <Line
          points={trailPoints}
          vertexColors={trailColors}
          lineWidth={2}
          transparent
          opacity={0.9}
        />
      )}

      {/* Satellite */}
      <group ref={satelliteRef} onClick={onClick}>
        {/* Main body */}
        <mesh castShadow={false}>
          <boxGeometry args={[size, size * 0.5, size * 0.5]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.3} 
            roughness={0.4} 
            emissive={color} 
            emissiveIntensity={selected ? 1 : 0.5} 
          />
        </mesh>

        {/* Solar panels */}
        <mesh position={[size * 1.2, 0, 0]} castShadow={false}>
          <boxGeometry args={[size * 1.2, size * 0.05, size * 0.6]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            metalness={0.4} 
            roughness={0.3} 
            emissive="#3b82f6" 
            emissiveIntensity={0.3} 
          />
        </mesh>
        <mesh position={[-size * 1.2, 0, 0]} castShadow={false}>
          <boxGeometry args={[size * 1.2, size * 0.05, size * 0.6]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            metalness={0.4} 
            roughness={0.3} 
            emissive="#3b82f6" 
            emissiveIntensity={0.3} 
          />
        </mesh>

        {/* Antenna */}
        <mesh position={[0, size * 0.4, 0]} castShadow={false}>
          <cylinderGeometry args={[size * 0.04, size * 0.04, size * 0.25]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Selection ring */}
        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size * 2.5, size * 2.8, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Clickable hitbox */}
        {onClick && (
          <mesh visible={false}>
            <sphereGeometry args={[size * 3, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}

        {/* Optional glow */}
        {showGlow && <pointLight color={color} intensity={selected ? 2 : 1} distance={1.5} />}
      </group>
    </group>
  );
};

export default TLESatellite;
