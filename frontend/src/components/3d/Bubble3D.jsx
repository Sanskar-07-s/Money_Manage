import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Sparkles, User } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Bubble3D({ message, isAi, index, total, isTyping }) {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);

  // Position logic: stagger them upwards based on index
  // Assuming camera is fixed and we just map recent messages near origin
  // index is 0 for oldest, total-1 for newest
  const reverseIndex = total - 1 - index;
  const baseY = -reverseIndex * 2.5; // space them out vertically
  
  // X offset based on sender
  const baseX = isAi ? -1.5 : 1.5;

  // Float animation
  useFrame((state) => {
    if (meshRef.current) {
      if (isAi) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.05;
      }
      const targetScale = hovered ? 1.05 : 1;
      meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.15;
      meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 0.15;
      meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.15;
      meshRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime + index) * 0.05;
      meshRef.current.position.z += ((hovered ? 0.5 : 0) - meshRef.current.position.z) * 0.15;
    }
  });

  return (
    <group
      position={[baseX, baseY, 0]}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        {/* Rounded Box roughly matching the text size */}
        <boxGeometry args={[4, 1.8, 0.2]} />
        <meshPhysicalMaterial 
          color={isAi ? "#ffffff" : "#0ea5e9"}
          roughness={0.1}
          metalness={0.1}
          transmission={isAi ? 0.4 : 0} // Reduced transmission for performance
          transparent={true}
          opacity={isAi ? 0.7 : 0.9}
        />
        
        {/* Render HTML Text onto the 3D surface */}
        <Html transform position={[0, 0, 0.11]} distanceFactor={3.5} center>
          <div className={cn(
             "w-[350px] p-4 flex gap-3 text-sm font-medium",
             isAi ? "text-slate-800" : "text-white"
          )}>
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg",
              isAi ? "bg-brand text-white" : "bg-white text-brand"
            )}>
              {isAi ? <Sparkles size={14} className="animate-pulse" /> : <User size={14} />}
            </div>
            
            <div className="flex-1">
               {isTyping ? (
                  <div className="flex gap-1.5 py-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
               ) : (
                  <p className="leading-relaxed drop-shadow-sm">{message}</p>
               )}
            </div>
          </div>
        </Html>
      </mesh>
    </group>
  );
}
