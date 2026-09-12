/**
 * Shared admin primitives.
 *
 * These are the original component names the eight admin pages import, now
 * re-skinned to the TailAdmin light theme. Keeping the names/API stable means
 * the pages themselves needed no structural rewrite.
 *
 * New code should prefer the richer kit in ./ta.jsx (Card, MetricCard,
 * TaTable, …); these remain for the CRUD pages.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { CloseIcon } from '../components/Icons'

export function Panel({ children, className, title, action }) {
  return (
    <section className={cn('rounded-2xl border border-gray-200 bg-white p-5 shadow-ta', className)}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-[1.05rem] font-semibold text-gray-800">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, sub, Icon, accent = '#465fff', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 0.8, 0.25, 1] }}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-ta transition-shadow hover:shadow-ta-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[.82rem] text-gray-500">{label}</p>
          <p className="mt-1.5 text-[1.6rem] font-bold leading-none text-gray-800">{value}</p>
          {sub && <p className="mt-1.5 text-[.76rem] text-gray-400">{sub}</p>}
        </div>
        {Icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gray-100" style={{ color: accent }}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function Table({ head, children, empty, loading }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-y border-gray-200 bg-gray-50">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-[.74rem] font-medium uppercase tracking-wide text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {head.map((h) => (
                  <td key={h} className="px-4 py-3.5"><div className="h-4 animate-pulse rounded bg-gray-100" /></td>
                ))}
              </tr>
            ))
            : children}
        </tbody>
      </table>
      {!loading && empty}
    </div>
  )
}

export const Td = ({ children, className }) => (
  <td className={cn('px-4 py-3.5 text-[.86rem] text-gray-700', className)}>{children}</td>
)

export const Tr = ({ children, className }) => (
  <tr className={cn('transition-colors hover:bg-gray-50', className)}>{children}</tr>
)

/**
 * Status/label chip. Callers pass brand hex colours (e.g. '#4fd18b'); we map
 * the common ones onto the TailAdmin palette and fall back to a tinted chip
 * built from the supplied colour.
 */
const COLOR_MAP = {
  '#4fd18b': 'bg-success-50 text-success-700',
  '#3d8a58': 'bg-success-50 text-success-700',
  '#2f6b47': 'bg-success-50 text-success-700',
  '#f0b429': 'bg-warning-50 text-warning-700',
  '#c4962a': 'bg-warning-50 text-warning-700',
  '#e2795b': 'bg-errorc-50 text-errorc-700',
  '#c45d2c': 'bg-errorc-50 text-errorc-700',
  '#7ab7e8': 'bg-brand-50 text-brand-700',
}

export function Badge({ children, color = '#465fff', className }) {
  const preset = COLOR_MAP[String(color).toLowerCase()]
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[.75rem] font-medium', preset, className)}
      style={preset ? undefined : { background: `${color}1a`, color }}
    >
      {children}
    </span>
  )
}

export function AdminButton({ children, variant = 'primary', className, ...rest }) {
  const styles = {
    primary: 'bg-brand-500 text-white shadow-ta hover:bg-brand-600',
    ghost: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    danger: 'bg-errorc-500 text-white hover:bg-errorc-600',
  }
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[.83rem] font-medium transition-all active:scale-[.98] disabled:pointer-events-none disabled:!bg-gray-100 disabled:!text-gray-400 disabled:!border-gray-200 disabled:shadow-none', styles[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
}

export const adminField =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[.86rem] text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10'

export function Modal({ open, onClose, title, children, wide }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto p-4 py-[6vh]">
          <motion.div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cn('relative w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-ta-lg', wide ? 'max-w-2xl' : 'max-w-md')}
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[1.15rem] font-semibold text-gray-800">{title}</h2>
              <button onClick={onClose} aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <CloseIcon size={16} />
              </button>
            </header>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
