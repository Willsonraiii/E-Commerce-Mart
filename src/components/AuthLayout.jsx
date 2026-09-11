import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo'
import Toast from './Toast'
import { ArrowLeft, SparkIcon } from './Icons'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'
import useMediaQuery from '../hooks/useMediaQuery'

const AuthScene3D = lazy(() => import('./three/AuthScene3D'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch { return false }
}

/* ------------------------------------------------------------------ *
 * Slow drifting colour orbs. These sit *behind* the glass card and are
 * what makes the backdrop-filter actually read as frosted glass.
 * ------------------------------------------------------------------ */
function AmbientOrbs({ reduced }) {
  const orbs = [
    { c: 'rgba(79,209,139,.55)', s: 460, x: '-12%', y: '-8%', d: 0 },
    { c: 'rgba(196,150,42,.42)', s: 380, x: '68%', y: '4%', d: 3 },
    { c: 'rgba(196,93,44,.34)', s: 340, x: '52%', y: '58%', d: 6 },
    { c: 'rgba(61,138,88,.40)', s: 420, x: '-6%', y: '54%', d: 9 },
  ]
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: o.s, height: o.s, left: o.x, top: o.y,
            background: `radial-gradient(circle, ${o.c}, transparent 68%)`,
            filter: 'blur(38px)',
          }}
          animate={reduced ? undefined : {
            x: [0, 34, -22, 0],
            y: [0, -28, 20, 0],
            scale: [1, 1.09, 0.95, 1],
          }}
          transition={{ duration: 22 + i * 5, repeat: Infinity, ease: 'easeInOut', delay: o.d }}
        />
      ))}
    </div>
  )
}

/* Rotating marquee of shop truths shown under the 3D ring. */
function RotatingLine({ lines, reduced }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduced) return
    const t = setInterval(() => setI((v) => (v + 1) % lines.length), 3600)
    return () => clearInterval(t)
  }, [lines.length, reduced])

  return (
    <div className="relative h-6 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0 flex items-center gap-2 text-[.88rem] text-mint/85"
        >
          <SparkIcon size={14} className="shrink-0 text-leaf-glow" />
          {lines[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

/* Soft cursor-following glow on the brand panel. */
function PointerGlow({ disabled }) {
  const ref = useRef(null)
  useEffect(() => {
    if (disabled) return
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    const move = (e) => {
      const r = parent.getBoundingClientRect()
      el.style.transform = `translate(${e.clientX - r.left - 260}px, ${e.clientY - r.top - 260}px)`
    }
    parent.addEventListener('mousemove', move)
    return () => parent.removeEventListener('mousemove', move)
  }, [disabled])

  if (disabled) return null
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-[1] h-[520px] w-[520px] rounded-full opacity-70 blur-[90px] transition-transform duration-300 ease-out"
      style={{ background: 'radial-gradient(circle, rgba(79,209,139,.30), transparent 68%)' }}
    />
  )
}

/**
 * Full-viewport split auth shell. Renders its own chrome — the store
 * Header/Footer are intentionally absent so the page never scrolls.
 *
 * `mode` ('login' | 'register') drives the shared-element transition:
 * both routes render the same layoutIds, so Framer Motion tweens the
 * panel and card between them instead of hard-cutting.
 */
export default function AuthLayout({
  children,
  heading,
  sub,
  lines,
  footer,
  mode = 'login',
  reverse = false,
}) {
  const reduced = usePrefersReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [webgl] = useState(hasWebGL)
  const show3d = webgl && desktop && !reduced

  // Lock the document scroll for the lifetime of the auth screens.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const spring = reduced
    ? { duration: 0 }
    : { type: 'spring', stiffness: 210, damping: 30, mass: 0.9 }

  return (
    <div className="relative grid h-[100dvh] w-full overflow-hidden bg-cream lg:grid-cols-[1.05fr_1fr]">
      {/* ---------------------------------------------------------- *
       * Brand panel — slides across on route change via layoutId
       * ---------------------------------------------------------- */}
      <motion.aside
        layoutId="auth-brand-panel"
        transition={spring}
        className={`relative hidden overflow-hidden bg-forest-deep lg:block ${reverse ? 'lg:order-2' : ''}`}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 20% 0%, #1c4634 0%, #143528 42%, #0b2118 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[.16]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(229,243,234,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(229,243,234,.6) 1px, transparent 1px)',
            backgroundSize: '58px 58px',
            maskImage: 'radial-gradient(75% 65% at 50% 42%, #000 0%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(75% 65% at 50% 42%, #000 0%, transparent 100%)',
          }}
        />
        <PointerGlow disabled={reduced} />

        {/* Inner content is counter-animated so it fades rather than
            stretching while the panel itself slides. */}
        <motion.div
          layout="position"
          transition={spring}
          className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12"
        >
          <Link to="/" className="w-fit rounded-full transition-opacity hover:opacity-85">
            <Logo light stacked className="h-[118px]" />
          </Link>

          <div className="relative -my-4 min-h-0 flex-1">
            {show3d ? (
              <Suspense fallback={null}>
                <AuthScene3D reduced={reduced} />
              </Suspense>
            ) : (
              <div className="grid h-full place-items-center">
                <div className="h-40 w-40 rounded-[32px] border border-white/12 bg-white/6" />
              </div>
            )}
          </div>

          <div className="shrink-0">
            <h2 className="font-display text-[2.15rem] leading-[1.12] text-paper xl:text-[2.4rem]">
              The corner shop,
              <br />
              <span className="bg-gradient-to-r from-leaf-glow to-gold-soft bg-clip-text text-transparent">
                in your pocket.
              </span>
            </h2>
            <div className="mt-3.5">
              <RotatingLine lines={lines} reduced={reduced} />
            </div>
            <p className="mt-7 border-t border-white/10 pt-4 text-[.76rem] text-mint/40">
              Shop 12, New Baneshwor Chowk · Kathmandu 44600
            </p>
          </div>
        </motion.div>
      </motion.aside>

      {/* ---------------------------------------------------------- *
       * Form panel
       * ---------------------------------------------------------- */}
      <main
        id="main"
        className={`no-scrollbar relative flex h-[100dvh] flex-col overflow-y-auto lg:h-auto ${reverse ? 'lg:order-1' : ''}`}
      >
        {/* Colour field behind the glass — without this the frosted
            card has nothing interesting to refract. */}
        <AmbientOrbs reduced={reduced} />

        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-6 sm:px-10">
          <Link
            to="/"
            className="glass-ios pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[.82rem] font-medium text-ink-2 transition-colors hover:text-leaf"
          >
            <ArrowLeft size={15} /> Back to shop
          </Link>
          <div className="pointer-events-auto lg:hidden"><Logo compact size={54} /></div>
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-20 sm:px-8">
          {/* The frosted card. layoutId keeps it on screen and tweens
              its height as the two routes swap. */}
          <motion.div
            layoutId="auth-card"
            transition={spring}
            className="glass-ios w-full max-w-[440px] rounded-[30px] p-7 sm:p-8"
          >
            <motion.div layout="position" transition={spring}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: reduced ? 0 : 0.26, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <h1 className="font-display text-[2.05rem] leading-tight text-forest">{heading}</h1>
                  <p className="mt-1.5 text-[.93rem] text-ink-2">{sub}</p>
                </motion.div>
              </AnimatePresence>
              {children}
            </motion.div>
          </motion.div>
        </div>

        {footer && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-6 text-center text-[.87rem] text-ink-2 sm:px-10">
            <span className="pointer-events-auto">{footer}</span>
          </div>
        )}
      </main>

      <Toast />
    </div>
  )
}
