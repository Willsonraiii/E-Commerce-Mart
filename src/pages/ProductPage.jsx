import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { Reveal, TiltCard, ShimmerBadge } from '../components/ui/Aceternity'
import {
  ArrowLeft, ArrowRight, BagIcon, HeartIcon, PlusIcon, MinusIcon, StarIcon,
  TruckIcon, ShieldIcon, LeafIcon, CubeIcon, EyeIcon, CheckIcon,
} from '../components/Icons'
import { cn, formatNPR, stockMeta, relTime } from '../lib/utils'
import { fetchProduct, postReview } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import useMediaQuery from '../hooks/useMediaQuery'

const ProductViewer3D = lazy(() => import('../components/three/ProductViewer3D'))

function Loading() {
  return (
    <div className="wrap grid gap-8 py-12 lg:grid-cols-2">
      <div className="h-[440px] animate-pulse rounded-[28px] bg-cream-2/70" />
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 animate-pulse rounded-lg bg-cream-2/70" style={{ width: `${90 - i * 12}%` }} />
        ))}
      </div>
    </div>
  )
}

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleWish, wishlist, setCartOpen } = useCart()
  const { user } = useAuth()
  const mobile = useMediaQuery('(max-width: 768px)')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [view, setView] = useState('photo')
  const [tab, setTab] = useState('about')
  const [posting, setPosting] = useState(false)
  const [form, setForm] = useState({ rating: 5, body: '' })

  useEffect(() => {
    setLoading(true); setQty(1); setView('photo'); setTab('about')
    window.scrollTo({ top: 0 })
    fetchProduct(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loading />

  if (!data?.product) {
    return (
      <section className="wrap py-24 text-center">
        <h1 className="font-display text-3xl text-forest">We don't stock that one</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-2">The shelf label may have changed. Try the shop page.</p>
        <Link to="/shop" className="btn btn-primary mt-6">Back to shop</Link>
      </section>
    )
  }

  const { product: p, related, reviews } = data
  const sm = stockMeta[p.stock] || stockMeta.in
  const out = p.stock === 'out'
  const saved = wishlist.includes(p.id)
  const savings = p.originalPrice ? (p.originalPrice - p.price) * qty : 0

  const submitReview = async (e) => {
    e.preventDefault()
    setPosting(true)
    try {
      const d = await postReview(p.id, { rating: form.rating, body: form.body, author: user?.name || 'Neighbour' })
      setData((prev) => ({ ...prev, reviews: d.reviews }))
      setForm({ rating: 5, body: '' })
    } catch { /* ignore */ } finally { setPosting(false) }
  }

  return (
    <>
      <Seo
        title={`${p.name} — Yalambar Store`}
        description={p.description}
        path={`/product/${p.id}`}
        image={p.image}
        jsonLd={{
          '@context': 'https://schema.org', '@type': 'Product',
          name: p.name, image: p.image, description: p.description, brand: { '@type': 'Brand', name: p.brand },
          offers: {
            '@type': 'Offer', price: p.price, priceCurrency: 'NPR',
            availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          },
        }}
      />

      <div className="wrap pt-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[.85rem] text-ink-3 transition-colors hover:text-leaf">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <section className="wrap grid gap-10 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* visual */}
        <div>
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-mint/60 to-cream shadow-premium">
            <div className="absolute left-4 top-4 z-20 flex gap-1.5 rounded-full border border-line bg-paper/90 p-1 backdrop-blur">
              <button
                onClick={() => setView('photo')}
                className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[.78rem] font-semibold transition-colors',
                  view === 'photo' ? 'bg-forest text-mint' : 'text-ink-2 hover:text-forest')}
              >
                <EyeIcon size={14} /> Photo
              </button>
              <button
                onClick={() => setView('3d')}
                className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[.78rem] font-semibold transition-colors',
                  view === '3d' ? 'bg-forest text-mint' : 'text-ink-2 hover:text-forest')}
              >
                <CubeIcon size={14} /> 3D
              </button>
            </div>

            {p.discount > 0 && (
              <span className="absolute right-4 top-4 z-20 rounded-full bg-terracotta px-3 py-1.5 text-[.75rem] font-bold text-white shadow-md">
                −{p.discount}% off
              </span>
            )}

            <div className="relative h-[360px] sm:h-[460px]">
              <AnimatePresence mode="wait">
                {view === 'photo' ? (
                  <motion.div
                    key="photo" className="h-full"
                    initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                  >
                    <TiltCard max={8} scale={1.03} className="h-full">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    </TiltCard>
                  </motion.div>
                ) : (
                  <motion.div
                    key="3d" className="h-full"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Suspense fallback={
                      <div className="grid h-full place-items-center text-ink-3">
                        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-leaf" />
                      </div>
                    }>
                      <ProductViewer3D product={p} className="h-full w-full" />
                    </Suspense>
                    <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-forest/85 px-3 py-1.5 text-[.72rem] text-mint backdrop-blur">
                      Drag to rotate · scroll to zoom
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-3">
            {[
              { Icon: TruckIcon, t: 'Same-day', s: '45–90 min' },
              { Icon: LeafIcon, t: 'Fresh stock', s: 'Checked daily' },
              { Icon: ShieldIcon, t: 'Money back', s: 'No questions' },
            ].map(({ Icon, t, s }) => (
              <li key={t} className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-paper p-3 text-center">
                <Icon size={19} className="text-leaf" />
                <span className="text-[.8rem] font-semibold text-ink">{t}</span>
                <span className="text-[.7rem] text-ink-3">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* details */}
        <div>
          <Reveal>
            <nav className="mb-3 flex items-center gap-1.5 text-[.8rem] text-ink-3">
              <Link to="/" className="hover:text-leaf">Home</Link><span>/</span>
              <Link to={`/shop?category=${p.category}`} className="hover:text-leaf capitalize">{p.category}</Link>
            </nav>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cream-2 px-2.5 py-1 text-[.72rem] font-semibold uppercase tracking-wider text-ink-2">{p.brand}</span>
              <span className="rounded-full px-2.5 py-1 text-[.72rem] font-semibold" style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
              {p.featured && <ShimmerBadge className="!py-1 !text-[.68rem]">Neighborhood favourite</ShimmerBadge>}
            </div>

            <h1 className="font-display text-[2.1rem] leading-tight text-forest sm:text-[2.6rem]">{p.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1 text-gold">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon key={i} size={16} filled={i <= Math.round(p.rating || 0)} className={i <= Math.round(p.rating || 0) ? '' : 'text-line'} />
                ))}
                <span className="ml-1 text-[.82rem] font-medium text-ink-2">
                  {p.rating ? `${p.rating} · ${p.reviewCount} reviews` : 'No reviews yet'}
                </span>
              </span>
              <span className="text-[.82rem] text-ink-3">{p.weight}</span>
            </div>

            <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">{p.description}</p>
            {p.note && <p className="mt-2 inline-block rounded-lg bg-mint/70 px-3 py-1.5 text-[.85rem] font-medium text-forest">{p.note}</p>}

            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-[2.4rem] font-semibold leading-none text-forest">{formatNPR(p.price)}</span>
              {p.originalPrice && (
                <span className="mb-1 text-[1.05rem] text-ink-3 line-through">{formatNPR(p.originalPrice)}</span>
              )}
              {savings > 0 && (
                <span className="mb-1.5 rounded-full bg-leaf/12 px-2.5 py-1 text-[.78rem] font-bold text-leaf">
                  Save {formatNPR(savings)}
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-full border border-line bg-paper p-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity"
                  className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-mint">
                  <MinusIcon size={16} />
                </button>
                <span className="min-w-[36px] text-center font-display text-[1.1rem] font-semibold tabular-nums">{qty}</span>
                <button onClick={() => setQty(Math.min(20, qty + 1))} aria-label="Increase quantity"
                  className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-mint">
                  <PlusIcon size={16} />
                </button>
              </div>

              <motion.button
                whileHover={{ scale: out ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                disabled={out}
                onClick={() => { addToCart(p, qty); setCartOpen(true) }}
                className={cn('btn flex-1 px-7 py-3.5 text-[.98rem]',
                  out ? 'cursor-not-allowed bg-ink-3/30 text-ink-3' : 'btn-primary')}
              >
                <BagIcon size={18} /> {out ? 'Out of stock' : `Add ${qty > 1 ? `${qty} ` : ''}to bag`}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }} onClick={() => toggleWish(p)}
                aria-label={saved ? 'Remove from saved' : 'Save for later'}
                className={cn('grid h-[52px] w-[52px] place-items-center rounded-full border transition-colors',
                  saved ? 'border-terracotta bg-terracotta text-white' : 'border-line bg-paper text-ink-2 hover:border-terracotta hover:text-terracotta')}
              >
                <HeartIcon size={20} filled={saved} />
              </motion.button>
            </div>

            {!out && (
              <Link to="/checkout" onClick={() => addToCart(p, qty)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-forest py-3 text-[.9rem] font-semibold text-forest transition-colors hover:bg-forest hover:text-mint">
                Buy now <ArrowRight size={16} />
              </Link>
            )}

            {/* tabs */}
            <div className="mt-9">
              <div className="flex gap-1 border-b border-line">
                {[['about', 'Details'], ['reviews', `Reviews (${reviews.length})`], ['delivery', 'Delivery']].map(([k, label]) => (
                  <button
                    key={k} onClick={() => setTab(k)}
                    className={cn('relative px-4 py-2.5 text-[.88rem] font-semibold transition-colors',
                      tab === k ? 'text-forest' : 'text-ink-3 hover:text-ink-2')}
                  >
                    {label}
                    {tab === k && <motion.span layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-leaf-bright" />}
                  </button>
                ))}
              </div>

              <div className="pt-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.24 }}
                  >
                    {tab === 'about' && (
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[.9rem]">
                        {[
                          ['Brand', p.brand], ['Size', p.weight],
                          ['Aisle', p.category], ['Availability', sm.label],
                          ['Item code', p.id.toUpperCase()], ['Added', relTime(p.createdAt)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3 border-b border-line/70 pb-2">
                            <dt className="text-ink-3">{k}</dt>
                            <dd className="text-right font-medium capitalize text-ink">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    {tab === 'reviews' && (
                      <div className="flex flex-col gap-4">
                        {reviews.length === 0 && <p className="text-[.9rem] text-ink-3">No reviews yet — be the first.</p>}
                        {reviews.map((r) => (
                          <div key={r.id} className="rounded-2xl border border-line bg-paper p-4">
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                              <span className="text-[.9rem] font-semibold text-ink">{r.author}</span>
                              <span className="text-[.75rem] text-ink-3">{relTime(r.createdAt)}</span>
                            </div>
                            <span className="mb-2 inline-flex gap-0.5 text-gold">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <StarIcon key={i} size={13} filled={i <= r.rating} className={i <= r.rating ? '' : 'text-line'} />
                              ))}
                            </span>
                            <p className="text-[.88rem] leading-relaxed text-ink-2">{r.body}</p>
                          </div>
                        ))}

                        <form onSubmit={submitReview} className="rounded-2xl border border-dashed border-line bg-cream/50 p-4">
                          <p className="mb-2 text-[.85rem] font-semibold text-forest">Leave a review</p>
                          <div className="mb-2 flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <button key={i} type="button" onClick={() => setForm({ ...form, rating: i })} aria-label={`${i} stars`}>
                                <StarIcon size={20} filled={i <= form.rating} className={i <= form.rating ? 'text-gold' : 'text-line'} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                            rows={3} required placeholder="How was it?" className="field resize-none text-[.88rem]"
                          />
                          <button disabled={posting} className="btn btn-primary mt-2.5 px-5 py-2 text-[.85rem] disabled:opacity-60">
                            {posting ? 'Posting…' : 'Post review'}
                          </button>
                        </form>
                      </div>
                    )}

                    {tab === 'delivery' && (
                      <ul className="flex flex-col gap-3 text-[.9rem] text-ink-2">
                        {[
                          'Delivered across New Baneshwor, Sankhamul, Tinkune and Koteshwor.',
                          'Rs. 60 delivery — free on orders over Rs. 1,500.',
                          'Same-day: order before 8 PM and it arrives in 45–90 minutes.',
                          'Cash on delivery, eSewa, Khalti and FonePay QR all accepted.',
                          'Not right? Hand it back to the rider — full refund, no questions.',
                        ].map((t) => (
                          <li key={t} className="flex items-start gap-2.5">
                            <CheckIcon size={17} className="mt-0.5 shrink-0 text-leaf" /> {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {related?.length > 0 && (
        <section className="wrap py-14">
          <Reveal className="mb-7 flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Same aisle</span>
              <h2 className="mt-1.5 font-display text-[1.7rem] text-forest sm:text-[2.1rem]">You might also need</h2>
            </div>
            <Link to={`/shop?category=${p.category}`} className="btn btn-ghost text-[.85rem]">
              All {p.category} <ArrowRight size={15} />
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((r, i) => <ProductCard key={r.id} product={r} index={i} />)}
          </div>
        </section>
      )}
    </>
  )
}
