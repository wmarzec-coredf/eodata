import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

const Earth = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Create Earth texture procedurally
  const earthMaterial = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Ocean gradient
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 256);
    oceanGradient.addColorStop(0, "#1a365d");
    oceanGradient.addColorStop(0.5, "#2563eb");
    oceanGradient.addColorStop(1, "#1e40af");
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 512, 256);

    // Add land masses (simplified continents)
    ctx.fillStyle = "#166534";
    
    // North America
    ctx.beginPath();
    ctx.ellipse(100, 60, 50, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(130, 150, 25, 40, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe/Africa
    ctx.beginPath();
    ctx.ellipse(270, 80, 30, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(280, 140, 35, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(380, 70, 60, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(430, 160, 25, 20, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
    });
  }, []);

  // Create cloud texture
  const cloudMaterial = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, 512, 256);

    // Add cloud patches
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
  }, []);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.07;
    }
  });

  return (
    <group>
      {/* Earth */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <primitive object={earthMaterial} attach="material" />
      </Sphere>

      {/* Clouds layer */}
      <Sphere ref={cloudsRef} args={[2.02, 64, 64]}>
        <primitive object={cloudMaterial} attach="material" />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere ref={atmosphereRef} args={[2.15, 64, 64]}>
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

export default Earth;
