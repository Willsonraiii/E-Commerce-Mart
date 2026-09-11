import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, RoundedBox, useTexture, Float } from '@react-three/drei'
import * as THREE from 'three'

/* Different mesh archetypes, matching the original catalog's `model` field */

function PackMesh({ color, texture }) {
  const tex = useTexture(texture)
  return (
    <group>
      <RoundedBox args={[1.9, 2.4, 0.35]} radius={0.09} smoothness={5} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.28} metalness={0.28} clearcoat={0.85} clearcoatRoughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.08, 0.181]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={tex} toneMapped={false} transparent />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, s * 1.28, 0]}>
          <boxGeometry args={[1.92, 0.16, 0.36]} />
          <meshStandardMaterial color={color} roughness={0.75} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}

function BottleMesh({ color, texture }) {
  const tex = useTexture(texture)
  return (
    <group>
      <mesh castShadow position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.62, 0.68, 1.85, 48]} />
        <meshPhysicalMaterial color={color} roughness={0.14} metalness={0.06} transmission={0.28} thickness={0.6} clearcoat={1} ior={1.45} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.24, 0.55, 0.6, 40]} />
        <meshPhysicalMaterial color={color} roughness={0.16} clearcoat={1} transmission={0.24} thickness={0.4} />
      </mesh>
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.24, 32]} />
        <meshStandardMaterial color="#2f6b47" roughness={0.34} metalness={0.55} />
      </mesh>
      <mesh position={[0, -0.35, 0.69]}>
        <planeGeometry args={[0.98, 0.98]} />
        <meshBasicMaterial map={tex} toneMapped={false} transparent />
      </mesh>
    </group>
  )
}

function CartonMesh({ color, texture }) {
  const tex = useTexture(texture)
  return (
    <group>
      <RoundedBox args={[1.6, 2.05, 1.05]} radius={0.05} smoothness={4} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.62} clearcoat={0.28} />
      </RoundedBox>
      <mesh position={[0, 0.1, 0.531]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial map={tex} toneMapped={false} transparent />
      </mesh>
    </group>
  )
}

function BagMesh({ color, texture }) {
  const tex = useTexture(texture)
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[1.15, 40, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.22} metalness={0.42} clearcoat={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, s * 1.16, 0]} scale={[1, 0.22, 0.5]}>
          <sphereGeometry args={[0.85, 28, 18]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0, 1.09]}>
        <planeGeometry args={[1.25, 1.25]} />
        <meshBasicMaterial map={tex} toneMapped={false} transparent />
      </mesh>
    </group>
  )
}

function SphereMesh({ color, texture }) {
  const tex = useTexture(texture)
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[1.25, 64, 48]} />
        <meshPhysicalMaterial
          color={color} roughness={0.34} clearcoat={0.85} clearcoatRoughness={0.24}
          sheen={0.7} sheenColor="#ffffff" map={tex}
        />
      </mesh>
      <mesh position={[0, 1.24, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.045, 0.06, 0.4, 12]} />
        <meshStandardMaterial color="#4a7a35" roughness={0.85} />
      </mesh>
    </group>
  )
}

function CardMesh({ texture }) {
  const tex = useTexture(texture)
  return (
    <group>
      <RoundedBox args={[2.25, 2.25, 0.16]} radius={0.12} smoothness={5} castShadow>
        <meshPhysicalMaterial color="#fffdf8" roughness={0.4} clearcoat={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, 0.086]}>
        <planeGeometry args={[1.95, 1.95]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Flat-fronted models read badly edge-on, so they rock instead of spinning.
const FLAT = ['pack', 'carton', 'card']

function Model({ model, color, texture, spin }) {
  const g = useRef()
  useFrame((s, d) => {
    if (!g.current || !spin) return
    if (FLAT.includes(model)) {
      g.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.55) * 0.62
    } else {
      g.current.rotation.y += d * 0.42
    }
  })
  const props = { color, texture }
  return (
    <group ref={g}>
      {model === 'pack' && <PackMesh {...props} />}
      {model === 'bottle' && <BottleMesh {...props} />}
      {model === 'carton' && <CartonMesh {...props} />}
      {model === 'bag' && <BagMesh {...props} />}
      {model === 'sphere' && <SphereMesh {...props} />}
      {!['pack', 'bottle', 'carton', 'bag', 'sphere'].includes(model) && <CardMesh {...props} />}
    </group>
  )
}

export default function ProductViewer3D({ product, className }) {
  const [spin, setSpin] = useState(true)
  const model = product?.model || 'card'
  const color = product?.modelColor || '#c45d2c'
  const texture = product?.image || '/images/apple.jpg'

  return (
    <div className={className} onPointerDown={() => setSpin(false)} onPointerUp={() => setSpin(true)}>
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.4, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 3]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-4, 1, -2]} intensity={22} color="#4fd18b" />
        <pointLight position={[4, -1, 3]} intensity={16} color="#f0b429" />
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.5}>
            <Model model={model} color={color} texture={texture} spin={spin} />
          </Float>
          <ContactShadows position={[0, -1.75, 0]} opacity={0.4} scale={9} blur={2.4} far={4} color="#143528" />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={3.4}
          maxDistance={8}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 1.6}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}
