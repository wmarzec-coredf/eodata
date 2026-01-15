import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

interface GroundStationData {
  name: string;
  lat: number;
  lng: number;
}

interface EarthProps {
  showGroundStations?: boolean;
  groundStations?: GroundStationData[];
}

const Earth = ({ showGroundStations = false, groundStations = [] }: EarthProps) => {
  const earthGroupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const [textures, setTextures] = useState<{
    earth: THREE.Texture | null;
    bump: THREE.Texture | null;
    clouds: THREE.Texture | null;
  }>({
    earth: null,
    bump: null,
    clouds: null,
  });

  // Load textures
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    const earthUrl = "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg";
    const bumpUrl = "https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png";
    const cloudsUrl = "https://unpkg.com/three-globe@2.31.0/example/img/earth-clouds.png";
    
    loader.load(earthUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      setTextures(prev => ({ ...prev, earth: texture }));
    });
    
    loader.load(bumpUrl, (texture) => {
      setTextures(prev => ({ ...prev, bump: texture }));
    });
    
    loader.load(cloudsUrl, (texture) => {
      setTextures(prev => ({ ...prev, clouds: texture }));
    });
  }, []);

  // Create fallback material
  const fallbackMaterial = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 256);
    oceanGradient.addColorStop(0, "#1a365d");
    oceanGradient.addColorStop(0.5, "#2563eb");
    oceanGradient.addColorStop(1, "#1e40af");
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = "#166534";
    ctx.beginPath(); ctx.ellipse(100, 60, 50, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(130, 150, 25, 40, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(270, 80, 30, 25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(280, 140, 35, 45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(380, 70, 60, 35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(430, 160, 25, 20, 0.2, 0, Math.PI * 2); ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
    });
  }, []);

  const earthMaterial = useMemo(() => {
    if (!textures.earth) return fallbackMaterial;

    return new THREE.MeshPhongMaterial({
      map: textures.earth,
      bumpMap: textures.bump || undefined,
      bumpScale: 0.05,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    });
  }, [textures.earth, textures.bump, fallbackMaterial]);

  const cloudMaterial = useMemo(() => {
    if (!textures.clouds) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const radius = Math.random() * 30 + 10;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      return new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      });
    }

    return new THREE.MeshStandardMaterial({
      map: textures.clouds,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [textures.clouds]);

  // Convert lat/lng to 3D position
  const latLngToPosition = (lat: number, lng: number, radius: number = 2): [number, number, number] => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
  };

  useFrame((_, delta) => {
    // Rotate the entire Earth group (Earth + ground stations together)
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.05;
    }
    // Clouds rotate slightly faster
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Earth and ground stations rotate together */}
      <group ref={earthGroupRef}>
        {/* Earth */}
        <Sphere args={[2, 64, 64]}>
          <primitive object={earthMaterial} attach="material" />
        </Sphere>

        {/* Ground Stations - now inside the rotating group */}
        {showGroundStations &&
          groundStations.map((station) => {
            const position = latLngToPosition(station.lat, station.lng, 2.02);
            return (
              <group key={station.name} position={position}>
                {/* Station marker */}
                <mesh>
                  <sphereGeometry args={[0.04, 16, 16]} />
                  <meshStandardMaterial 
                    color="#00d4ff" 
                    emissive="#00d4ff" 
                    emissiveIntensity={0.5} 
                  />
                </mesh>
                {/* Glow effect */}
                <pointLight color="#00d4ff" intensity={0.3} distance={0.5} />
              </group>
            );
          })}
      </group>

      {/* Clouds layer - separate rotation */}
      <Sphere ref={cloudsRef} args={[2.02, 64, 64]}>
        <primitive object={cloudMaterial} attach="material" />
      </Sphere>

      {/* Atmosphere glow - doesn't rotate */}
      <Sphere args={[2.08, 64, 64]}>
        <meshBasicMaterial
          color="#4da6ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      <Sphere args={[2.2, 64, 64]}>
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

export default Earth;
