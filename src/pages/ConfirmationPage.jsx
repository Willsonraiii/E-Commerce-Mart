import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Seo from '../components/Seo'
import { Reveal } from '../components/ui/Aceternity'
import { CheckIcon, TruckIcon, PinIcon, ArrowRight, ClockIcon, BagIcon } from '../components/Icons'
import { formatNPR, fullDate, ORDER_STATUS, PAYMENTS, cn } from '../lib/utils'
import { fetchOrder } from '../lib/api'

const STEPS = [
  { k: 'confirmed', label: 'Order confirmed', copy: 'We got it at the counter' },
  { k: 'packing', label: 'Packing your bag', copy: 'Picking from the racks' },
  { k: 'out-for-delivery', label: 'On the way', copy: 'Rider heading to you' },
  { k: 'delivered', label: 'Delivered', copy: 'Enjoy — thank you!' },
]

function Confetti() {
  const bits = Array.from({ length: 26 }, (_, i) => i)
  const colors = ['#3d8a58', '#c4962a', '#c45d2c', '#4fd18b', '#f0b429']
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
      {bits.map((i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-sm"
          style={{ left: `${(i * 3.8) % 100}%`, background: colors[i % colors.length] }}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{ y: 280, opacity: [0, 1, 1, 0], rotate: 360 + i * 20 }}
          transition={{ duration: 2.6 + (i % 5) * 0.4, delay: (i % 8) * 0.12, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

export default function ConfirmationPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const [order, setOrder] = useState(state?.order || null)
  const [loading, setLoading] = useState(!state?.order)

  useEffect(() => {
    if (state?.order) return
    setLoading(true)
    fetchOrder(id).then((d) => setOrder(d.order)).catch(() => setOrder(null)).finally(() => setLoading(false))
  }, [id, state])

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-line border-t-leaf-bright" />
      </div>
    )
  }

  if (!order) {
    return (
      <section className="wrap py-24 text-center">
        <h1 className="font-display text-3xl text-forest">Order not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-2">Check the link, or sign in to see your orders.</p>
        <Link to="/account?tab=orders" className="btn btn-primary mt-6">My orders</Link>
      </section>
    )
  }

  const status = ORDER_STATUS[order.status] || ORDER_STATUS.confirmed
  const activeStep = status.step
  const payLabel = PAYMENTS.find((p) => p.id === order.paymentMethod)?.label || order.paymentMethod

  return (
    <>
      <Seo title={`Order ${order.id} — Yalambar Store`} description="Your order is confirmed." path={`/order/${order.id}`} />

      <section className="relative wrap py-12">
        <Confetti />

        <Reveal className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15 }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-leaf-bright to-forest text-white shadow-glowleaf"
          >
            <CheckIcon size={38} />
          </motion.div>
          <h1 className="mt-5 font-display text-[2.2rem] leading-tight text-forest sm:text-[2.8rem]">
            Order confirmed
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[.98rem] text-ink-2">
            Thank you, {order.customer.name.split(' ')[0]}. We're packing your bag now —
            it'll reach you {order.eta?.toLowerCase() || 'today'}.
          </p>
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-[.85rem] font-semibold text-forest">
              #{order.id}
            </span>
            <span className="rounded-full bg-mint px-3.5 py-1.5 text-[.85rem] font-semibold text-forest">
              {status.label}
            </span>
          </div>
        </Reveal>

        {/* tracker */}
        <Reveal delay={0.15} className="relative z-10 mx-auto mt-10 max-w-3xl">
          <ol className="grid gap-4 sm:grid-cols-4">
            {STEPS.map((s, i) => {
              const done = i + 1 <= activeStep
              const current = i + 1 === activeStep
              return (
                <li key={s.k} className="relative flex flex-col items-center text-center">
                  {i < STEPS.length - 1 && (
                    <span className={cn('absolute left-1/2 top-5 hidden h-0.5 w-full sm:block',
                      i + 1 < activeStep ? 'bg-leaf-bright' : 'bg-line')} />
                  )}
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 260, damping: 18 }}
                    className={cn('relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 transition-colors',
                      done ? 'border-leaf-bright bg-leaf-bright text-white' : 'border-line bg-paper text-ink-3',
                      current && 'ring-4 ring-leaf-bright/20')}
                  >
                    {done ? <CheckIcon size={17} /> : i + 1}
                  </motion.span>
                  <span className={cn('mt-2 text-[.85rem] font-semibold', done ? 'text-forest' : 'text-ink-3')}>{s.label}</span>
                  <span className="text-[.75rem] text-ink-3">{s.copy}</span>
                </li>
              )
            })}
          </ol>
        </Reveal>

        <div className="relative z-10 mx-auto mt-10 grid max-w-4xl gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Reveal delay={0.22}>
            <div className="rounded-[24px] border border-line bg-paper p-5 shadow-premium">
              <h2 className="mb-4 flex items-center gap-2 font-display text-[1.25rem] text-forest">
                <BagIcon size={18} /> Your items ({order.totals.count})
              </h2>
              <ul className="flex flex-col divide-y divide-line">
                {order.items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-3">
                    <img src={i.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[.92rem] font-semibold text-ink">{i.name}</span>
                      <span className="text-[.78rem] text-ink-3">{i.brand} · {i.weight} · {i.qty} × {formatNPR(i.price)}</span>
                    </span>
                    <span className="font-display text-[1rem] font-semibold text-forest">{formatNPR(i.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-[.9rem]">
                <div className="flex justify-between"><dt className="text-ink-2">Subtotal</dt><dd className="font-semibold">{formatNPR(order.totals.subtotal)}</dd></div>
                {order.totals.discount > 0 && <div className="flex justify-between text-leaf"><dt>Savings</dt><dd className="font-semibold">−{formatNPR(order.totals.discount)}</dd></div>}
                <div className="flex justify-between">
                  <dt className="text-ink-2">Delivery</dt>
                  <dd className={cn('font-semibold', order.totals.delivery === 0 && 'text-leaf')}>
                    {order.totals.delivery === 0 ? 'Free' : formatNPR(order.totals.delivery)}
                  </dd>
                </div>
                <div className="mt-1 flex items-end justify-between border-t border-line pt-2.5">
                  <dt className="font-display text-[1.1rem] text-forest">Total paid</dt>
                  <dd className="font-display text-[1.45rem] font-semibold text-forest">{formatNPR(order.totals.total)}</dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col gap-4">
              <div className="rounded-[24px] border border-line bg-paper p-5 shadow-premium">
                <h3 className="mb-3 flex items-center gap-2 font-display text-[1.1rem] text-forest">
                  <PinIcon size={17} /> Delivering to
                </h3>
                <p className="text-[.9rem] font-semibold text-ink">{order.customer.name}</p>
                <p className="text-[.86rem] text-ink-2">{order.customer.phone}</p>
                <p className="mt-1.5 text-[.86rem] text-ink-2">{order.address.line}</p>
                <p className="text-[.86rem] text-ink-2">{[order.address.landmark, order.address.city].filter(Boolean).join(' · ')}</p>
                {order.address.notes && <p className="mt-2 rounded-lg bg-cream px-3 py-2 text-[.82rem] italic text-ink-3">“{order.address.notes}”</p>}
              </div>

              <div className="rounded-[24px] border border-line bg-paper p-5 shadow-premium">
                <h3 className="mb-3 flex items-center gap-2 font-display text-[1.1rem] text-forest">
                  <TruckIcon size={17} /> Delivery
                </h3>
                <p className="flex items-center gap-2 text-[.88rem] text-ink-2"><ClockIcon size={15} className="text-leaf" /> {order.eta}</p>
                <p className="mt-1.5 text-[.88rem] text-ink-2">Payment: <b className="text-ink">{payLabel}</b></p>
                <p className="mt-1.5 text-[.82rem] text-ink-3">Placed {fullDate(order.createdAt)}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Link to="/shop" className="btn btn-primary w-full py-3">Keep shopping <ArrowRight size={16} /></Link>
                <Link to="/account?tab=orders" className="btn btn-ghost w-full py-3">View all orders</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
