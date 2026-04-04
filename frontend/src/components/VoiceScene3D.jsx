import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, OrbitControls, RoundedBox, Sphere, Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function WaveBars({ isListening }) {
  const groupRef = useRef(null);
  const bars = useMemo(() => new Array(14).fill(0), []);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.children.forEach((child, index) => {
      const height = isListening
        ? 0.7 + Math.sin(state.clock.elapsedTime * 5 + index * 0.4) * 0.9
        : 0.2 + Math.sin(state.clock.elapsedTime * 1.5 + index * 0.4) * 0.08;
      child.scale.y = Math.max(0.15, height);
      child.position.y = child.scale.y / 2 - 1.2;
    });
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {bars.map((_, index) => (
        <mesh key={index} position={[-2.1 + index * 0.32, -0.8, 0]}>
          <boxGeometry args={[0.16, 1, 0.16]} />
          <meshStandardMaterial color={isListening ? '#22c55e' : '#64748b'} emissive={isListening ? '#10b981' : '#0f172a'} emissiveIntensity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingBubbles({ messageCount, isListening, transcriptPreview }) {
  const bubbleRefs = useRef([]);

  useFrame((state) => {
    bubbleRefs.current.forEach((mesh, index) => {
      if (!mesh) {
        return;
      }
      mesh.position.y = Math.sin(state.clock.elapsedTime * 1.2 + index) * 0.2 + (index % 3) * 0.6 - 0.3;
      mesh.rotation.x += 0.002;
      mesh.rotation.y += 0.003;
    });
  });

  return (
    <group>
      {new Array(6).fill(0).map((_, index) => (
        <Float key={index} speed={1.3 + index * 0.2} rotationIntensity={0.5} floatIntensity={1.1}>
          <Sphere
            ref={(node) => {
              bubbleRefs.current[index] = node;
            }}
            args={[0.24 + (index % 3) * 0.06, 32, 32]}
            position={[
              -2.1 + index * 0.9,
              (index % 2 === 0 ? 1 : -0.1) + index * 0.05,
              -0.6 + (index % 3) * 0.3,
            ]}
          >
            <MeshDistortMaterial
              color={isListening ? '#38bdf8' : '#8b5cf6'}
              emissive={isListening ? '#0ea5e9' : '#7c3aed'}
              emissiveIntensity={0.65}
              speed={1.5}
              distort={0.28}
              roughness={0.15}
            />
          </Sphere>
        </Float>
      ))}

      <RoundedBox args={[2.9, 0.9, 0.25]} radius={0.18} position={[0, 1.9, -0.8]}>
        <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
      </RoundedBox>
      <Text
        position={[0, 1.93, -0.62]}
        fontSize={0.15}
        color="#0f172a"
        anchorX="center"
        maxWidth={2.4}
      >
        {isListening ? 'AI is listening...' : transcriptPreview || `3D chat ready • ${messageCount} bubbles`}
      </Text>
    </group>
  );
}

function MouseTrail() {
  const ref = useRef(null);
  const pointer = new THREE.Vector3();

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    pointer.set(state.pointer.x * 2.4, state.pointer.y * 1.4, 0);
    ref.current.position.lerp(pointer, 0.08);
    ref.current.rotation.y += 0.03;
  });

  return (
    <group ref={ref} position={[0, 0, 0.4]}>
      <Sphere args={[0.12, 24, 24]}>
        <meshStandardMaterial color="#f8fafc" emissive="#38bdf8" emissiveIntensity={0.6} />
      </Sphere>
      <mesh position={[0.18, 0.05, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.18, 0.05, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, -0.13, 0.06]}>
        <boxGeometry args={[0.16, 0.04, 0.04]} />
        <meshStandardMaterial color="#f472b6" />
      </mesh>
    </group>
  );
}

export default function VoiceScene3D({ isListening, messageCount, transcriptPreview }) {
  return (
    <div className="h-[250px] w-full overflow-hidden rounded-[2rem] border border-white/30 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_rgba(15,23,42,0.85))] shadow-premium">
      <Canvas camera={{ position: [0, 0, 6], fov: 48 }}>
        <color attach="background" args={['#07111f']} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 3, 2]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-2, 0.5, 1]} intensity={1.4} color="#38bdf8" />
        <pointLight position={[2, -1, 2]} intensity={1.2} color="#8b5cf6" />
        <Environment preset="city" />
        <FloatingBubbles isListening={isListening} messageCount={messageCount} transcriptPreview={transcriptPreview} />
        <WaveBars isListening={isListening} />
        <MouseTrail />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
}
