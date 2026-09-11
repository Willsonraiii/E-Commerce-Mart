import { useRef, useState, useEffect, useId } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useScroll, useMotionTemplate, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

/* ------------------------------------------------------------------ *
 * Aurora background — animated gradient light field
 * ------------------------------------------------------------------ */
export function AuroraBackground({ className, children, intensity = 1 }) {
  return (
    <div className={cn('relative overflow-hidden isolate', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[12%] aurora-bg animate-aurora"
        style={{ opacity: intensity }}
      />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Spotlight — cursor-tracking radial highlight
 * ------------------------------------------------------------------ */
export function SpotlightCard({ className, children, color = 'rgba(79,209,139,.16)', radius = 380 }) {
  const ref = useRef(null)
  const mx = useMotionValue(-500)
  const my = useMotionValue(-500)
  const [on, setOn] = useState(false)

  const bg = useMotionTemplate`radial-gradient(${radius}px circle at ${mx}px ${my}px, ${color}, transparent 72%)`

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect()
        mx.set(e.clientX - r.left)
        my.set(e.clientY - r.top)
      }}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      className={cn('group relative overflow-hidden', className)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{ background: bg, opacity: on ? 1 : 0 }}
      />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * 3D tilt card — perspective transform following the pointer
 * ------------------------------------------------------------------ */
export function TiltCard({ className, children, max = 12, scale = 1.02, glare = true }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 22 })
  const sy = useSpring(y, { stiffness: 260, damping: 22 })
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max])
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max])
  const glareX = useTransform(sx, [-0.5, 0.5], ['20%', '80%'])
  const glareY = useTransform(sy, [-0.5, 0.5], ['10%', '80%'])
  // Hoisted: hooks must never run conditionally inside JSX.
  const glareBg = useMotionTemplate`radial-gradient(220px circle at ${glareX} ${glareY}, rgba(255,255,255,.9), transparent 70%)`
  const [hover, setHover] = useState(false)

  // Tilt is a pointer affordance. On touch screens it can never fire, and
  // running the transform/springs on every card just costs frames — so
  // render a plain wrapper there instead.
  const [fine, setFine] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const on = () => setFine(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  if (!fine) {
    return <div className={cn('card-3d relative', className)}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - r.left) / r.width - 0.5)
        y.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); x.set(0); y.set(0) }}
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      animate={{ scale: hover ? scale : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cn('card-3d relative', className)}
    >
      {children}
      {glare && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] mix-blend-overlay"
          style={{
            opacity: hover ? 0.5 : 0,
            background: glareBg,
            transition: 'opacity .35s',
          }}
        />
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Moving border — rotating conic gradient frame
 * ------------------------------------------------------------------ */
export function MovingBorder({ className, children, duration = 4, rounded = 'rounded-[26px]', from = '#4fd18b', to = '#c4962a' }) {
  return (
    <div className={cn('relative p-[1.5px] overflow-hidden', rounded, className)}>
      <span
        aria-hidden
        className="absolute inset-[-120%] animate-border-spin"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${from} 20%, ${to} 34%, transparent 52%)`,
          animationDuration: `${duration}s`,
        }}
      />
      <div className={cn('relative h-full w-full bg-paper', rounded)}>{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Text generate effect — words fade in on view
 * ------------------------------------------------------------------ */
export function TextGenerate({ words, className, delay = 0, stagger = 0.055 }) {
  const list = String(words).split(' ')
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {list.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 14, filter: 'blur(8px)' },
            show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } },
          }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </motion.span>
  )
}

/* ------------------------------------------------------------------ *
 * Reveal — generic scroll-in wrapper
 * ------------------------------------------------------------------ */
export function Reveal({ children, className, delay = 0, y = 26, once = true }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-70px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 0.8, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Infinite marquee
 * ------------------------------------------------------------------ */
export function Marquee({ children, speed = 38, className, reverse = false, pauseOnHover = true }) {
  return (
    <div className={cn('group relative flex overflow-hidden', className)}>
      <div
        className={cn('flex shrink-0 items-center animate-marquee', pauseOnHover && 'group-hover:[animation-play-state:paused]')}
        style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {children}
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Number ticker — counts up on view
 * ------------------------------------------------------------------ */
export function NumberTicker({ value, className, prefix = '', suffix = '', decimals = 0, duration = 1400 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return
      done.current = true
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(Number(value) * eased)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Magnetic button — pulls toward the cursor
 * ------------------------------------------------------------------ */
export function Magnetic({ children, strength = 0.32, className }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 300, damping: 20 })
  const sy = useSpring(y, { stiffness: 300, damping: 20 })

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      className={cn('inline-block', className)}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Background beams — animated SVG light streaks
 * ------------------------------------------------------------------ */
export function BackgroundBeams({ className, count = 7 }) {
  const id = useId().replace(/:/g, '')
  const beams = Array.from({ length: count }, (_, i) => i)
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`beam-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4fd18b" stopOpacity="0" />
            <stop offset="45%" stopColor="#4fd18b" stopOpacity=".55" />
            <stop offset="100%" stopColor="#c4962a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {beams.map((i) => (
          <motion.rect
            key={i}
            x={6 + i * 13.4}
            width="0.35"
            height="46"
            rx="0.2"
            fill={`url(#beam-${id})`}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: [-50, 110], opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 7 + (i % 4) * 2.4,
              repeat: Infinity,
              delay: i * 1.15,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Scroll progress bar
 * ------------------------------------------------------------------ */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const w = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      aria-hidden
      style={{ scaleX: w }}
      className="fixed left-0 top-0 z-[70] h-[3px] w-full origin-left bg-gradient-to-r from-leaf-glow via-leaf-bright to-gold"
    />
  )
}

/* ------------------------------------------------------------------ *
 * Animated shimmer badge
 * ------------------------------------------------------------------ */
export function ShimmerBadge({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-mint',
        'animate-shimmer bg-[length:200%_100%]',
        className,
      )}
      style={{
        backgroundImage:
          'linear-gradient(110deg, rgba(20,53,40,.9) 45%, rgba(79,209,139,.35) 55%, rgba(20,53,40,.9) 65%)',
      }}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Modal shell with spring transitions
 * ------------------------------------------------------------------ */
export function Overlay({ open, onClose, children, className, align = 'center' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed inset-0 z-[80] flex p-4 sm:p-6',
            align === 'center' ? 'items-center justify-center' : 'items-start justify-center pt-[8vh]',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-forest-deep/55 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={cn('relative z-10 w-full', className)}
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
