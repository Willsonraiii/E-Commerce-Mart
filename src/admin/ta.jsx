/**
 * TailAdmin component kit.
 *
 * A light-theme UI set modelled on the TailAdmin eCommerce dashboard:
 * white rounded-2xl cards, hairline gray borders, soft shadows, an indigo
 * (#465fff) accent, and green/red delta pills. Used by the admin console only —
 * the storefront keeps the forest brand.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

/* ------------------------------------------------------------------ card -- */

export function Card({ children, className, ...rest }) {
  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white shadow-ta', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {title && <h3 className="text-[1.05rem] font-semibold text-gray-800">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-[.82rem] text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ----------------------------------------------------------- delta pill -- */

/** Signed change pill: green with ▲ when up, red with ▼ when down. */
export function Delta({ value, className }) {
  const up = Number(value) >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[.75rem] font-medium',
        up ? 'bg-success-50 text-success-600' : 'bg-errorc-50 text-errorc-600',
        className,
      )}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className={up ? '' : 'rotate-180'}>
        <path d="M6 2.5 9.5 7H2.5L6 2.5Z" fill="currentColor" />
      </svg>
      {Math.abs(Number(value)).toFixed(2)}%
    </span>
  )
}

/* ------------------------------------------------------------- counters -- */

/** Counts up to `value` once scrolled into view. */
export function Counter({ value, prefix = '', decimals = 0, className }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)

  // Animate on mount rather than on scroll: gating with useInView left every
  // card below the fold rendering a misleading 0.
  useEffect(() => {
    const target = Number(value) || 0
    const dur = 900
    const t0 = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1)
      const eased = 1 - (1 - p) ** 3
      setN(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}

/* ---------------------------------------------------------- metric card -- */

/**
 * TailAdmin metric card: grey icon chip top-left, label, big number,
 * delta pill on the right of the value row.
 */
export function MetricCard({ label, value, delta, Icon, prefix = '', decimals = 0, delay = 0, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 0.8, 0.25, 1] }}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-ta transition-shadow hover:shadow-ta-md sm:p-5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-800 sm:h-12 sm:w-12">
        {Icon && <Icon size={22} />}
      </span>
      <div className="mt-3.5 flex items-end justify-between gap-3 sm:mt-5">
        <div className="min-w-0">
          <span className="block text-[.85rem] text-gray-500">{label}</span>
          <Counter
            value={value}
            prefix={prefix}
            decimals={decimals}
            className="mt-1.5 block text-[1.7rem] font-bold leading-tight text-gray-800"
          />
          {sub && <span className="mt-0.5 block text-[.74rem] text-gray-400">{sub}</span>}
        </div>
        {delta !== undefined && delta !== null && <Delta value={delta} />}
      </div>
    </motion.div>
  )
}

/* --------------------------------------------------------- radial gauge -- */

/**
 * Half-doughnut "Monthly Target" gauge. `value` is a percentage 0-100.
 * Drawn as a 180° arc so it matches TailAdmin's semicircle.
 */
export function RadialGauge({ value = 0, size = 260, delta }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  const stroke = 30
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const semi = Math.PI * r // arc length of 180°
  const ref = useRef(null)

  return (
    <div ref={ref} className="relative mx-auto" style={{ width: size, height: size / 2 + 18 }}>
      <svg width={size} height={size / 2 + 18} viewBox={`0 0 ${size} ${size / 2 + 18}`}>
        {/* track */}
        <path
          d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none" stroke="#e4e7ec" strokeWidth={stroke} strokeLinecap="round"
        />
        {/* value */}
        <motion.path
          d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none" stroke="#465fff" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={semi}
          initial={{ strokeDashoffset: semi }}
          animate={{ strokeDashoffset: semi - (semi * pct) / 100 }}
          transition={{ duration: 1.1, ease: [0.22, 0.8, 0.25, 1] }}
        />
      </svg>
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: size * 0.22 }}>
        <span className="flex items-baseline text-[2.1rem] font-bold text-gray-800">
          <Counter value={pct} decimals={2} />%
        </span>
        {delta !== undefined && <Delta value={delta} className="mt-1" />}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- bar chart -- */

/** Grouped bar chart with a y-axis, gridlines and hover tooltip. */
export function BarChart({ data, height = 230, format = (v) => v }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...data.map((d) => d.v), 1)
  const ticks = 4
  const niceMax = Math.ceil(max / ticks) * ticks || ticks

  return (
    <div className="relative" style={{ height }}>
      <div className="flex h-full">
        {/* y axis */}
        <div className="flex w-10 shrink-0 flex-col justify-between pb-6 text-right text-[.7rem] text-gray-400">
          {Array.from({ length: ticks + 1 }, (_, i) => (
            <span key={i}>{Math.round((niceMax / ticks) * (ticks - i))}</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 pb-6">
          {/* gridlines */}
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {Array.from({ length: ticks + 1 }, (_, i) => <span key={i} className="h-px w-full bg-gray-100" />)}
          </div>

          <div className="relative flex h-full items-end gap-[3.5%] px-[1.5%]">
            {data.map((d, i) => {
              const h = (d.v / niceMax) * 100
              return (
                <div
                  key={d.label + i}
                  className="group relative flex h-full flex-1 flex-col justify-end"
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                >
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${Math.max(h, 0.8)}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 0.8, 0.25, 1] }}
                    className={cn('w-full rounded-t-md transition-colors',
                      hover === i ? 'bg-brand-600' : 'bg-brand-500')}
                    style={{ marginBottom: 24 }}
                  />
                  <span className="absolute inset-x-0 bottom-0 text-center text-[.68rem] leading-tight text-gray-400">
                    {d.label}
                  </span>
                  {hover === i && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[.74rem] shadow-ta-md">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brand-500" />
                      <span className="text-gray-500">{d.label}:</span>{' '}
                      <span className="font-semibold text-gray-800">{format(d.v)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- area chart -- */

/** Smooth two-series area chart (TailAdmin "Statistics" panel). */
export function AreaChart({ data, height = 290, format = (v) => v }) {
  const [hover, setHover] = useState(null)
  const W = 1000
  const H = 300
  const pad = { l: 44, r: 12, t: 14, b: 26 }

  const max = Math.max(...data.flatMap((d) => [d.a, d.b ?? 0]), 1)
  const niceMax = Math.ceil(max / 4) * 4 || 4
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(data.length - 1, 1)
  const y = (v) => pad.t + (1 - v / niceMax) * (H - pad.t - pad.b)

  /** Catmull-Rom -> cubic bezier, so the line curves like the reference. */
  const path = (key) => {
    const pts = data.map((d, i) => [x(i), y(d[key] ?? 0)])
    if (pts.length < 2) return ''
    let out = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i - 1] || pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2] || p2
      const c1x = p1[0] + (p2[0] - p0[0]) / 6
      const c1y = p1[1] + (p2[1] - p0[1]) / 6
      const c2x = p2[0] - (p3[0] - p1[0]) / 6
      const c2y = p2[1] - (p3[1] - p1[1]) / 6
      out += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`
    }
    return out
  }
  const area = (key) => `${path(key)} L ${x(data.length - 1)} ${H - pad.b} L ${x(0)} ${H - pad.b} Z`

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const rel = ((e.clientX - r.left) / r.width) * W
          const i = Math.round(((rel - pad.l) / (W - pad.l - pad.r)) * (data.length - 1))
          setHover(Math.max(0, Math.min(data.length - 1, i)))
        }}
      >
        <defs>
          <linearGradient id="ta-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#465fff" stopOpacity=".26" />
            <stop offset="100%" stopColor="#465fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ta-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9cb9ff" stopOpacity=".22" />
            <stop offset="100%" stopColor="#9cb9ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: 5 }, (_, i) => {
          const yy = pad.t + (i * (H - pad.t - pad.b)) / 4
          return <line key={i} x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="#f2f4f7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        })}

        {data.some((d) => d.b !== undefined) && (
          <>
            <path d={area('b')} fill="url(#ta-b)" />
            <motion.path d={path('b')} fill="none" stroke="#9cb9ff" strokeWidth="2" vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} />
          </>
        )}
        <path d={area('a')} fill="url(#ta-a)" />
        <motion.path d={path('a')} fill="none" stroke="#465fff" strokeWidth="2.4" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} />

        {hover !== null && (
          <>
            <line x1={x(hover)} y1={pad.t} x2={x(hover)} y2={H - pad.b} stroke="#d0d5dd" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover)} cy={y(data[hover].a)} r="5" fill="#465fff" stroke="#fff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>

      {/* y labels */}
      <div className="pointer-events-none absolute left-0 top-0 flex flex-col justify-between text-[.7rem] text-gray-400"
        style={{ height: `${((H - pad.t - pad.b) / H) * 100}%`, marginTop: `${(pad.t / H) * 100}%` }}>
        {Array.from({ length: 5 }, (_, i) => <span key={i}>{Math.round((niceMax / 4) * (4 - i))}</span>)}
      </div>

      {/* x labels */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between pl-11 pr-3 text-[.7rem] text-gray-400">
        {data.map((d, i) => (
          <span key={i} className={cn(data.length > 8 && i % 2 ? 'hidden sm:inline' : '')}>{d.label}</span>
        ))}
      </div>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[.75rem] shadow-ta-md"
          style={{ left: `${(x(hover) / W) * 100}%`, top: 4 }}
        >
          <p className="mb-0.5 font-medium text-gray-800">{data[hover].label}</p>
          <p className="text-gray-500">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-500" />
            {format(data[hover].a)}
          </p>
          {data[hover].b !== undefined && (
            <p className="text-gray-500">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-300" />
              {format(data[hover].b)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------- segmented -- */

/** Monthly / Quarterly / Annually pill switch. */
export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cn('inline-flex rounded-lg bg-gray-100 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o} type="button" onClick={() => onChange(o)}
          className={cn('relative rounded-[6px] px-3 py-1.5 text-[.8rem] font-medium transition-colors',
            value === o ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700')}
        >
          {value === o && <motion.span layoutId="ta-seg" className="absolute inset-0 rounded-[6px] bg-white shadow-ta"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="relative z-10">{o}</span>
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------- table -- */

export function TaTable({ head, children, empty, loading, className }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-y border-gray-200">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-[.76rem] font-medium uppercase tracking-wide text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{head.map((h) => <td key={h} className="px-4 py-3.5"><div className="h-4 animate-pulse rounded bg-gray-100" /></td>)}</tr>
            ))
            : children}
        </tbody>
      </table>
      {!loading && empty}
    </div>
  )
}

export const TaTd = ({ children, className }) => (
  <td className={cn('px-4 py-3.5 text-[.86rem] text-gray-700', className)}>{children}</td>
)

export const TaTr = ({ children, className }) => (
  <tr className={cn('transition-colors hover:bg-gray-50', className)}>{children}</tr>
)

/* ------------------------------------------------------------ status -- */

const STATUS_STYLES = {
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-errorc-50 text-errorc-700',
  info: 'bg-brand-50 text-brand-700',
  neutral: 'bg-gray-100 text-gray-700',
}

export function StatusPill({ children, tone = 'neutral', className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[.75rem] font-medium', STATUS_STYLES[tone], className)}>
      {children}
    </span>
  )
}

/* -------------------------------------------------------- pagination -- */

export function Pagination({ page, pages, onPage, className }) {
  if (pages <= 1) return null
  const nums = useMemo(() => {
    const out = []
    for (let i = 1; i <= pages; i += 1) {
      if (i === 1 || i === pages || Math.abs(i - page) <= 1) out.push(i)
      else if (out[out.length - 1] !== '…') out.push('…')
    }
    return out
  }, [page, pages])

  return (
    <div className={cn('flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-3', className)}>
      <button
        onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-[.8rem] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
      >
        Previous
      </button>
      <div className="flex items-center gap-1">
        {nums.map((n, i) => (n === '…'
          ? <span key={`e${i}`} className="px-1.5 text-gray-400">…</span>
          : (
            <button
              key={n} onClick={() => onPage(n)}
              className={cn('h-8 min-w-8 rounded-lg px-2 text-[.8rem] font-medium transition-colors',
                n === page ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100')}
            >
              {n}
            </button>
          )))}
      </div>
      <button
        onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-[.8rem] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

/* -------------------------------------------------------- form atoms -- */

export const taField =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[.86rem] text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10'

export function TaButton({ children, variant = 'primary', className, ...rest }) {
  const styles = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-ta',
    ghost: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    danger: 'bg-errorc-500 text-white hover:bg-errorc-600',
    subtle: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  }
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[.83rem] font-medium transition-all active:scale-[.98] disabled:opacity-50', styles[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
}
