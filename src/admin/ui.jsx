import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { CloseIcon } from '../components/Icons'

export function Panel({ children, className, title, action }) {
  return (
    <section className={cn('rounded-[22px] border border-white/8 bg-white/[.035] p-5 backdrop-blur-sm', className)}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-[1.15rem] text-paper">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, sub, Icon, accent = '#4fd18b', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay }}
      className="relative overflow-hidden rounded-[20px] border border-white/8 bg-white/[.035] p-4"
    >
      <span aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[.74rem] uppercase tracking-[.14em] text-mint/45">{label}</p>
          <p className="mt-1.5 font-display text-[1.65rem] font-semibold leading-none text-paper">{value}</p>
          {sub && <p className="mt-1.5 text-[.76rem] text-mint/50">{sub}</p>}
        </div>
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10" style={{ color: accent }}>
            <Icon size={19} />
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
          <tr className="border-b border-white/8">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 text-[.72rem] font-semibold uppercase tracking-[.12em] text-mint/45">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-white/5">
                {head.map((h) => <td key={h} className="px-3 py-3"><span className="block h-4 animate-pulse rounded bg-white/8" /></td>)}
              </tr>
            ))
          ) : children}
        </tbody>
      </table>
      {!loading && empty && <p className="py-10 text-center text-[.88rem] text-mint/45">{empty}</p>}
    </div>
  )
}

export const Td = ({ children, className }) => (
  <td className={cn('px-3 py-3 text-[.86rem] text-mint/80', className)}>{children}</td>
)

export const Tr = ({ children, className }) => (
  <tr className={cn('border-b border-white/5 transition-colors hover:bg-white/[.03]', className)}>{children}</tr>
)

export function Badge({ children, color = '#4fd18b', className }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[.72rem] font-semibold', className)}
      style={{ color, background: `${color}1f`, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  )
}

export function AdminButton({ children, variant = 'primary', className, ...rest }) {
  const styles = {
    primary: 'bg-gradient-to-r from-leaf-glow to-leaf-bright text-forest hover:brightness-110',
    ghost: 'border border-white/12 bg-white/5 text-mint hover:bg-white/10',
    danger: 'border border-terracotta/40 bg-terracotta/12 text-[#f0a58a] hover:bg-terracotta/25',
  }
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[.83rem] font-semibold transition-all active:scale-95 disabled:opacity-50', styles[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
}

export const adminField =
  'w-full rounded-xl border border-white/12 bg-white/6 px-3.5 py-2.5 text-[.86rem] text-paper outline-none transition-colors placeholder:text-mint/35 focus:border-leaf-glow focus:bg-white/10'

export function Modal({ open, onClose, title, children, wide }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto p-4 py-[6vh]">
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cn('relative w-full rounded-[24px] border border-white/10 bg-[#12291f] p-5 shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-[1.25rem] text-paper">{title}</h2>
              <button onClick={onClose} aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-mint/70 transition-colors hover:bg-white/10">
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
