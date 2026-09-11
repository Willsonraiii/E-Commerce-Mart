import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TiltCard, SpotlightCard } from './ui/Aceternity'
import { BagIcon, HeartIcon, StarIcon, PlusIcon, EyeIcon } from './Icons'
import { cn, formatNPR, stockMeta } from '../lib/utils'
import { useCart } from '../context/CartContext'

function Stars({ rating = 0, count = 0, size = 12 }) {
  if (!rating) return <span className="text-[.7rem] text-ink-3">New arrival</span>
  return (
    <span className="inline-flex items-center gap-1 text-gold">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={size} filled={i <= Math.round(rating)} className={i <= Math.round(rating) ? '' : 'text-line'} />
      ))}
      <span className="ml-0.5 text-[.7rem] font-medium text-ink-3">{rating} ({count})</span>
    </span>
  )
}

function ProductCard({ product, index = 0, compact = false }) {
  const { addToCart, toggleWish, wishlist } = useCart()
  const [imgOk, setImgOk] = useState(true)
  const saved = wishlist.includes(product.id)
  const sm = stockMeta[product.stock] || stockMeta.in
  const out = product.stock === 'out'

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 0.8, 0.25, 1] }}
      className="h-full"
    >
      <TiltCard max={9} scale={1.015} className="h-full">
        <SpotlightCard className="group flex h-full flex-col rounded-[24px] border border-line bg-paper shadow-premium transition-shadow duration-500 hover:shadow-lift">
          <div className="relative">
            <Link to={`/product/${product.id}`} className="block overflow-hidden rounded-t-[23px] bg-gradient-to-br from-mint/70 to-cream">
              <div className={cn('relative flex items-center justify-center', compact ? 'h-28 sm:h-36' : 'h-32 sm:h-48 md:h-52')}>
                {imgOk ? (
                  <motion.img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    onError={() => setImgOk(false)}
                    className="h-full w-full object-cover"
                    whileHover={{ scale: 1.09 }}
                    transition={{ duration: 0.7, ease: [0.22, 0.8, 0.25, 1] }}
                  />
                ) : (
                  <span className="font-display text-3xl text-leaf/40">{product.name[0]}</span>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </Link>

            {/* badges */}
            <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
              {product.discount > 0 && (
                <span className="rounded-full bg-terracotta px-2 py-0.5 text-[.6rem] font-bold uppercase tracking-wide text-white shadow-md sm:px-2.5 sm:py-1 sm:text-[.66rem] sm:tracking-wider">
                  −{product.discount}%
                </span>
              )}
              {product.featured && (
                <span className="rounded-full bg-forest/90 px-2 py-0.5 text-[.6rem] font-bold uppercase tracking-wide text-mint shadow-md sm:px-2.5 sm:py-1 sm:text-[.66rem] sm:tracking-wider">
                  Featured
                </span>
              )}
            </div>

            {/* quick actions */}
            <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100 max-sm:opacity-100 sm:right-3 sm:top-3 sm:gap-2">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => toggleWish(product)}
                aria-label={saved ? 'Remove from saved' : 'Save for later'}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full border shadow-sm backdrop-blur transition-colors sm:h-9 sm:w-9',
                  saved ? 'border-terracotta bg-terracotta text-white' : 'border-line bg-paper/90 text-ink-2 hover:text-terracotta',
                )}
              >
                <HeartIcon size={14} filled={saved} className="sm:hidden" /><HeartIcon size={16} filled={saved} className="max-sm:hidden" />
              </motion.button>
              <Link
                to={`/product/${product.id}`}
                aria-label={`View ${product.name}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-line bg-paper/90 text-ink-2 shadow-sm backdrop-blur transition-colors hover:text-leaf sm:h-9 sm:w-9"
              >
                <EyeIcon size={15} />
              </Link>
            </div>
          </div>

          <div className="relative z-20 flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[.62rem] font-semibold uppercase tracking-[.1em] text-ink-3 sm:text-[.68rem] sm:tracking-[.13em]">{product.brand}</span>
              <span
                className="shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[.58rem] font-semibold sm:px-2 sm:text-[.63rem]"
                style={{ color: sm.color, background: sm.bg }}
              >
                {sm.label}
              </span>
            </div>

            <Link to={`/product/${product.id}`}>
              <h3 className="line-clamp-2 font-display text-[.92rem] leading-snug text-ink transition-colors hover:text-leaf sm:text-[1.06rem]">
                {product.name}
              </h3>
            </Link>

            <div className="flex items-center justify-between gap-2">
              <span className="whitespace-nowrap text-[.7rem] text-ink-3 sm:text-[.76rem]">{product.weight}</span>
              <span className="max-[420px]:hidden"><Stars rating={product.rating} count={product.reviewCount} /></span>
            </div>

            <div className="mt-auto flex items-end justify-between gap-2 pt-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 leading-tight">
                <span className="whitespace-nowrap font-display text-[1.05rem] font-semibold text-forest sm:text-[1.28rem]">{formatNPR(product.price)}</span>
                {product.originalPrice && (
                  <span className="whitespace-nowrap text-[.7rem] text-ink-3 line-through sm:text-[.8rem]">{formatNPR(product.originalPrice)}</span>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: out ? 1 : 1.06 }}
                disabled={out}
                onClick={() => addToCart(product)}
                aria-label={`Add ${product.name} to bag`}
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-md transition-all sm:h-10 sm:w-10',
                  out
                    ? 'cursor-not-allowed bg-ink-3/40'
                    : 'bg-gradient-to-br from-leaf-bright to-forest hover:shadow-glowleaf',
                )}
              >
                {out ? <BagIcon size={17} /> : <PlusIcon size={18} />}
              </motion.button>
            </div>
          </div>
        </SpotlightCard>
      </TiltCard>
    </motion.article>
  )
}

export default memo(ProductCard)
