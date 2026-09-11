import { motion, AnimatePresence } from 'framer-motion'
import { CheckIcon, CloseIcon, SparkIcon } from './Icons'
import { useCart } from '../context/CartContext'

const kinds = {
  success: { bg: 'from-leaf-bright to-forest', Icon: CheckIcon },
  error: { bg: 'from-terracotta to-terracotta-deep', Icon: CloseIcon },
  info: { bg: 'from-ink-2 to-ink', Icon: SparkIcon },
}

export default function Toast() {
  const { toast } = useCart()
  const k = kinds[toast?.kind] || kinds.success
  const { Icon } = k

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-full bg-gradient-to-r ${k.bg} py-3 pl-3 pr-5 text-paper shadow-lift`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
              <Icon size={16} />
            </span>
            <span className="text-[.88rem] font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
