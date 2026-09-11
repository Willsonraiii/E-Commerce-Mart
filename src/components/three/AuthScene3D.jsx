import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, ContactShadows, RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * A single product card in the rotating shelf ring.
 * Each card counter-rotates so its face always reads to the camera.
 * ------------------------------------------------------------------ */
function ShelfCard({ url, angle, radius, ringRef }) {
  const tex = useTexture(url)
  const ref = useRef()

  useFrame((state) => {
    if (!ref.current || !ringRef.current) return
    // Billboard: cancel the parent ring's spin exactly so every card's
    // world rotation stays 0 and the artwork always faces the camera.
    const spin = ringRef.current.rotation.y
    ref.current.rotation.y = -spin
    const t = state.clock.elapsedTime
    ref.current.position.y = Math.sin(t * 0.8 + angle * 2) * 0.06
    // Fade + shrink cards as they swing behind the bag.
    const depth = Math.cos(spin + angle) // +1 near camera, -1 far
    const k = 0.78 + (depth + 1) * 0.14
    ref.current.scale.setScalar(k)
  })

  return (
    <group position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}>
      <group ref={ref}>
        <RoundedBox args={[1.02, 1.26, 0.075]} radius={0.07} smoothness={4} castShadow>
          <meshPhysicalMaterial
            color="#fffdf8" roughness={0.4} metalness={0.02}
            clearcoat={0.55} clearcoatRoughness={0.3}
          />
        </RoundedBox>
        <mesh position={[0, 0.09, 0.043]}>
          <planeGeometry args={[0.84, 0.84]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.45, 0.043]}>
          <planeGeometry args={[0.84, 0.11]} />
          <meshBasicMaterial color="#2f6b47" transparent opacity={0.16} />
        </mesh>
      </group>
    </group>
  )
}

function Produce({ position, color, radius = 0.2, speed = 1 }) {
  const ref = useRef()
  useFrame((s) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime * speed
    ref.current.rotation.y = t * 0.6
    ref.current.rotation.x = Math.sin(t * 0.5) * 0.3
  })
  return (
    <mesh ref={ref} position={position} castShadow>
      <icosahedronGeometry args={[radius, 3]} />
      <meshPhysicalMaterial
        color={color} roughness={0.3} clearcoat={0.7}
        clearcoatRoughness={0.25} sheen={0.5} sheenColor="#ffffff"
      />
    </mesh>
  )
}

/* The paper bag at the centre of the ring. */
function CentreBag() {
  const g = useRef()
  useFrame((s) => {
    if (g.current) g.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.28) * 0.35
  })
  return (
    <group ref={g} position={[0, -0.15, 0]} scale={0.82}>
      <RoundedBox args={[1.2, 1.34, 0.85]} radius={0.055} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#c9a882" roughness={0.85} sheen={0.4} sheenColor="#e8d6b8" />
      </RoundedBox>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.23, 0.08, 0.88]} />
        <meshStandardMaterial color="#b08f68" roughness={0.9} />
      </mesh>
      <Produce position={[-0.27, 0.94, 0.09]} color="#d4452f" radius={0.23} speed={0.8} />
      <Produce position={[0.2, 1.04, -0.09]} color="#3d8a58" radius={0.27} speed={1.1} />
      <Produce position={[0.34, 0.85, 0.21]} color="#E8A317" radius={0.19} speed={1.4} />
    </group>
  )
}

const CARDS = [
  '/images/wai-wai.jpg',
  '/images/milk.jpg',
  '/images/bread.jpg',
  '/images/tomato.jpg',
  '/images/apple.jpg',
  '/images/chocolate.jpg',
]

function Ring({ reduced }) {
  const ring = useRef()
  const { viewport } = useThree()
  useFrame((s, delta) => {
    if (ring.current && !reduced) ring.current.rotation.y += delta * 0.16
  })
  // Fit the ring inside the panel: leave room for half a card (~0.55)
  // plus a margin, so nothing ever clips at the left/right edges.
  const radius = Math.min(2.1, Math.max(1.15, viewport.width / 2 - 0.72))
  return (
    <group ref={ring}>
      {CARDS.map((url, i) => (
        <ShelfCard
          key={url}
          url={url}
          angle={(i / CARDS.length) * Math.PI * 2}
          radius={radius}
          ringRef={ring}
        />
      ))}
    </group>
  )
}

// Warm the texture cache so no card ever renders blank on first paint.
CARDS.forEach((u) => useTexture.preload(u))

export default function AuthScene3D({ reduced = false }) {
  const dpr = useMemo(() => [1, 1.6], [])

  return (
    <Canvas
      dpr={dpr}
      shadows
      camera={{ position: [0, 1.05, 6.6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.15
        gl.setClearAlpha(0)
        camera.lookAt(0, -0.08, 0)
      }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 4]} intensity={1.5} castShadow
        shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#4fd18b" />
      <pointLight position={[0, 1.2, 2.4]} intensity={18} color="#f3e3b5" distance={9} />

      <Suspense fallback={null}>
        <Float speed={reduced ? 0 : 1.4} rotationIntensity={0.16} floatIntensity={0.42}>
          <group position={[0, 0.15, 0]}>
            <CentreBag />
            <Ring reduced={reduced} />
          </group>
        </Float>
        <ContactShadows position={[0, -1.62, 0]} opacity={0.42} scale={11} blur={2.6} far={4.5} color="#04150d" />
      </Suspense>
    </Canvas>
  )
}
