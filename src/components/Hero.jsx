import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AuroraBackground, TextGenerate, Magnetic, NumberTicker, ShimmerBadge, Reveal } from './ui/Aceternity'
import { ArrowRight, TruckIcon, LeafIcon, ShieldIcon, SparkIcon, CubeIcon } from './Icons'
import useMediaQuery from '../hooks/useMediaQuery'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

const Scene3D = lazy(() => import('./three/Scene3D'))

class CanvasBoundary extends Component {
  constructor(p) { super(p); this.state = { error: false } }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? this.props.fallback : this.props.children }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

const FLOATERS = [
  { src: '/images/wai-wai.jpg', className: 'left-[4%] top-[14%] h-24 w-24 sm:h-28 sm:w-28', delay: 0 },
  { src: '/images/milk.jpg', className: 'right-[6%] top-[10%] h-20 w-20 sm:h-24 sm:w-24', delay: 0.8 },
  { src: '/images/bread.jpg', className: 'left-[8%] bottom-[16%] h-20 w-20 sm:h-24 sm:w-24', delay: 1.6 },
  { src: '/images/tomato.jpg', className: 'right-[4%] bottom-[12%] h-24 w-24 sm:h-28 sm:w-28', delay: 2.4 },
]

function FallbackScene() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      {FLOATERS.map((f) => (
        <motion.div
          key={f.src}
          className={`absolute overflow-hidden rounded-3xl border-4 border-paper shadow-lift ${f.className}`}
          animate={{ y: [0, -16, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
        >
          <img src={f.src} alt="" className="h-full w-full object-cover" />
        </motion.div>
      ))}
      <motion.div
        className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-leaf-glow/30 to-gold/20 blur-2xl"
        animate={{ scale: [1, 1.14, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

const PERKS = [
  { Icon: TruckIcon, title: 'Free local delivery', copy: 'On orders across New Baneshwor', tone: 'from-leaf-bright to-forest' },
  { Icon: LeafIcon, title: 'Only the freshest goods', copy: 'Your must-haves, on the racks today', tone: 'from-gold-bright to-terracotta' },
  { Icon: ShieldIcon, title: 'Money-back guarantee', copy: 'Order online, pick up at the shop', tone: 'from-terracotta to-terracotta-deep' },
]

export default function Hero() {
  const mobile = useMediaQuery('(max-width: 900px)')
  const reduced = usePrefersReducedMotion()
  const [webgl] = useState(() => hasWebGL())
  const [onScreen, setOnScreen] = useState(true)
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, 90])
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '150px', threshold: 0.02 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const show3d = webgl && onScreen && !reduced

  return (
    <section ref={ref} id="home" className="relative overflow-hidden">
      <AuroraBackground intensity={0.85} className="absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream/40 via-cream/10 to-cream" />

      <div className="wrap relative z-10 grid items-center gap-8 pb-14 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-20 lg:pt-16">
        <motion.div style={{ y: yCopy, opacity }} className="relative z-20 text-center lg:text-left">
          <Reveal>
            <ShimmerBadge className="mb-5">
              <SparkIcon size={14} className="text-leaf-glow" />
              New Baneshwor · Open today till 9 PM
            </ShimmerBadge>
          </Reveal>

          <h1 className="font-display text-[2.6rem] leading-[1.05] text-forest sm:text-[3.4rem] lg:text-[4rem]">
            <TextGenerate words="Everything you need" className="block" />
            <span className="relative mt-1 inline-block">
              <TextGenerate words="for a delicious meal" delay={0.35} className="block bg-gradient-to-r from-leaf-bright via-leaf to-gold bg-clip-text text-transparent" />
              <motion.svg
                viewBox="0 0 300 12" className="absolute -bottom-1 left-0 w-full" fill="none" preserveAspectRatio="none"
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 1.1, ease: 'easeInOut' }}
              >
                <motion.path d="M3 8c60-5 130-6 294-3" stroke="#c4962a" strokeWidth="3.5" strokeLinecap="round" />
              </motion.svg>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="mx-auto mt-6 max-w-lg text-[1.02rem] leading-relaxed text-ink-2 lg:mx-0"
          >
            Fresh produce, daily groceries and household essentials from the corner of
            New Baneshwor Chowk — delivered in as little as one hour.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <Magnetic>
              <Link to="/shop" className="btn btn-primary group px-7 py-3.5 text-[.98rem]">
                Shop now
                <motion.span className="inline-block" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                  <ArrowRight size={18} />
                </motion.span>
              </Link>
            </Magnetic>
            <Magnetic strength={0.24}>
              <a href="#categories" className="btn btn-ghost px-6 py-3.5 text-[.95rem]">
                <CubeIcon size={17} /> Browse aisles
              </a>
            </Magnetic>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
            className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6 lg:mx-0"
          >
            {[
              { v: 47, s: '+', l: 'Products' },
              { v: 12, s: '', l: 'Aisles' },
              { v: 60, s: 'min', l: 'Avg delivery' },
            ].map((s) => (
              <div key={s.l} className="text-center lg:text-left">
                <dt className="font-display text-[1.6rem] font-semibold text-forest">
                  <NumberTicker value={s.v} suffix={s.s} />
                </dt>
                <dd className="text-[.75rem] uppercase tracking-[.12em] text-ink-3">{s.l}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* 3D stage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 0.8, 0.25, 1] }}
          className="relative h-[340px] overflow-hidden sm:h-[420px] lg:h-[560px]"
        >
          <div className="absolute inset-0">
            {show3d ? (
              <CanvasBoundary fallback={<FallbackScene />}>
                <Suspense fallback={<FallbackScene />}>
                  <Scene3D mobile={mobile} reduced={reduced} />
                </Suspense>
              </CanvasBoundary>
            ) : (
              <FallbackScene />
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
            className="pointer-events-none absolute bottom-2 left-1/2 z-20 max-w-[92%] -translate-x-1/2 truncate rounded-full border border-white/60 bg-paper/80 px-4 py-1.5 text-center text-[.72rem] font-medium text-ink-2 backdrop-blur"
          >
            {!show3d ? '✦ Fresh from the racks' : mobile ? '✦ Drag the shelf to explore' : '✦ Move your cursor — the shelf follows'}
          </motion.div>
        </motion.div>
      </div>

      {/* perks */}
      <div className="wrap relative z-10 pb-16">
        <ul className="grid gap-4 sm:grid-cols-3">
          {PERKS.map(({ Icon, title, copy, tone }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <motion.li
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="glass flex h-full items-start gap-4 rounded-[22px] p-5 shadow-premium"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-md`}>
                  <Icon size={22} />
                </span>
                <div>
                  <h2 className="font-display text-[1.02rem] leading-snug text-forest">{title}</h2>
                  <p className="mt-0.5 text-[.84rem] text-ink-3">{copy}</p>
                </div>
              </motion.li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
