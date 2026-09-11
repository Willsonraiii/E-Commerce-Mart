import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

/**
 * Brand lockup — the supplied artwork, used as drawn.
 *
 * No container card and no retyped text: the wordmark, cart and swoosh are
 * part of the logo and ship as pixels.
 *
 * Four files, all cut from the one source image:
 *
 *   logo-full.png     stacked original          — vertical room (auth panel)
 *   logo-light.png    stacked, cream ink        — same, on forest
 *   logo-h.png        horizontal lockup         — headers, wide + short
 *   logo-h-light.png  horizontal, cream ink     — same, on forest
 *
 * The "light" pair is the identical artwork with only the dark-green brand ink
 * (#006018, invisible on our forest surfaces) remapped to cream. The figure,
 * the orange, the cart and every outline are untouched.
 *
 * Size is driven by height via `className` (e.g. `h-[64px]`); width follows the
 * artwork's own ratio.
 */
export default function Logo({
  compact = false,
  light = false,
  stacked = false,
  size = 56,
  className,
}) {
  if (compact) {
    return (
      <motion.span
        className={cn('inline-block select-none', className)}
        style={{ width: size, height: size }}
        whileHover={{ scale: 1.06, rotate: -3 }}
        transition={{ type: 'spring', stiffness: 340, damping: 16 }}
      >
        <img
          src="/brand/logo-mark.png"
          alt="Yalambar Store"
          draggable="false"
          className="h-full w-full object-contain"
        />
      </motion.span>
    )
  }

  const src = stacked
    ? (light ? '/brand/logo-light.png' : '/brand/logo-full.png')
    : (light ? '/brand/logo-h-light.png' : '/brand/logo-h.png')

  return (
    <motion.span
      className="inline-block select-none"
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      <img
        src={src}
        alt="Yalambar Store"
        draggable="false"
        style={className ? undefined : { height: size }}
        className={cn('block w-auto max-w-full object-contain', className)}
      />
    </motion.span>
  )
}
