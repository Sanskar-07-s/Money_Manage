import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function MousePointer3D() {
  const pointerRef = useRef();

  useFrame((state) => {
    if (pointerRef.current) {
      // Smoothly interpolate position towards actual mouse (which is in normalized device coordinates -1 to +1)
      const targetX = state.pointer.x * 5; // Scale to scene width roughly
      const targetY = state.pointer.y * 3; // Scale to scene height roughly
      
      pointerRef.current.position.x += (targetX - pointerRef.current.position.x) * 0.1;
      pointerRef.current.position.y += (targetY - pointerRef.current.position.y) * 0.1;
      
      // Add slight bobbing
      pointerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      pointerRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <mesh ref={pointerRef} position={[0, 0, 2]} castShadow>
      <octahedronGeometry args={[0.2, 0]} />
      <meshPhysicalMaterial 
        color="#0ea5e9"
        emissive="#0ea5e9"
        emissiveIntensity={0.5}
        roughness={0.1}
        metalness={0.8}
        transmission={0.5} // glass-like
        thickness={0.5}
      />
    </mesh>
  );
}
