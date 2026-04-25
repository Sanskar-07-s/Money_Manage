import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, PresentationControls, ScrollControls, Scroll, Html, RoundedBox } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import { Bubble3D } from './Bubble3D';
import { MousePointer3D } from './MousePointer3D';

function VoiceWaveform({ isListening }) {
  const groupRef = useRef(null);
  const bars = useMemo(() => new Array(12).fill(0), []);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.children.forEach((child, index) => {
      const targetScale = isListening
        ? 0.8 + Math.abs(Math.sin(state.clock.elapsedTime * 5 + index * 0.35)) * 2.1
        : 0.2 + Math.abs(Math.sin(state.clock.elapsedTime * 1.8 + index * 0.2)) * 0.25;
      child.scale.y = targetScale;
      child.position.y = -3.6 + targetScale * 0.22;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0.6]}>
      {bars.map((_, index) => (
        <mesh key={index} position={[-2 + index * 0.36, -3.6, 0]}>
          <boxGeometry args={[0.16, 0.7, 0.16]} />
          <meshPhysicalMaterial
            color={isListening ? '#22c55e' : '#94a3b8'}
            emissive={isListening ? '#10b981' : '#475569'}
            emissiveIntensity={0.55}
            roughness={0.18}
            metalness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function ListeningBubble({ isListening, transcriptPreview }) {
  return (
    <group position={[0, 3.2, -0.4]}>
      <RoundedBox args={[4.8, 1.1, 0.18]} radius={0.22}>
        <meshPhysicalMaterial
          color={isListening ? '#dbeafe' : '#ffffff'}
          emissive={isListening ? '#38bdf8' : '#cbd5e1'}
          emissiveIntensity={0.3}
          transmission={0.65}
          transparent
          opacity={0.92}
          roughness={0.05}
        />
      </RoundedBox>
      <Html transform position={[0, 0, 0.13]} center distanceFactor={6}>
        <div className="w-[320px] text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-600">
            {isListening ? 'Listening' : 'Voice Ready'}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-700">
            {transcriptPreview || 'Speak a transaction, note, or command'}
          </div>
        </div>
      </Html>
    </group>
  );
}

export function ChatScene({ messages, isTyping, isListening = false, transcriptPreview = '' }) {
  const total = messages.length + (isTyping ? 1 : 0);
  const pages = Math.max(1, total * 0.5);

  return (
    <div className="w-full h-full absolute inset-0 -z-10">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={['#f8fafc']} /> {/* slate-50 */}
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <Suspense fallback={null}>
          <Environment preset="city" />
          
          <PresentationControls 
            global 
            config={{ mass: 2, tension: 500 }} 
            snap={{ mass: 4, tension: 1500 }} 
            rotation={[0, 0.05, 0]} 
            polar={[-0.1, 0.1]} 
            azimuth={[-0.2, 0.2]}
          >
            {/* ScrollWrapper to manually tie scroll to R3F elements */}
            <ScrollControls pages={pages} damping={0.2} distance={2}>
               <Scroll>
                 <group position={[0, (Math.min(total, 6) * 2.5) / 2 - 2, 0]}> {/* Shift group up so latest are in view */}
                    {messages.slice(-6).map((msg, idx) => (
                      <Bubble3D 
                        key={msg.id} 
                        message={msg.text} 
                        isAi={msg.sender === 'ai'} 
                        index={messages.length > 6 ? idx : idx}
                        total={Math.min(total, 6)}
                        isTyping={false}
                      />
                    ))}
                    {isTyping && (
                      <Bubble3D
                        key="typing"
                        message=""
                        isAi={true}
                        index={Math.min(total, 6)}
                        total={Math.min(total, 6)}
                        isTyping={true}
                      />
                    )}
                 </group>
               </Scroll>
            </ScrollControls>

            <ListeningBubble isListening={isListening} transcriptPreview={transcriptPreview} />
            <VoiceWaveform isListening={isListening} />
            <MousePointer3D />
            
            {/* Soft ground reflection/shadow */}
            <ContactShadows position={[0, -5, 0]} opacity={0.4} scale={20} blur={2} far={10} />
          </PresentationControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
