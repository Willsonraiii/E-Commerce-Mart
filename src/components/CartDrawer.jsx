import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CloseIcon, PlusIcon, MinusIcon, TrashIcon, BagIcon, TruckIcon, ArrowRight } from './Icons'
import { formatNPR, cn } from '../lib/utils'
import { useCart } from '../context/CartContext'

export default function CartDrawer() {
  const { items, totals, cartOpen, setCartOpen, setQty, removeItem, clearCart, FREE_OVER } = useCart()
  const pct = Math.min(100, (totals.subtotal / FREE_OVER) * 100)

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-[85]">
          <motion.div
            className="absolute inset-0 bg-forest-deep/55 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Your bag"
            className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-paper shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="font-display text-xl text-forest">Your bag</h2>
                <p className="text-[.78rem] text-ink-3">{totals.count} {totals.count === 1 ? 'item' : 'items'}</p>
              </div>
              <button onClick={() => setCartOpen(false)} aria-label="Close bag"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:bg-mint">
                <CloseIcon size={18} />
              </button>
            </header>

            {items.length > 0 && (
              <div className="border-b border-line bg-mint/40 px-5 py-3">
                <div className="mb-1.5 flex items-center gap-2 text-[.76rem] font-medium text-forest">
                  <TruckIcon size={15} />
                  {totals.freeIn > 0
                    ? <span>Add <b>{formatNPR(totals.freeIn)}</b> for free delivery</span>
                    : <span>Free delivery unlocked 🎉</span>}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-leaf-bright to-gold"
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-mint to-cream-2 text-leaf"
                  >
                    <BagIcon size={40} />
                  </motion.div>
                  <div>
                    <h3 className="font-display text-lg text-forest">Your bag is empty</h3>
                    <p className="mt-1 text-[.85rem] text-ink-3">Add a few things from the racks.</p>
                  </div>
                  <Link to="/shop" onClick={() => setCartOpen(false)} className="btn btn-primary text-sm">
                    Start shopping <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 26 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, marginBottom: -12 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className="flex gap-3 rounded-2xl border border-line bg-white/70 p-2.5"
                      >
                        <Link to={`/product/${item.id}`} onClick={() => setCartOpen(false)} className="shrink-0">
                          <img src={item.image} alt="" className="h-[70px] w-[70px] rounded-xl object-cover" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link to={`/product/${item.id}`} onClick={() => setCartOpen(false)}
                                className="block truncate text-[.9rem] font-semibold text-ink hover:text-leaf">
                                {item.name}
                              </Link>
                              <span className="text-[.72rem] text-ink-3">{item.brand} · {item.weight}</span>
                            </div>
                            <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}
                              className="shrink-0 text-ink-3 transition-colors hover:text-terracotta">
                              <TrashIcon size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 rounded-full border border-line bg-cream p-0.5">
                              <button onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease"
                                className="grid h-7 w-7 place-items-center rounded-full text-ink-2 transition-colors hover:bg-white">
                                <MinusIcon size={14} />
                              </button>
                              <span className="min-w-[22px] text-center text-[.85rem] font-semibold tabular-nums">{item.qty}</span>
                              <button onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase"
                                className="grid h-7 w-7 place-items-center rounded-full text-ink-2 transition-colors hover:bg-white">
                                <PlusIcon size={14} />
                              </button>
                            </div>
                            <span className="font-display text-[.98rem] font-semibold text-forest">
                              {formatNPR(item.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-line bg-cream/60 px-5 py-4">
                <dl className="mb-3 flex flex-col gap-1.5 text-[.86rem]">
                  <div className="flex justify-between"><dt className="text-ink-2">Subtotal</dt><dd className="font-semibold">{formatNPR(totals.subtotal)}</dd></div>
                  {totals.savings > 0 && (
                    <div className="flex justify-between text-leaf"><dt>You save</dt><dd className="font-semibold">−{formatNPR(totals.savings)}</dd></div>
                  )}
                  <div className="flex justify-between"><dt className="text-ink-2">Delivery</dt>
                    <dd className={cn('font-semibold', totals.delivery === 0 && 'text-leaf')}>
                      {totals.delivery === 0 ? 'Free' : formatNPR(totals.delivery)}
                    </dd>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-line pt-2">
                    <dt className="font-display text-[1.05rem] text-forest">Total</dt>
                    <dd className="font-display text-[1.18rem] font-semibold text-forest">{formatNPR(totals.total)}</dd>
                  </div>
                </dl>
                <div className="flex gap-2">
                  <button onClick={clearCart} className="btn btn-ghost flex-1 text-[.85rem]">Clear</button>
                  <Link to="/checkout" onClick={() => setCartOpen(false)} className="btn btn-primary flex-[2] text-[.9rem]">
                    Checkout <ArrowRight size={16} />
                  </Link>
                </div>
                <Link to="/cart" onClick={() => setCartOpen(false)}
                  className="mt-2 block text-center text-[.8rem] text-ink-3 underline-offset-2 hover:text-leaf hover:underline">
                  View full bag
                </Link>
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
