import { Suspense, useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import Earth from "./Earth";
import Satellite from "./Satellite";
import Sun from "./Sun";
import GroundLinks from "./GroundLinks";
import { SatelliteInfo } from "./SatelliteInfoPopup";
import * as THREE from "three";

interface OrbitConfig {
  name: string;
  color: string;
  radius: number;
  satellites: number;
  speed: number;
  tilt: number;
  altitude: number;
  inclination: number;
}

const orbitConfigs: OrbitConfig[] = [
  { name: "LEO", color: "#4ade80", radius: 2.8, satellites: 8, speed: 0.8, tilt: 0.4, altitude: 550, inclination: 53 },
  { name: "MEO", color: "#facc15", radius: 4, satellites: 4, speed: 0.4, tilt: 0.2, altitude: 20200, inclination: 55 },
  { name: "GEO", color: "#f97316", radius: 5.5, satellites: 3, speed: 0.1, tilt: 0, altitude: 35786, inclination: 0 },
];

const groundStations = [
  { name: "Darmstadt (ESOC)", lat: 49.87, lng: 8.63 },
  { name: "Kourou", lat: 5.16, lng: -52.65 },
  { name: "Perth", lat: -31.95, lng: 115.86 },
  { name: "Kiruna", lat: 67.86, lng: 20.22 },
  { name: "Maspalomas", lat: 27.76, lng: -15.58 },
  { name: "Redu", lat: 50.0, lng: 5.15 },
];

const LoadingFallback = () => (
  <Html center>
    <div className="text-primary animate-pulse">Loading 3D Scene...</div>
  </Html>
);

interface SceneProps {
  showLEO: boolean;
  showMEO: boolean;
  showGEO: boolean;
  showGroundStations: boolean;
  showDataTransfer: boolean;
  showGroundLinks: boolean;
  showTrails: boolean;
  showOrbits: boolean;
  showSun: boolean;
  simulationSpeed: number;
  isPaused: boolean;
  simulationTime: number;
  onTimeUpdate: (delta: number) => void;
  onSatelliteClick: (satellite: SatelliteInfo) => void;
}

const SceneContent = ({
  showLEO,
  showMEO,
  showGEO,
  showGroundStations,
  showDataTransfer,
  showGroundLinks,
  showTrails,
  showOrbits,
  showSun,
  simulationSpeed,
  isPaused,
  simulationTime,
  onTimeUpdate,
  onSatelliteClick,
}: SceneProps) => {
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      onTimeUpdate(0.016 * simulationSpeed);
    }, 16);
    return () => clearInterval(interval);
  }, [simulationSpeed, isPaused, onTimeUpdate]);

  const visibleOrbits = orbitConfigs.filter((orbit) => {
    if (orbit.name === "LEO") return showLEO;
    if (orbit.name === "MEO") return showMEO;
    if (orbit.name === "GEO") return showGEO;
    return true;
  });

  const handleSatelliteClick = useCallback((orbitName: string, index: number, orbit: OrbitConfig) => {
    onSatelliteClick({
      id: `${orbitName}-${index}`,
      name: `${orbitName}-${index + 1}`,
      orbitType: orbitName as "LEO" | "MEO" | "GEO",
      altitude: orbit.altitude,
      inclination: orbit.inclination,
      color: orbit.color,
    });
  }, [onSatelliteClick]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={showSun ? 0.1 : 0.2} />
      <directionalLight position={[10, 5, 5]} intensity={showSun ? 0.8 : 1.5} castShadow />
      <pointLight position={[-10, -5, -5]} intensity={0.3} color="#60a5fa" />

      {/* Sun */}
      <Sun visible={showSun} />

      {/* Stars background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Earth with ground stations */}
      <Earth 
        showGroundStations={showGroundStations} 
        groundStations={groundStations}
        showDayNight={showSun}
        sunPosition={[25, 10, -15]}
      />

      {/* Satellites by orbit */}
      {visibleOrbits.map((orbit) =>
        Array.from({ length: orbit.satellites }).map((_, index) => (
          <Satellite
            key={`${orbit.name}-${index}`}
            orbitRadius={orbit.radius}
            orbitSpeed={orbit.speed}
            orbitTilt={orbit.tilt + (index * 0.1)}
            orbitOffset={(index / orbit.satellites) * Math.PI * 2}
            color={orbit.color}
            size={orbit.name === "GEO" ? 0.12 : 0.08}
            label={`${orbit.name}-${index + 1}`}
            onClick={() => handleSatelliteClick(orbit.name, index, orbit)}
            showTrail={showTrails}
            showOrbit={showOrbits}
          />
        ))
      )}

      {/* Data transfer visualization */}
      {showDataTransfer && visibleOrbits.length > 1 && (
        <DataTransferBeams time={simulationTime} orbits={visibleOrbits} />
      )}

      {/* Ground station to satellite communication links */}
      <GroundLinks
        visible={showGroundLinks && showGroundStations}
        groundStations={groundStations}
        time={simulationTime}
      />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
};

// Animated data transfer beams
const DataTransferBeams = ({ time, orbits }: { time: number; orbits: OrbitConfig[] }) => {
  const beamCount = 5;
  
  return (
    <>
      {Array.from({ length: beamCount }).map((_, i) => {
        const progress = ((time * 0.5 + i * 0.2) % 1);
        const fromOrbit = orbits[0];
        const toOrbit = orbits[orbits.length > 1 ? 1 : 0];
        
        const angle = (i / beamCount) * Math.PI * 2 + time * 0.3;
        
        const startX = Math.cos(angle) * fromOrbit.radius;
        const startZ = Math.sin(angle) * fromOrbit.radius;
        const startY = startZ * Math.sin(fromOrbit.tilt);
        
        const endX = Math.cos(angle + 0.5) * toOrbit.radius;
        const endZ = Math.sin(angle + 0.5) * toOrbit.radius;
        const endY = endZ * Math.sin(toOrbit.tilt);
        
        const posX = startX + (endX - startX) * progress;
        const posY = startY + (endY - startY) * progress;
        const posZ = startZ * Math.cos(fromOrbit.tilt) + 
          ((endZ * Math.cos(toOrbit.tilt)) - (startZ * Math.cos(fromOrbit.tilt))) * progress;
        
        return (
          <mesh key={i} position={[posX, posY, posZ]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial
              color="#00d4ff"
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </>
  );
};

const Scene = (props: SceneProps) => {
  return (
    <Canvas
      camera={{ position: [8, 4, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
};

export default Scene;
