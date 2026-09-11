import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Seo from '../components/Seo'
import ProductCard from '../components/ProductCard'
import { Reveal } from '../components/ui/Aceternity'
import {
  UserIcon, BagIcon, HeartIcon, SettingsIcon, LogoutIcon, ArrowRight,
  TruckIcon, CheckIcon, ChartIcon,
} from '../components/Icons'
import { cn, formatNPR, fullDate, relTime, initials, ORDER_STATUS, tone } from '../lib/utils'
import { fetchMyOrders, fetchProducts } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const TABS = [
  { id: 'overview', label: 'Overview', Icon: ChartIcon },
  { id: 'orders', label: 'Orders', Icon: BagIcon },
  { id: 'saved', label: 'Saved', Icon: HeartIcon },
  { id: 'profile', label: 'Profile', Icon: SettingsIcon },
]

export default function AccountPage() {
  const { user, ready, signOut, saveProfile, isAdmin } = useAuth()
  const { wishlist, notify, addToCart } = useCart()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'overview'

  const [orders, setOrders] = useState([])
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ready && !user) navigate('/login', { replace: true, state: { from: '/account' } })
  }, [ready, user, navigate])

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '', phone: user.phone || '', address: user.address || '',
      city: user.city || '', landmark: user.landmark || '', password: '',
    })
    fetchMyOrders().then((d) => setOrders(d.items || [])).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!wishlist.length) { setSaved([]); return }
    fetchProducts({ limit: 60 })
      .then((d) => setSaved((d.items || []).filter((p) => wishlist.includes(p.id))))
      .catch(() => {})
  }, [wishlist])

  if (!ready || !user || !form) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-line border-t-leaf-bright" />
      </div>
    )
  }

  const spent = orders.reduce((s, o) => s + o.totals.total, 0)
  const setTab = (t) => setParams({ tab: t }, { replace: true })

  const submitProfile = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await saveProfile(form)
      notify('Profile updated')
      setForm({ ...form, password: '' })
    } catch (err) { notify(err.message || 'Could not save.', 'error') } finally { setBusy(false) }
  }

  return (
    <>
      <Seo title="My account — Yalambar Store" description="Your orders, saved items and profile." path="/account" />

      <section className="wrap py-10">
        <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-leaf-bright to-forest font-display text-[1.5rem] font-semibold text-white shadow-premium">
              {initials(user.name)}
            </span>
            <div>
              <h1 className="font-display text-[1.9rem] leading-tight text-forest">{user.name}</h1>
              <p className="text-[.88rem] text-ink-3">{user.email} · Member since {fullDate(user.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Link to="/admin" className="btn btn-ghost text-[.86rem]">
                <ChartIcon size={16} /> Admin panel
              </Link>
            )}
            <button
              onClick={async () => { await signOut(); notify('Signed out'); navigate('/') }}
              className="btn btn-ghost text-[.86rem] !text-terracotta hover:!border-terracotta"
            >
              <LogoutIcon size={16} /> Sign out
            </button>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[230px_1fr] lg:items-start">
          <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-paper p-1.5 no-scrollbar lg:sticky lg:top-[calc(var(--header)+20px)] lg:flex-col lg:overflow-visible">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id} onClick={() => setTab(id)}
                className={cn('relative flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-[.88rem] font-semibold transition-colors lg:w-full',
                  tab === id ? 'text-mint' : 'text-ink-2 hover:bg-mint/60')}
              >
                {tab === id && (
                  <motion.span layoutId="acct-pill" className="absolute inset-0 -z-10 rounded-xl bg-forest"
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }} />
                )}
                <Icon size={17} /> {label}
                {id === 'saved' && wishlist.length > 0 && (
                  <span className={cn('ml-auto rounded-full px-1.5 text-[.7rem]', tab === id ? 'bg-mint/20' : 'bg-cream-2')}>
                    {wishlist.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {tab === 'overview' && (
                  <div className="flex flex-col gap-5">
                    <div className="grid gap-3.5 sm:grid-cols-3">
                      {[
                        { l: 'Orders placed', v: orders.length, Icon: BagIcon, t: 'leaf' },
                        { l: 'Total spent', v: formatNPR(spent), Icon: ChartIcon, t: 'gold' },
                        { l: 'Saved items', v: wishlist.length, Icon: HeartIcon, t: 'coral' },
                      ].map(({ l, v, Icon, t }) => {
                        const c = tone(t)
                        return (
                          <div key={l} className="relative overflow-hidden rounded-[22px] border border-line bg-paper p-5 shadow-premium">
                            <span aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-15 blur-xl" style={{ background: c.to }} />
                            <span className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm"
                              style={{ background: `linear-gradient(135deg,${c.from},${c.to})` }}>
                              <Icon size={19} />
                            </span>
                            <p className="mt-3 font-display text-[1.7rem] font-semibold leading-none text-forest">{v}</p>
                            <p className="mt-1 text-[.8rem] text-ink-3">{l}</p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="rounded-[24px] border border-line bg-paper p-5 shadow-premium">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display text-[1.25rem] text-forest">Recent orders</h2>
                        {orders.length > 0 && (
                          <button onClick={() => setTab('orders')} className="text-[.83rem] font-semibold text-leaf hover:underline">See all</button>
                        )}
                      </div>
                      {loading ? (
                        <div className="h-24 animate-pulse rounded-xl bg-cream-2/70" />
                      ) : orders.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-[.92rem] text-ink-2">No orders yet.</p>
                          <Link to="/shop" className="btn btn-primary mt-4 text-[.86rem]">Start shopping <ArrowRight size={15} /></Link>
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-2.5">
                          {orders.slice(0, 3).map((o) => {
                            const st = ORDER_STATUS[o.status] || ORDER_STATUS.confirmed
                            return (
                              <li key={o.id}>
                                <Link to={`/order/${o.id}`} className="flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-leaf-bright hover:bg-mint/40">
                                  <span className="flex -space-x-3">
                                    {o.items.slice(0, 3).map((i) => (
                                      <img key={i.id} src={i.image} alt="" className="h-10 w-10 rounded-xl border-2 border-paper object-cover" />
                                    ))}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[.88rem] font-semibold text-ink">#{o.id}</span>
                                    <span className="text-[.78rem] text-ink-3">{relTime(o.createdAt)} · {o.totals.count} items</span>
                                  </span>
                                  <span className="rounded-full bg-mint px-2.5 py-1 text-[.72rem] font-semibold text-forest">{st.label}</span>
                                  <span className="font-display text-[1rem] font-semibold text-forest">{formatNPR(o.totals.total)}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-[24px] border border-line bg-gradient-to-br from-forest to-forest-mid p-6 text-mint shadow-premium">
                      <h2 className="font-display text-[1.3rem] text-paper">Delivery address on file</h2>
                      <p className="mt-1.5 text-[.9rem] text-mint/70">
                        {user.address ? `${user.address}${user.landmark ? ` · ${user.landmark}` : ''}, ${user.city}` : 'No address saved yet.'}
                      </p>
                      <button onClick={() => setTab('profile')} className="btn mt-4 bg-mint/15 px-5 py-2.5 text-[.86rem] text-mint hover:bg-mint/25">
                        {user.address ? 'Update address' : 'Add address'}
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'orders' && (
                  <div className="flex flex-col gap-3.5">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-[24px] bg-cream-2/70" />)
                    ) : orders.length === 0 ? (
                      <div className="rounded-[26px] border border-dashed border-line bg-paper py-16 text-center">
                        <BagIcon size={40} className="mx-auto text-line" />
                        <p className="mt-3 font-display text-xl text-forest">No orders yet</p>
                        <p className="mt-1 text-[.9rem] text-ink-3">Your first delivery is a few taps away.</p>
                        <Link to="/shop" className="btn btn-primary mt-5 text-[.88rem]">Browse the shop</Link>
                      </div>
                    ) : orders.map((o) => {
                      const st = ORDER_STATUS[o.status] || ORDER_STATUS.confirmed
                      return (
                        <div key={o.id} className="rounded-[24px] border border-line bg-paper p-5 shadow-premium">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                            <div>
                              <p className="font-display text-[1.1rem] text-forest">#{o.id}</p>
                              <p className="text-[.78rem] text-ink-3">{fullDate(o.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-[.78rem] font-semibold text-forest">
                                {o.status === 'delivered' ? <CheckIcon size={13} /> : <TruckIcon size={13} />} {st.label}
                              </span>
                              <span className="font-display text-[1.15rem] font-semibold text-forest">{formatNPR(o.totals.total)}</span>
                            </div>
                          </div>
                          <ul className="flex flex-wrap gap-2">
                            {o.items.map((i) => (
                              <li key={i.id} className="flex items-center gap-2 rounded-xl bg-cream/70 py-1.5 pl-1.5 pr-3">
                                <img src={i.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                                <span className="text-[.8rem] text-ink-2">{i.name} <b className="text-ink">×{i.qty}</b></span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3.5 flex gap-2">
                            <Link to={`/order/${o.id}`} className="btn btn-ghost px-4 py-2 text-[.83rem]">Track order</Link>
                            <button
                              onClick={() => { o.items.forEach((i) => addToCart({ ...i, id: i.id, price: i.price }, i.qty)); }}
                              className="btn btn-ghost px-4 py-2 text-[.83rem]"
                            >
                              Reorder
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {tab === 'saved' && (
                  saved.length === 0 ? (
                    <div className="rounded-[26px] border border-dashed border-line bg-paper py-16 text-center">
                      <HeartIcon size={40} className="mx-auto text-line" />
                      <p className="mt-3 font-display text-xl text-forest">Nothing saved yet</p>
                      <p className="mt-1 text-[.9rem] text-ink-3">Tap the heart on any product to keep it here.</p>
                      <Link to="/shop" className="btn btn-primary mt-5 text-[.88rem]">Browse the shop</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {saved.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                    </div>
                  )
                )}

                {tab === 'profile' && (
                  <form onSubmit={submitProfile} className="rounded-[24px] border border-line bg-paper p-5 shadow-premium sm:p-6">
                    <h2 className="mb-1 font-display text-[1.35rem] text-forest">Profile & delivery</h2>
                    <p className="mb-5 text-[.88rem] text-ink-3">Used to autofill checkout. Email can't be changed.</p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[.82rem] font-medium text-ink-2">Full name</span>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[.82rem] font-medium text-ink-2">Phone</span>
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" />
                      </label>
                      <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-[.82rem] font-medium text-ink-2">Email (locked)</span>
                        <input value={user.email} disabled className="field cursor-not-allowed opacity-60" />
                      </label>
                      <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-[.82rem] font-medium text-ink-2">Street address</span>
                        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[.82rem] font-medium text-ink-2">Area</span>
                        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[.82rem] font-medium text-ink-2">Landmark</span>
                        <input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className="field" />
                      </label>
                      <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-[.82rem] font-medium text-ink-2">New password (leave blank to keep)</span>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="At least 6 characters" className="field" />
                      </label>
                    </div>

                    <button disabled={busy} className="btn btn-primary mt-5 px-6 py-3 disabled:opacity-60">
                      {busy ? 'Saving…' : 'Save changes'}
                    </button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  )
}
