import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import Earth from "./Earth";
import Satellite from "./Satellite";
import TLESatellite from "./TLESatellite";
import Sun from "./Sun";
import GroundLinks from "./GroundLinks";
import { SatelliteInfo } from "./SatelliteInfoPopup";
import { sampleTLEs, parseTLE, getSatellitePosition, getOrbitType, getOrbitColor } from "@/lib/tle-service";
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
  showSatelliteGlow: boolean;
  useTLEData: boolean;
  simulationSpeed: number;
  isPaused: boolean;
  simulationTime: number;
  onTimeUpdate: (delta: number) => void;
  onSatelliteClick: (satellite: SatelliteInfo) => void;
  selectedSatelliteId?: string | null;
}

const SUN_POSITION: [number, number, number] = [25, 10, -15];

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
  showSatelliteGlow,
  useTLEData,
  simulationSpeed,
  isPaused,
  simulationTime,
  onTimeUpdate,
  onSatelliteClick,
  selectedSatelliteId,
}: SceneProps) => {
  const baseTime = useMemo(() => new Date(), []);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      onTimeUpdate(0.016 * simulationSpeed);
    }, 16);
    return () => clearInterval(interval);
  }, [simulationSpeed, isPaused, onTimeUpdate]);

  // Filter TLE satellites by orbit type
  const filteredTLEs = useMemo(() => {
    return sampleTLEs.filter((tle) => {
      const satrec = parseTLE(tle);
      if (!satrec) return false;
      
      const pos = getSatellitePosition(satrec, baseTime);
      if (!pos) return false;
      
      const orbitType = getOrbitType(pos.altitude);
      if (orbitType === "LEO" && !showLEO) return false;
      if (orbitType === "MEO" && !showMEO) return false;
      if (orbitType === "GEO" && !showGEO) return false;
      
      return true;
    });
  }, [showLEO, showMEO, showGEO, baseTime]);

  // Legacy orbit configs for non-TLE mode
  const orbitConfigs: OrbitConfig[] = [
    { name: "LEO", color: "#4ade80", radius: 2.8, satellites: 8, speed: 0.8, tilt: 0.4, altitude: 550, inclination: 53 },
    { name: "MEO", color: "#facc15", radius: 4, satellites: 4, speed: 0.4, tilt: 0.2, altitude: 20200, inclination: 55 },
    { name: "GEO", color: "#f97316", radius: 5.5, satellites: 3, speed: 0.1, tilt: 0, altitude: 35786, inclination: 0 },
  ];

  const visibleOrbits = orbitConfigs.filter((orbit) => {
    if (orbit.name === "LEO") return showLEO;
    if (orbit.name === "MEO") return showMEO;
    if (orbit.name === "GEO") return showGEO;
    return true;
  });

  const handleTLESatelliteClick = useCallback((tle: typeof sampleTLEs[0]) => {
    const satrec = parseTLE(tle);
    if (!satrec) return;
    
    const pos = getSatellitePosition(satrec, new Date(baseTime.getTime() + simulationTime * 1000));
    if (!pos) return;
    
    const orbitType = getOrbitType(pos.altitude);
    
    onSatelliteClick({
      id: tle.name,
      name: tle.name,
      orbitType,
      altitude: Math.round(pos.altitude),
      inclination: 0, // Could calculate from TLE
      color: getOrbitColor(orbitType),
    });
  }, [baseTime, simulationTime, onSatelliteClick]);

  const handleLegacySatelliteClick = useCallback((orbitName: string, index: number, orbit: OrbitConfig) => {
    onSatelliteClick({
      id: `${orbitName}-${index}`,
      name: `${orbitName}-${index + 1}`,
      orbitType: orbitName as "LEO" | "MEO" | "GEO",
      altitude: orbit.altitude,
      inclination: orbit.inclination,
      color: orbit.color,
    });
  }, [onSatelliteClick]);

  // Calculate directional light direction from sun
  const sunLightDirection = useMemo(() => {
    return new THREE.Vector3(...SUN_POSITION).normalize();
  }, []);

  return (
    <>
      {/* Ambient light - reduced when sun is on */}
      <ambientLight intensity={showSun ? 0.15 : 0.3} />
      
      {/* Main directional light from sun position - illuminates Earth */}
      {showSun && (
        <directionalLight
          position={SUN_POSITION}
          intensity={2}
          color="#fff5e6"
          castShadow={false}
        />
      )}
      
      {/* Fallback directional light when sun is off */}
      {!showSun && (
        <directionalLight position={[10, 5, 5]} intensity={1.2} castShadow={false} />
      )}
      
      {/* Fill light from opposite side */}
      <directionalLight 
        position={[-15, -5, 10]} 
        intensity={showSun ? 0.1 : 0.3} 
        color="#4da6ff"
        castShadow={false}
      />

      {/* Sun */}
      <Sun visible={showSun} position={SUN_POSITION} />

      {/* Stars background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Earth with ground stations */}
      <Earth 
        showGroundStations={showGroundStations} 
        groundStations={groundStations}
        showDayNight={showSun}
        sunPosition={SUN_POSITION}
      />

      {/* TLE-based satellites */}
      {useTLEData && filteredTLEs.map((tle) => (
        <TLESatellite
          key={tle.name}
          tle={tle}
          simulationTime={simulationTime}
          baseTime={baseTime}
          onClick={() => handleTLESatelliteClick(tle)}
          showTrail={showTrails}
          showOrbit={showOrbits}
          showGlow={showSatelliteGlow}
          selected={selectedSatelliteId === tle.name}
        />
      ))}

      {/* Legacy satellites (when TLE mode is off) */}
      {!useTLEData && visibleOrbits.map((orbit) =>
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
            onClick={() => handleLegacySatelliteClick(orbit.name, index, orbit)}
            showTrail={showTrails}
            showOrbit={showOrbits}
            showGlow={showSatelliteGlow}
          />
        ))
      )}

      {/* Data transfer visualization */}
      {showDataTransfer && !useTLEData && visibleOrbits.length > 1 && (
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
          <mesh key={i} position={[posX, posY, posZ]} castShadow={false}>
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
      shadows={false}
    >
      <Suspense fallback={<LoadingFallback />}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
};

export default Scene;

export { groundStations };
