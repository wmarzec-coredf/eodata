import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SunProps {
  visible: boolean;
  position?: [number, number, number];
}

const Sun = ({ visible, position = [25, 10, -15] }: SunProps) => {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sunRef.current) {
      // Subtle pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      sunRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      // Glow pulsing
      const glowScale = 1.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  if (!visible) return null;

  return (
    <group position={position}>
      {/* Sun core */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#fcd34d" />
      </mesh>

      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Corona effect */}
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial
          color="#fef3c7"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sun point light for nearby effects */}
      <pointLight color="#fcd34d" intensity={3} distance={50} decay={1} />
    </group>
  );
};

export default Sun;
