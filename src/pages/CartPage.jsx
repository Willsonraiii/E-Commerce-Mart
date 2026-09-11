import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Seo from '../components/Seo'
import { Reveal } from '../components/ui/Aceternity'
import { PlusIcon, MinusIcon, TrashIcon, BagIcon, ArrowRight, TruckIcon, ShieldIcon } from '../components/Icons'
import { formatNPR, cn } from '../lib/utils'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const { items, totals, setQty, removeItem, clearCart, FREE_OVER } = useCart()
  const pct = Math.min(100, (totals.subtotal / FREE_OVER) * 100)

  if (items.length === 0) {
    return (
      <>
        <Seo title="Your bag — Yalambar Store" description="Review the items in your bag." path="/cart" />
        <section className="wrap grid min-h-[58vh] place-items-center py-16 text-center">
          <div>
            <motion.div
              animate={{ y: [0, -12, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto grid h-28 w-28 place-items-center rounded-[28px] bg-gradient-to-br from-mint to-cream-2 text-leaf shadow-premium"
            >
              <BagIcon size={46} />
            </motion.div>
            <h1 className="mt-6 font-display text-[2rem] text-forest">Your bag is empty</h1>
            <p className="mx-auto mt-2 max-w-sm text-[.95rem] text-ink-2">
              Nothing in here yet. The shelves are stocked and the vegetables came in this morning.
            </p>
            <Link to="/shop" className="btn btn-primary mt-7">Start shopping <ArrowRight size={17} /></Link>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <Seo title="Your bag — Yalambar Store" description="Review the items in your bag." path="/cart" />

      <section className="wrap py-10">
        <Reveal className="mb-8">
          <nav className="mb-2 flex items-center gap-1.5 text-[.8rem] text-ink-3">
            <Link to="/" className="hover:text-leaf">Home</Link><span>/</span><span className="text-ink-2">Bag</span>
          </nav>
          <h1 className="font-display text-[2.2rem] leading-tight text-forest sm:text-[2.7rem]">Your bag</h1>
          <p className="mt-1.5 text-[.95rem] text-ink-2">
            {totals.count} {totals.count === 1 ? 'item' : 'items'} from the shop
          </p>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            {totals.freeIn > 0 && (
              <div className="mb-5 rounded-2xl border border-line bg-mint/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-[.85rem] font-medium text-forest">
                  <TruckIcon size={16} /> Add <b>{formatNPR(totals.freeIn)}</b> more for free delivery
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-leaf-bright to-gold"
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 110, damping: 20 }} />
                </div>
              </div>
            )}

            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id} layout
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginBottom: -12 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="rounded-[22px] border border-line bg-paper p-3 shadow-premium sm:p-3.5"
                  >
                    {/* Top: art + details. Controls drop to their own row on
                        phones so the product name never gets squeezed. */}
                    <div className="flex gap-3 sm:gap-4">
                      <Link to={`/product/${item.id}`} className="shrink-0">
                        <img src={item.image} alt="" className="h-16 w-16 rounded-xl object-cover sm:h-24 sm:w-24 sm:rounded-2xl" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link to={`/product/${item.id}`} className="line-clamp-2 font-display text-[.98rem] leading-snug text-ink transition-colors hover:text-leaf sm:text-[1.08rem]">
                          {item.name}
                        </Link>
                        <p className="mt-0.5 truncate text-[.76rem] text-ink-3 sm:text-[.8rem]">{item.brand} · {item.weight}</p>
                        <p className="mt-1 text-[.82rem] font-semibold text-forest sm:text-[.85rem]">
                          {formatNPR(item.price)}
                          {item.originalPrice && <span className="ml-1.5 text-[.74rem] font-normal text-ink-3 line-through sm:ml-2 sm:text-[.78rem]">{formatNPR(item.originalPrice)}</span>}
                        </p>
                      </div>

                      {/* Line total sits top-right from tablet up. */}
                      <span className="hidden shrink-0 self-center font-display text-[1.1rem] font-semibold text-forest sm:block sm:min-w-[86px] sm:text-right">
                        {formatNPR(item.price * item.qty)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-line/70 pt-2.5 sm:mt-3 sm:justify-end sm:gap-4 sm:border-0 sm:pt-0">
                      <div className="flex items-center gap-1 rounded-full border border-line bg-cream p-1">
                        <button onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease"
                          className="grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-white sm:h-8 sm:w-8">
                          <MinusIcon size={15} />
                        </button>
                        <span className="min-w-[30px] text-center text-[.92rem] font-semibold tabular-nums">{item.qty}</span>
                        <button onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase"
                          className="grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-white sm:h-8 sm:w-8">
                          <PlusIcon size={15} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-display text-[1.05rem] font-semibold text-forest sm:hidden">
                          {formatNPR(item.price * item.qty)}
                        </span>
                        <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-terracotta/10 hover:text-terracotta">
                          <TrashIcon size={17} />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/shop" className="btn btn-ghost text-[.88rem]">Continue shopping</Link>
              <button onClick={clearCart} className="btn btn-ghost text-[.88rem] !text-terracotta hover:!border-terracotta">
                Empty bag
              </button>
            </div>
          </div>

          <aside className="lg:sticky lg:top-[calc(var(--header)+20px)]">
            <div className="rounded-[24px] border border-line bg-paper p-5 shadow-premium">
              <h2 className="mb-4 font-display text-[1.3rem] text-forest">Order summary</h2>
              <dl className="flex flex-col gap-2.5 text-[.9rem]">
                <div className="flex justify-between"><dt className="text-ink-2">Subtotal ({totals.count})</dt><dd className="font-semibold">{formatNPR(totals.subtotal)}</dd></div>
                {totals.savings > 0 && (
                  <div className="flex justify-between text-leaf"><dt>Discount savings</dt><dd className="font-semibold">−{formatNPR(totals.savings)}</dd></div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-2">Delivery</dt>
                  <dd className={cn('font-semibold', totals.delivery === 0 && 'text-leaf')}>
                    {totals.delivery === 0 ? 'Free' : formatNPR(totals.delivery)}
                  </dd>
                </div>
                <div className="mt-2 flex items-end justify-between border-t border-line pt-3">
                  <dt className="font-display text-[1.1rem] text-forest">Total</dt>
                  <dd className="font-display text-[1.5rem] font-semibold text-forest">{formatNPR(totals.total)}</dd>
                </div>
              </dl>

              <Link to="/checkout" className="btn btn-primary mt-5 w-full py-3.5">
                Proceed to checkout <ArrowRight size={17} />
              </Link>

              <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-[.8rem] text-ink-3">
                <li className="flex items-center gap-2"><ShieldIcon size={15} className="text-leaf" /> Secure checkout, cookie-based session</li>
                <li className="flex items-center gap-2"><TruckIcon size={15} className="text-leaf" /> Delivered in 45–90 minutes</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
