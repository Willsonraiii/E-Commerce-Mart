import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Panel, StatCard, Table, Td, Tr, Badge } from '../ui'
import { ChartIcon, BagIcon, UsersIcon, BoxIcon, ArrowRight, TruckIcon } from '../../components/Icons'
import { formatNPR, relTime, ORDER_STATUS } from '../../lib/utils'
import { adminGet } from '../../lib/api'

const STATUS_COLORS = {
  confirmed: '#4fd18b', packing: '#f0b429', 'out-for-delivery': '#7ab7e8',
  delivered: '#2f6b47', cancelled: '#e2795b',
}

function SalesChart({ series }) {
  if (!series.length) {
    return <p className="grid h-52 place-items-center text-[.86rem] text-mint/40">No sales yet — place an order on the storefront.</p>
  }
  const max = Math.max(...series.map((s) => s.v), 1)
  // Keep bars readable when there are only one or two days of data.
  const slot = 100 / Math.max(series.length, 7)
  const barW = Math.min(slot * 0.56, 7)
  const offset = (slot - barW) / 2

  return (
    <div className="relative h-52">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4fd18b" />
            <stop offset="100%" stopColor="#2f6b47" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,.06)" strokeWidth=".4" />
        ))}
        {series.map((s, i) => {
          const h = Math.max((s.v / max) * 88, 1.5)
          return (
            <motion.rect
              key={s.d}
              x={i * slot + offset} width={barW} rx={Math.min(barW * 0.3, 1.6)}
              initial={{ height: 0, y: 100 }}
              animate={{ height: h, y: 100 - h }}
              transition={{ duration: 0.7, delay: i * 0.045, ease: [0.22, 0.8, 0.25, 1] }}
              fill="url(#barGrad)"
            >
              <title>{`${s.d}: ${formatNPR(s.v)} (${s.n} orders)`}</title>
            </motion.rect>
          )
        })}
      </svg>
      <div className="mt-1.5 flex justify-between text-[.66rem] text-mint/35">
        <span>{series[0]?.d}</span>
        <span>{series[series.length - 1]?.d}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGet('/stats').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const t = data?.totals || {}

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.8rem] text-paper">Good day at the counter</h1>
        <p className="mt-1 text-[.88rem] text-mint/50">Live numbers from the SQLite store — every order, product and customer.</p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatNPR(t.revenue || 0)} sub="All confirmed orders" Icon={ChartIcon} accent="#4fd18b" delay={0} />
        <StatCard label="Orders" value={t.orders ?? 0} sub={`Avg ${formatNPR(t.aov || 0)}`} Icon={BagIcon} accent="#f0b429" delay={0.06} />
        <StatCard label="Customers" value={t.customers ?? 0} sub="Registered accounts" Icon={UsersIcon} accent="#7ab7e8" delay={0.12} />
        <StatCard label="Products" value={t.products ?? 0} sub={`${data?.lowStock?.length || 0} need restock`} Icon={BoxIcon} accent="#e2795b" delay={0.18} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Revenue, last 14 days">
          {loading ? <div className="h-52 animate-pulse rounded-xl bg-white/6" /> : <SalesChart series={data?.series || []} />}
        </Panel>

        <Panel title="Top sellers">
          {loading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-white/6" />)}</div>
          ) : data?.topProducts?.length ? (
            <ul className="flex flex-col gap-2.5">
              {data.topProducts.map((p, i) => {
                const max = data.topProducts[0].units || 1
                return (
                  <li key={p.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[.83rem]">
                      <span className="truncate text-mint/85"><b className="mr-1.5 text-mint/40">{i + 1}</b>{p.name}</span>
                      <span className="shrink-0 font-semibold text-leaf-glow">{p.units}×</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-leaf-glow to-gold"
                        initial={{ width: 0 }} animate={{ width: `${(p.units / max) * 100}%` }}
                        transition={{ duration: 0.7, delay: i * 0.07 }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="py-8 text-center text-[.86rem] text-mint/40">No sales data yet.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Recent orders"
          action={<Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-[.8rem] font-semibold text-leaf-glow hover:underline">All orders <ArrowRight size={14} /></Link>}
        >
          <Table head={['Order', 'Customer', 'Items', 'Status', 'Total']} loading={loading}
            empty={!data?.recent?.length ? 'No orders yet.' : null}>
            {data?.recent?.map((o) => (
              <Tr key={o.id}>
                <Td><span className="font-semibold text-paper">#{o.id}</span><br /><span className="text-[.74rem] text-mint/40">{relTime(o.createdAt)}</span></Td>
                <Td>{o.customer.name}<br /><span className="text-[.74rem] text-mint/40">{o.customer.phone}</span></Td>
                <Td>{o.totals.count}</Td>
                <Td><Badge color={STATUS_COLORS[o.status]}>{ORDER_STATUS[o.status]?.label || o.status}</Badge></Td>
                <Td className="font-semibold text-paper">{formatNPR(o.totals.total)}</Td>
              </Tr>
            ))}
          </Table>
        </Panel>

        <Panel
          title="Needs restock"
          action={<Link to="/admin/inventory" className="inline-flex items-center gap-1.5 text-[.8rem] font-semibold text-leaf-glow hover:underline">Inventory <ArrowRight size={14} /></Link>}
        >
          {loading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/6" />)}</div>
          ) : data?.lowStock?.length ? (
            <ul className="flex flex-col gap-2">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.03] p-2">
                  <img src={p.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 truncate text-[.84rem] text-mint/85">{p.name}</span>
                  <Badge color={p.stock === 'out' ? '#e2795b' : '#f0b429'}>{p.stock === 'out' ? 'Out' : 'Low'}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-[.86rem] text-mint/40">
              <TruckIcon size={26} className="mx-auto mb-2 text-mint/25" />Everything is stocked.
            </p>
          )}
        </Panel>
      </div>
    </div>
  )
}
