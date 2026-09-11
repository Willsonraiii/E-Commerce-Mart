import { useEffect, useState, useCallback, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Panel, Table, Td, Tr, Badge, AdminButton } from '../ui'
import { ArrowRight, PinIcon, PhoneIcon } from '../../components/Icons'
import { formatNPR, fullDate, relTime, ORDER_STATUS, PAYMENTS, cn } from '../../lib/utils'
import { adminGet, adminSend } from '../../lib/api'
import { useCart } from '../../context/CartContext'

const STATUS_COLORS = {
  confirmed: '#4fd18b', packing: '#f0b429', 'out-for-delivery': '#7ab7e8',
  delivered: '#2f6b47', cancelled: '#e2795b',
}
const FLOW = ['confirmed', 'packing', 'out-for-delivery', 'delivered', 'cancelled']
const FILTERS = [{ id: 'all', label: 'All' }, ...FLOW.map((s) => ({ id: s, label: ORDER_STATUS[s].label }))]

export default function OrdersPage() {
  const { notify } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const load = useCallback((f) => {
    setLoading(true)
    adminGet(`/orders${f && f !== 'all' ? `?status=${f}` : ''}`)
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  const setStatus = async (id, status) => {
    try {
      await adminSend(`/orders/${id}`, 'PATCH', { status })
      notify(`Order #${id} → ${ORDER_STATUS[status].label}`)
      setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    } catch (err) { notify(err.message, 'error') }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.8rem] text-paper">Orders</h1>
        <p className="mt-1 text-[.88rem] text-mint/50">Move an order along as you pack and dispatch it.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id} onClick={() => setFilter(f.id)}
            className={cn('rounded-full border px-3.5 py-1.5 text-[.8rem] font-semibold transition-colors',
              filter === f.id ? 'border-leaf-glow bg-leaf-glow text-forest' : 'border-white/12 bg-white/5 text-mint/70 hover:bg-white/10')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Panel>
        <Table head={['Order', 'Customer', 'Placed', 'Items', 'Status', 'Total', '']} loading={loading}
          empty={!items.length ? 'No orders in this view.' : null}>
          {items.map((o) => (
            <Fragment key={o.id}>
              <Tr>
                <Td><span className="font-semibold text-paper">#{o.id}</span></Td>
                <Td>{o.customer.name}<br /><span className="text-[.74rem] text-mint/40">{o.customer.phone}</span></Td>
                <Td><span title={fullDate(o.createdAt)}>{relTime(o.createdAt)}</span></Td>
                <Td>{o.totals.count}</Td>
                <Td>
                  <select
                    value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}
                    className="cursor-pointer rounded-full border px-2.5 py-1 text-[.74rem] font-semibold outline-none"
                    style={{
                      color: STATUS_COLORS[o.status],
                      background: `${STATUS_COLORS[o.status]}1f`,
                      borderColor: `${STATUS_COLORS[o.status]}44`,
                    }}
                  >
                    {FLOW.map((s) => <option key={s} value={s} className="bg-[#12291f] text-mint">{ORDER_STATUS[s].label}</option>)}
                  </select>
                </Td>
                <Td className="font-semibold text-paper">{formatNPR(o.totals.total)}</Td>
                <Td>
                  <button onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    className="inline-flex items-center gap-1 text-[.78rem] font-semibold text-leaf-glow hover:underline">
                    {expanded === o.id ? 'Hide' : 'Details'}
                    <ArrowRight size={13} className={cn('transition-transform', expanded === o.id && 'rotate-90')} />
                  </button>
                </Td>
              </Tr>
              <AnimatePresence key={`${o.id}-exp`}>
                {expanded === o.id && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }} className="overflow-hidden"
                      >
                        <div className="grid gap-4 border-b border-white/8 bg-white/[.02] p-4 md:grid-cols-[1.4fr_1fr]">
                          <div>
                            <p className="mb-2 text-[.72rem] font-bold uppercase tracking-wider text-mint/40">Items</p>
                            <ul className="flex flex-col gap-2">
                              {o.items.map((i) => (
                                <li key={i.id} className="flex items-center gap-2.5">
                                  <img src={i.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                                  <span className="min-w-0 flex-1 truncate text-[.83rem] text-mint/85">{i.name}</span>
                                  <span className="text-[.78rem] text-mint/50">{i.qty} × {formatNPR(i.price)}</span>
                                  <span className="w-20 text-right text-[.83rem] font-semibold text-paper">{formatNPR(i.subtotal)}</span>
                                </li>
                              ))}
                            </ul>
                            <dl className="mt-3 flex flex-col gap-1 border-t border-white/8 pt-2.5 text-[.82rem]">
                              <div className="flex justify-between"><dt className="text-mint/50">Subtotal</dt><dd className="text-mint/85">{formatNPR(o.totals.subtotal)}</dd></div>
                              <div className="flex justify-between"><dt className="text-mint/50">Delivery</dt><dd className="text-mint/85">{o.totals.delivery === 0 ? 'Free' : formatNPR(o.totals.delivery)}</dd></div>
                              <div className="flex justify-between font-semibold text-paper"><dt>Total</dt><dd>{formatNPR(o.totals.total)}</dd></div>
                            </dl>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="rounded-xl border border-white/8 bg-white/[.03] p-3">
                              <p className="mb-1.5 flex items-center gap-1.5 text-[.72rem] font-bold uppercase tracking-wider text-mint/40">
                                <PinIcon size={12} /> Deliver to
                              </p>
                              <p className="text-[.85rem] font-semibold text-paper">{o.customer.name}</p>
                              <p className="text-[.82rem] text-mint/70">{o.address.line}</p>
                              <p className="text-[.82rem] text-mint/70">{[o.address.landmark, o.address.city].filter(Boolean).join(' · ')}</p>
                              <a href={`tel:${o.customer.phone}`} className="mt-2 inline-flex items-center gap-1.5 text-[.8rem] font-semibold text-leaf-glow hover:underline">
                                <PhoneIcon size={13} /> {o.customer.phone}
                              </a>
                              {o.address.notes && <p className="mt-2 rounded-lg bg-white/6 p-2 text-[.78rem] italic text-mint/60">“{o.address.notes}”</p>}
                            </div>
                            <div className="rounded-xl border border-white/8 bg-white/[.03] p-3 text-[.82rem]">
                              <p className="text-mint/50">Payment: <b className="text-paper">{PAYMENTS.find((p) => p.id === o.paymentMethod)?.label || o.paymentMethod}</b></p>
                              <p className="mt-1 text-mint/50">Placed: <span className="text-mint/80">{fullDate(o.createdAt)}</span></p>
                              <p className="mt-1 text-mint/50">ETA: <span className="text-mint/80">{o.eta}</span></p>
                            </div>
                            {o.status !== 'delivered' && o.status !== 'cancelled' && (
                              <AdminButton onClick={() => setStatus(o.id, FLOW[FLOW.indexOf(o.status) + 1])}>
                                Advance to {ORDER_STATUS[FLOW[FLOW.indexOf(o.status) + 1]]?.label} <ArrowRight size={14} />
                              </AdminButton>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </Fragment>
          ))}
        </Table>
      </Panel>
    </div>
  )
}
