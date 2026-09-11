import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Seo from '../components/Seo'
import { Reveal } from '../components/ui/Aceternity'
import { ArrowRight, ArrowLeft, CheckIcon, TruckIcon, ShieldIcon, PinIcon, BagIcon } from '../components/Icons'
import { cn, formatNPR, PAYMENTS } from '../lib/utils'
import { createOrder } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const AREAS = ['New Baneshwor', 'Mid Baneshwor', 'Sankhamul', 'Tinkune', 'Koteshwor', 'Old Baneshwor']

export default function CheckoutPage() {
  const { items, totals, clearCart, notify } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', landmark: '', city: 'New Baneshwor',
    notes: '', payment: 'cod',
  })

  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      name: f.name || user.name || '',
      phone: f.phone || user.phone || '',
      email: f.email || user.email || '',
      address: f.address || user.address || '',
      landmark: f.landmark || user.landmark || '',
      city: user.city || f.city,
    }))
  }, [user])

  useEffect(() => {
    if (items.length === 0 && !busy) navigate('/cart', { replace: true })
  }, [items.length, busy, navigate])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const validStep1 =
    form.name.trim().length > 1 &&
    /^[\d+\-\s()]{7,}$/.test(form.phone) &&
    form.address.trim().length > 3

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const d = await createOrder({
        customer: {
          name: form.name, phone: form.phone, email: form.email,
          address: form.address, landmark: form.landmark, city: form.city,
        },
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        paymentMethod: form.payment,
        notes: form.notes,
      })
      clearCart()
      notify('Order confirmed — thank you!')
      navigate(`/order/${d.order.id}`, { state: { order: d.order } })
    } catch (err) {
      setError(err.message || 'We could not place that order.')
      setBusy(false)
    }
  }

  const STEPS = [
    { n: 1, label: 'Delivery' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Review' },
  ]

  return (
    <>
      <Seo title="Checkout — Yalambar Store" description="Complete your order." path="/checkout" />

      <section className="wrap py-10">
        <Reveal className="mb-7">
          <nav className="mb-2 flex items-center gap-1.5 text-[.8rem] text-ink-3">
            <Link to="/cart" className="hover:text-leaf">Bag</Link><span>/</span><span className="text-ink-2">Checkout</span>
          </nav>
          <h1 className="font-display text-[2.2rem] leading-tight text-forest sm:text-[2.7rem]">Checkout</h1>
        </Reveal>

        {/* stepper */}
        <ol className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s.n} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => s.n < step && setStep(s.n)}
                disabled={s.n > step}
                className={cn('flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[.85rem] font-semibold transition-colors',
                  step === s.n ? 'bg-forest text-mint' : step > s.n ? 'bg-mint text-forest' : 'text-ink-3')}
              >
                <span className={cn('grid h-7 w-7 place-items-center rounded-full text-[.78rem]',
                  step === s.n ? 'bg-mint text-forest' : step > s.n ? 'bg-leaf-bright text-white' : 'bg-cream-2 text-ink-3')}>
                  {step > s.n ? <CheckIcon size={14} /> : s.n}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={cn('h-px flex-1 transition-colors', step > s.n ? 'bg-leaf-bright' : 'bg-line')} />
              )}
            </li>
          ))}
        </ol>

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="flex flex-col gap-5">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-terracotta/30 bg-terracotta/8 px-4 py-3 text-[.88rem] text-terracotta-deep"
              >
                {error}
              </motion.p>
            )}

            {/* step 1 */}
            {step === 1 && (
              <motion.fieldset
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-line bg-paper p-5 shadow-premium sm:p-6"
              >
                <legend className="mb-4 flex items-center gap-2 font-display text-[1.3rem] text-forest">
                  <PinIcon size={19} className="text-leaf" /> Where should we bring it?
                </legend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[.82rem] font-medium text-ink-2">Full name *</span>
                    <input required value={form.name} onChange={set('name')} placeholder="Sita Gurung" className="field" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[.82rem] font-medium text-ink-2">Phone *</span>
                    <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+977 98…" className="field" />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-[.82rem] font-medium text-ink-2">Email (for the receipt)</span>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" className="field" />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-[.82rem] font-medium text-ink-2">Street address *</span>
                    <input required value={form.address} onChange={set('address')} placeholder="Sankhamul Road, house 12, flat 4B" className="field" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[.82rem] font-medium text-ink-2">Area</span>
                    <select value={form.city} onChange={set('city')} className="field cursor-pointer">
                      {AREAS.map((a) => <option key={a}>{a}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[.82rem] font-medium text-ink-2">Landmark</span>
                    <input value={form.landmark} onChange={set('landmark')} placeholder="Behind the school" className="field" />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-[.82rem] font-medium text-ink-2">Note for the rider</span>
                    <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Call when you reach the gate" className="field resize-none" />
                  </label>
                </div>

                <button
                  type="button" disabled={!validStep1} onClick={() => setStep(2)}
                  className="btn btn-primary mt-5 w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to payment <ArrowRight size={17} />
                </button>
                {!user && (
                  <p className="mt-3 text-center text-[.82rem] text-ink-3">
                    Have an account? <Link to="/login" className="font-semibold text-leaf hover:underline">Sign in</Link> to autofill this.
                  </p>
                )}
              </motion.fieldset>
            )}

            {/* step 2 */}
            {step === 2 && (
              <motion.fieldset
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-line bg-paper p-5 shadow-premium sm:p-6"
              >
                <legend className="mb-4 flex items-center gap-2 font-display text-[1.3rem] text-forest">
                  <ShieldIcon size={19} className="text-leaf" /> How would you like to pay?
                </legend>

                <div className="grid gap-2.5">
                  {PAYMENTS.map((pm) => (
                    <label
                      key={pm.id}
                      className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all',
                        form.payment === pm.id ? 'border-leaf-bright bg-mint/50 shadow-sm' : 'border-line bg-white hover:border-leaf-bright/50')}
                    >
                      <input
                        type="radio" name="payment" value={pm.id} checked={form.payment === pm.id}
                        onChange={set('payment')} className="mt-1 h-4 w-4 accent-[#2f6b47]"
                      />
                      <span>
                        <span className="block text-[.95rem] font-semibold text-ink">{pm.label}</span>
                        <span className="block text-[.82rem] text-ink-3">{pm.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn btn-ghost px-5">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="btn btn-primary flex-1 py-3.5">
                    Review order <ArrowRight size={17} />
                  </button>
                </div>
              </motion.fieldset>
            )}

            {/* step 3 */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                <div className="rounded-[24px] border border-line bg-paper p-5 shadow-premium sm:p-6">
                  <h2 className="mb-4 font-display text-[1.3rem] text-forest">Check it over</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-cream/70 p-4">
                      <p className="mb-1 text-[.72rem] font-bold uppercase tracking-wider text-ink-3">Delivering to</p>
                      <p className="text-[.9rem] font-semibold text-ink">{form.name}</p>
                      <p className="text-[.85rem] text-ink-2">{form.phone}</p>
                      <p className="mt-1 text-[.85rem] text-ink-2">{form.address}</p>
                      <p className="text-[.85rem] text-ink-2">{[form.landmark, form.city].filter(Boolean).join(' · ')}</p>
                      <button type="button" onClick={() => setStep(1)} className="mt-2 text-[.8rem] font-semibold text-leaf hover:underline">Edit</button>
                    </div>
                    <div className="rounded-2xl bg-cream/70 p-4">
                      <p className="mb-1 text-[.72rem] font-bold uppercase tracking-wider text-ink-3">Paying with</p>
                      <p className="text-[.9rem] font-semibold text-ink">{PAYMENTS.find((x) => x.id === form.payment)?.label}</p>
                      <p className="text-[.85rem] text-ink-2">{PAYMENTS.find((x) => x.id === form.payment)?.hint}</p>
                      {form.notes && <p className="mt-2 text-[.82rem] italic text-ink-3">“{form.notes}”</p>}
                      <button type="button" onClick={() => setStep(2)} className="mt-2 text-[.8rem] font-semibold text-leaf hover:underline">Edit</button>
                    </div>
                  </div>

                  <ul className="mt-4 flex flex-col divide-y divide-line">
                    {items.map((i) => (
                      <li key={i.id} className="flex items-center gap-3 py-2.5">
                        <img src={i.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[.88rem] font-medium text-ink">{i.name}</span>
                          <span className="text-[.76rem] text-ink-3">{i.qty} × {formatNPR(i.price)}</span>
                        </span>
                        <span className="font-display text-[.95rem] font-semibold text-forest">{formatNPR(i.price * i.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn btn-ghost px-5">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <motion.button
                    whileHover={{ scale: busy ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}
                    disabled={busy} type="submit"
                    className="btn btn-primary flex-1 py-4 text-[1rem] disabled:opacity-70"
                  >
                    {busy ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-mint/40 border-t-mint" /> Placing order…</>
                    ) : (
                      <>Place order · {formatNPR(totals.total)}</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* summary */}
          <aside className="lg:sticky lg:top-[calc(var(--header)+20px)]">
            <div className="rounded-[24px] border border-line bg-paper p-5 shadow-premium">
              <h2 className="mb-4 flex items-center gap-2 font-display text-[1.2rem] text-forest">
                <BagIcon size={18} /> {totals.count} items
              </h2>
              <ul className="mb-4 flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-2.5">
                    <span className="relative shrink-0">
                      <img src={i.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
                      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-forest text-[.62rem] font-bold text-mint">{i.qty}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[.83rem] text-ink-2">{i.name}</span>
                    <span className="text-[.83rem] font-semibold text-forest">{formatNPR(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <dl className="flex flex-col gap-2 border-t border-line pt-3 text-[.88rem]">
                <div className="flex justify-between"><dt className="text-ink-2">Subtotal</dt><dd className="font-semibold">{formatNPR(totals.subtotal)}</dd></div>
                {totals.savings > 0 && <div className="flex justify-between text-leaf"><dt>Savings</dt><dd className="font-semibold">−{formatNPR(totals.savings)}</dd></div>}
                <div className="flex justify-between">
                  <dt className="text-ink-2">Delivery</dt>
                  <dd className={cn('font-semibold', totals.delivery === 0 && 'text-leaf')}>{totals.delivery === 0 ? 'Free' : formatNPR(totals.delivery)}</dd>
                </div>
                <div className="mt-1.5 flex items-end justify-between border-t border-line pt-2.5">
                  <dt className="font-display text-[1.05rem] text-forest">Total</dt>
                  <dd className="font-display text-[1.4rem] font-semibold text-forest">{formatNPR(totals.total)}</dd>
                </div>
              </dl>
              <p className="mt-3 flex items-center gap-1.5 text-[.78rem] text-ink-3">
                <TruckIcon size={14} className="text-leaf" /> Arrives today, 45–90 minutes
              </p>
            </div>
          </aside>
        </form>
      </section>
    </>
  )
}
