import { motion, AnimatePresence } from 'framer-motion'

/**
 * <LoadingScreen loading={isLoading} /> — mount once near the root (see
 * integration notes) and pass whatever boolean means "critical data isn't
 * ready yet" (catalog/meta fetch, auth check, etc). It fades itself out
 * once that flips to false; the cart keeps rolling for as long as it's up.
 */
export default function LoadingScreen({ loading }) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loading-screen"
          className="fixed inset-0 z-[999] grid place-items-center bg-cream"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <div className="flex flex-col items-center gap-6">
            <CartRig />
            <motion.p
              className="font-display text-[1.05rem] text-ink-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              Stocking the shelves…
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CartRig() {
  return (
    <div className="relative h-[120px] w-[220px]">
      {/* ground line the cart rolls along */}
      <div className="absolute bottom-[18px] left-0 right-0 h-px bg-line" />

      <motion.div
        className="absolute bottom-[18px]"
        animate={{ x: [-40, 190, -40] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="90" height="70" viewBox="0 0 90 70" fill="none">
          {/* basket */}
          <motion.path
            d="M14 22 L76 22 L68 54 L22 54 Z"
            fill="#c45d2c"
            animate={{ rotate: [0, -1.5, 0, 1.5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '45px 38px' }}
          />
          {/* basket rim */}
          <rect x="10" y="16" width="70" height="8" rx="4" fill="#a84c22" />
          {/* handle */}
          <path d="M30 16 C30 2, 60 2, 60 16" stroke="#1a1714" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* wheels */}
          <motion.circle
            cx="30" cy="60" r="7" fill="#1a1714"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '30px 60px' }}
          />
          <motion.circle
            cx="60" cy="60" r="7" fill="#1a1714"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '60px 60px' }}
          />
        </svg>

        {/* produce bouncing in and out of the basket */}
        {[
          { color: '#3d8a58', delay: 0 },
          { color: '#f0b429', delay: 0.25 },
          { color: '#c9432b', delay: 0.5 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute h-3 w-3 rounded-full"
            style={{ background: p.color, left: 26 + i * 16, top: 10 }}
            animate={{ y: [0, -14, 0], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
    </div>
  )
}
