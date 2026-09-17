import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

/**
 * The hero used to sit inside a card/panel — a "frame" around the 3D scene.
 * This version has none: the canvas is fully transparent (`alpha: true`,
 * no background mesh, no wrapping div with a background/border/shadow) so
 * the shopping bag, produce and tiles read as objects floating directly in
 * the page, not as content inside a box.
 */

function useCanUseWebGL() {
  const [ok, setOk] = useState(null)
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      setOk(!!gl)
    } catch {
      setOk(false)
    }
  }, [])
  return ok
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/** The shopping bag — a simple, readable silhouette built from primitives. */
function ShoppingBag({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.15, 1.3, 0.78]} />
        <meshStandardMaterial color="#c45d2c" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* folded-over top lip */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.2, 0.18, 0.82]} />
        <meshStandardMaterial color="#a84c22" roughness={0.6} />
      </mesh>
      {/* two handles */}
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.035, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#f3e3b5" roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Produce({ position, color, scale = 1, geometry = 'sphere' }) {
  return (
    <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.1}>
      <mesh position={position} scale={scale} castShadow>
        {geometry === 'sphere' ? (
          <sphereGeometry args={[0.32, 24, 24]} />
        ) : (
          <capsuleGeometry args={[0.22, 0.36, 8, 16]} />
        )}
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
    </Float>
  )
}

function PhotoTile({ position, rotation, color }) {
  return (
    <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.7}>
      <mesh position={position} rotation={rotation} castShadow>
        <boxGeometry args={[0.7, 0.9, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
    </Float>
  )
}

/** Parallaxes the whole shelf toward the pointer; drag on touch instead. */
function Rig({ children }) {
  const group = useRef()
  const target = useRef({ x: 0, y: 0 })
  const isTouch = useRef(false)

  useEffect(() => {
    isTouch.current = window.matchMedia('(hover: none), (pointer: coarse)').matches
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      target.current = { x, y }
    }
    if (!isTouch.current) window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame(() => {
    if (!group.current) return
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, target.current.x * 0.28, 0.04)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, target.current.y * -0.14, 0.04)
  })

  return <group ref={group}>{children}</group>
}

function Shelf() {
  return (
    <Rig>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.9}>
        <ShoppingBag position={[0, 0, 0]} />
      </Float>
      <Produce position={[-1.4, 0.5, 0.4]} color="#c9432b" />
      <Produce position={[1.3, -0.2, 0.6]} color="#f0b429" scale={0.85} />
      <Produce position={[-0.9, -0.7, -0.3]} color="#3d8a58" scale={0.75} geometry="capsule" />
      <PhotoTile position={[1.5, 0.9, -0.5]} rotation={[0, -0.3, 0.08]} color="#e5f3ea" />
      <PhotoTile position={[-1.7, -0.4, -0.6]} rotation={[0, 0.35, -0.06]} color="#f4efe6" />
      {/* soft contact shadow directly under the bag only — not a panel behind the scene */}
      <ContactShadows position={[0, -0.95, 0]} opacity={0.35} scale={3.2} blur={2.4} far={1.6} color="#0b2118" />
    </Rig>
  )
}

function StaticFallback() {
  // No WebGL / reduced motion: a quiet gradient glow, still no card frame.
  return (
    <div
      aria-hidden
      className="h-full w-full"
      style={{
        background:
          'radial-gradient(60% 60% at 50% 45%, rgba(196,93,44,.18) 0%, rgba(196,93,44,0) 70%),' +
          'radial-gradient(45% 45% at 65% 65%, rgba(79,209,139,.16) 0%, rgba(79,209,139,0) 70%)',
      }}
    />
  )
}

export default function Scene3D() {
  const webgl = useCanUseWebGL()
  const reduced = usePrefersReducedMotion()

  const canRender = useMemo(() => webgl === true && !reduced, [webgl, reduced])

  if (webgl === null) return null // avoid a flash before the check resolves
  if (!canRender) return <StaticFallback />

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0.4, 5.2], fov: 38 }}
      className="!bg-transparent"
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} castShadow />
      <Environment preset="apartment" />
      <Shelf />
    </Canvas>
  )
}
