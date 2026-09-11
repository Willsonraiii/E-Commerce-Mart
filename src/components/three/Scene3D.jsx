import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, ContactShadows, RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'

/* A floating grocery photo panel */
function PhotoTile({ url, position, rotation = [0, 0, 0], scale = 1, tint = '#ffffff' }) {
  const tex = useTexture(url)
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.z = Math.sin(t * 0.35 + position[0]) * 0.05
  })
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox ref={ref} args={[1.5, 1.85, 0.09]} radius={0.09} smoothness={5} castShadow receiveShadow>
        <meshPhysicalMaterial color="#fffdf8" roughness={0.42} metalness={0.02} clearcoat={0.5} clearcoatRoughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0.12, 0.052]}>
        <planeGeometry args={[1.24, 1.24]} />
        <meshBasicMaterial map={tex} toneMapped={false} color={tint} />
      </mesh>
      <mesh position={[0, -0.66, 0.052]}>
        <planeGeometry args={[1.24, 0.16]} />
        <meshBasicMaterial color="#2f6b47" transparent opacity={0.14} />
      </mesh>
    </group>
  )
}

function Produce({ position, color, radius = 0.42, speed = 1 }) {
  const ref = useRef()
  useFrame((s) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime * speed
    ref.current.rotation.y = t * 0.5
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.25
  })
  return (
    <mesh ref={ref} position={position} castShadow>
      <icosahedronGeometry args={[radius, 3]} />
      <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.25} sheen={0.5} sheenColor="#ffffff" />
    </mesh>
  )
}

/* A stylised paper grocery bag */
function GroceryBag({ position = [0, 0, 0], scale = 1 }) {
  const g = useRef()
  useFrame((s) => {
    if (g.current) g.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.32) * 0.4
  })
  return (
    <group ref={g} position={position} scale={scale}>
      <RoundedBox args={[1.35, 1.5, 0.95]} radius={0.06} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#c9a882" roughness={0.85} sheen={0.4} sheenColor="#e8d6b8" />
      </RoundedBox>
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[1.38, 0.09, 0.98]} />
        <meshStandardMaterial color="#b08f68" roughness={0.9} />
      </mesh>
      <Produce position={[-0.3, 1.05, 0.1]} color="#d4452f" radius={0.26} speed={0.8} />
      <Produce position={[0.22, 1.16, -0.1]} color="#3d8a58" radius={0.3} speed={1.1} />
      <Produce position={[0.38, 0.95, 0.24]} color="#E8A317" radius={0.22} speed={1.4} />
      <mesh position={[0, 0.15, 0.48]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.62, 0.4]} />
        <meshBasicMaterial color="#2f6b47" transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

function Rig({ reduced }) {
  useFrame((state) => {
    if (reduced) return
    const { pointer, camera } = state
    camera.position.x += (pointer.x * 1.5 - camera.position.x) * 0.035
    camera.position.y += (-pointer.y * 0.8 + 0.6 - camera.position.y) * 0.035
    camera.lookAt(0, 0.1, 0)
  })
  return null
}

const TILES = [
  { url: '/images/wai-wai.jpg', position: [-2.25, 0.5, -0.3], rotation: [0, 0.42, -0.06], scale: 0.82 },
  { url: '/images/milk.jpg', position: [2.2, 0.78, -0.45], rotation: [0, -0.4, 0.05], scale: 0.78 },
  { url: '/images/bread.jpg', position: [-1.6, -1.15, 0.6], rotation: [0, 0.3, 0.08], scale: 0.66 },
  { url: '/images/tomato.jpg', position: [1.7, -1.2, 0.65], rotation: [0, -0.28, -0.07], scale: 0.64 },
]

export default function Scene3D({ mobile = false, reduced = false }) {
  const dpr = useMemo(() => (mobile ? [1, 1.4] : [1, 1.9]), [mobile])

  return (
    <Canvas
      dpr={dpr}
      shadows
      camera={{ position: [0, 0.6, 7.2], fov: mobile ? 54 : 46 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        gl.setClearAlpha(0)
      }}
      frameloop={reduced ? 'demand' : 'always'}
    >
      {/* No `background` attach — the canvas stays transparent over the cream page. */}
      <fog attach="fog" args={['#f4efe6', 12, 26]} />

      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 6, 4]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.1, 24]} />
      </directionalLight>
      <pointLight position={[-5, 2, -3]} intensity={38} color="#4fd18b" distance={16} />
      <pointLight position={[5, -1, 3]} intensity={26} color="#f0b429" distance={14} />

      <Suspense fallback={null}>
        <Float speed={1.4} rotationIntensity={0.24} floatIntensity={0.7}>
          <GroceryBag position={[0, -0.35, 0]} scale={mobile ? 0.82 : 1} />
        </Float>

        {TILES.slice(0, mobile ? 2 : 4).map((t) => (
          <Float key={t.url} speed={1.1} rotationIntensity={0.3} floatIntensity={1.1}>
            <PhotoTile {...t} />
          </Float>
        ))}

        <ContactShadows position={[0, -1.85, 0]} opacity={0.34} scale={12} blur={2.8} far={4.5} color="#143528" />
        <Environment preset="park" />
      </Suspense>

      <Rig reduced={reduced} />
    </Canvas>
  )
}
