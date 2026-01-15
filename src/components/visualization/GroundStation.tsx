import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GroundStationProps {
  lat: number;
  lng: number;
  earthRadius?: number;
  color?: string;
  name?: string;
}

const GroundStation = ({
  lat,
  lng,
  earthRadius = 2,
  color = "#00ff88",
}: GroundStationProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);

  // Convert lat/lng to 3D position
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -earthRadius * Math.sin(phi) * Math.cos(theta);
  const y = earthRadius * Math.cos(phi);
  const z = earthRadius * Math.sin(phi) * Math.sin(theta);

  useFrame((_, delta) => {
    pulseRef.current += delta * 2;
    
    if (beamRef.current) {
      const scale = 1 + Math.sin(pulseRef.current) * 0.3;
      beamRef.current.scale.y = scale;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity = 
        0.3 + Math.sin(pulseRef.current) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {/* Station base */}
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Signal beam */}
      <mesh ref={beamRef} position={[0, 0.15, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.08, 0.3, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Point light */}
      <pointLight color={color} intensity={0.3} distance={0.5} />
    </group>
  );
};

export default GroundStation;
