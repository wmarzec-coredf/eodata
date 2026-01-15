import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

interface GroundStation {
  name: string;
  lat: number;
  lng: number;
}

interface GroundLinksProps {
  visible: boolean;
  groundStations: GroundStation[];
  time: number;
}

// Convert lat/lng to 3D position on Earth surface
const latLngToPosition = (lat: number, lng: number, radius: number = 2): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};

// Generate satellite positions for linking
const getSatellitePosition = (
  orbitRadius: number,
  orbitTilt: number,
  angle: number
): THREE.Vector3 => {
  const x = Math.cos(angle) * orbitRadius;
  const z = Math.sin(angle) * orbitRadius;
  const y = z * Math.sin(orbitTilt);
  const adjustedZ = z * Math.cos(orbitTilt);
  return new THREE.Vector3(x, y, adjustedZ);
};

const GroundLinks = ({ visible, groundStations, time }: GroundLinksProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create communication links
  const links = useMemo(() => {
    if (!visible) return [];

    const linkData: {
      stationPos: THREE.Vector3;
      satellitePos: THREE.Vector3;
      color: string;
      active: boolean;
    }[] = [];

    // LEO orbit parameters
    const leoRadius = 2.8;
    const leoTilt = 0.4;

    groundStations.forEach((station, stationIndex) => {
      const stationPos = latLngToPosition(station.lat, station.lng, 2.02);
      
      // Each station connects to nearby LEO satellites
      const numConnections = 2;
      for (let i = 0; i < numConnections; i++) {
        const satelliteAngle = time * 0.8 + (stationIndex * 0.5) + (i * Math.PI * 0.3);
        const tiltOffset = stationIndex * 0.1;
        const satellitePos = getSatellitePosition(leoRadius, leoTilt + tiltOffset, satelliteAngle);
        
        // Check if satellite is "visible" from ground station (simple visibility check)
        const distance = stationPos.distanceTo(satellitePos);
        const isVisible = distance < 4; // Simplified visibility threshold
        
        if (isVisible) {
          linkData.push({
            stationPos,
            satellitePos,
            color: "#00d4ff",
            active: Math.sin(time * 2 + stationIndex + i) > 0,
          });
        }
      }
    });

    return linkData;
  }, [visible, groundStations, time]);

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {links.map((link, index) => {
        if (!link.active) return null;

        // Create curved path for the communication beam
        const midPoint = new THREE.Vector3()
          .addVectors(link.stationPos, link.satellitePos)
          .multiplyScalar(0.5);
        midPoint.multiplyScalar(1.15); // Push midpoint outward for curve

        const curve = new THREE.QuadraticBezierCurve3(
          link.stationPos,
          midPoint,
          link.satellitePos
        );
        const points = curve.getPoints(20);
        const linePoints: [number, number, number][] = points.map((p) => [p.x, p.y, p.z]);

        // Calculate data packet position along the beam
        const packetProgress = ((time * 3 + index * 0.5) % 1);
        const packetPos = curve.getPoint(packetProgress);

        return (
          <group key={index}>
            {/* Communication beam line */}
            <Line
              points={linePoints}
              color={link.color}
              lineWidth={1}
              transparent
              opacity={0.4}
              dashed
              dashSize={0.05}
              gapSize={0.03}
            />

            {/* Data packet traveling along the beam */}
            <mesh position={[packetPos.x, packetPos.y, packetPos.z]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshBasicMaterial
                color="#00ffff"
                transparent
                opacity={0.9}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Glow at satellite end */}
            <mesh position={[link.satellitePos.x, link.satellitePos.y, link.satellitePos.z]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial
                color="#00d4ff"
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export default GroundLinks;
