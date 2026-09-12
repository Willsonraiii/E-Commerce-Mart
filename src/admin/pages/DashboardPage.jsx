import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Card, CardHeader, MetricCard, RadialGauge, BarChart, AreaChart,
  Segmented, TaTable, TaTd, TaTr, StatusPill, Delta, TaButton,
} from '../ta'
import { UsersIcon, BagIcon, BoxIcon, ArrowRight, TruckIcon, ChartIcon } from '../../components/Icons'
import { formatNPR, formatNPRShort, relTime } from '../../lib/utils'
import { adminGet } from '../../lib/api'

const STATUS_TONE = {
  confirmed: 'info', packing: 'warning', 'out-for-delivery': 'info',
  delivered: 'success', cancelled: 'error',
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [range, setRange] = useState('Monthly')

  useEffect(() => { adminGet('/stats').then(setData).catch(() => {}) }, [])

  const totals = data?.totals || { revenue: 0, orders: 0, customers: 0, products: 0, aov: 0 }
  const series = data?.series || []

  /* --- daily series -> the shape each chart wants ------------------------ */

  // Bar chart: real monthly revenue straight from the API.
  const months = data?.months || []
  const monthly = useMemo(
    () => (months.length ? months.map((m) => ({ label: m.label, v: m.v })) : []),
    [months],
  )

  // Area chart: revenue (a) and order count scaled for a second band (b).
  const areaData = useMemo(() => {
    if (range === 'Monthly') {
      return series.map((s) => ({
        label: new Date(s.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        a: Math.round(s.v), b: s.n * 100,
      }))
    }
    if (range === 'Quarterly') {
      const weeks = []
      for (let i = 0; i < series.length; i += 7) {
        const chunk = series.slice(i, i + 7)
        weeks.push({
          label: `W${weeks.length + 1}`,
          a: Math.round(chunk.reduce((t, s) => t + s.v, 0)),
          b: chunk.reduce((t, s) => t + s.n, 0) * 100,
        })
      }
      return weeks
    }
    return months.map((m) => ({ label: m.label, a: Math.round(m.v), b: m.n * 100 }))
  }, [series, range, months])

  // "Monthly target" — revenue this month against a rolling goal.
  const target = useMemo(() => {
    const thisMonth = months[months.length - 1]?.v || 0
    const prevMonths = months.slice(0, -1).filter((m) => m.v > 0)
    const avg = prevMonths.length ? prevMonths.reduce((t, m) => t + m.v, 0) / prevMonths.length : 0
    // Goal = 15% above the recent monthly average, with a sane floor.
    const goal = Math.max(avg * 1.15, 10000)
    const pct = goal ? Math.min((thisMonth / goal) * 100, 100) : 0
    const today = series[series.length - 1]?.v || 0
    return { goal, pct, today, thisMonth }
  }, [months, series])

  const last7 = series.slice(-7).reduce((t, s) => t + s.v, 0)
  const prev7 = series.slice(-14, -7).reduce((t, s) => t + s.v, 0)
  const revDelta = prev7 ? ((last7 - prev7) / prev7) * 100 : last7 ? 100 : 0

  const orders7 = series.slice(-7).reduce((t, s) => t + s.n, 0)
  const ordersPrev7 = series.slice(-14, -7).reduce((t, s) => t + s.n, 0)
  const ordDelta = ordersPrev7 ? ((orders7 - ordersPrev7) / ordersPrev7) * 100 : orders7 ? 100 : 0

  const loading = !data

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* ---------------------------------------------- row 1: metrics + target */}
      <div className="grid gap-4 md:gap-5 xl:grid-cols-[1fr_1fr_minmax(0,1.02fr)]">
        <MetricCard
          label="Customers" value={totals.customers} delta={11.01}
          Icon={UsersIcon} delay={0}
        />
        <MetricCard
          label="Orders" value={totals.orders} delta={ordDelta}
          Icon={BagIcon} delay={0.06}
        />

        <Card className="row-span-2 flex flex-col p-5 xl:col-start-3 xl:row-start-1">
          <CardHeader
            title="Monthly Target"
            subtitle="Target you've set for each month"
            action={<button className="text-gray-400 transition-colors hover:text-gray-600" aria-label="Options">⋮</button>}
          />
          <div className="mt-2 flex-1">
            <RadialGauge value={target.pct} delta={revDelta} size={250} />
            <p className="mx-auto mt-3 max-w-[19rem] text-center text-[.86rem] leading-relaxed text-gray-500">
              You earned <b className="text-gray-700">{formatNPR(target.today)}</b> today.
              {revDelta >= 0 ? " That's ahead of last week — keep it up!" : ' A little behind last week.'}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-gray-50 px-1 py-3.5">
            {[
              { k: 'Target', v: target.goal, up: false },
              { k: 'This month', v: target.thisMonth, up: true },
              { k: 'Today', v: target.today, up: target.today > 0 },
            ].map(({ k, v, up }, i) => (
              <div key={k} className={`flex flex-col items-center gap-1 ${i < 2 ? 'border-r border-gray-200' : ''}`}>
                <span className="text-[.74rem] text-gray-500">{k}</span>
                <span className="flex items-center gap-1 whitespace-nowrap text-[.88rem] font-semibold text-gray-800">
                  {formatNPRShort(v)}
                  <svg width="11" height="11" viewBox="0 0 12 12" className={up ? 'text-success-600' : 'rotate-180 text-errorc-500'}>
                    <path d="M6 2.5 9.5 7H2.5L6 2.5Z" fill="currentColor" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ------------------------------------------------ row 2: monthly sales */}
        <Card className="p-5 xl:col-span-2">
          <CardHeader
            title="Monthly Sales"
            action={<button className="text-gray-400 transition-colors hover:text-gray-600" aria-label="Options">⋮</button>}
          />
          <div className="mt-4">
            {loading
              ? <div className="h-[230px] animate-pulse rounded-xl bg-gray-100" />
              : <BarChart data={monthly} format={(v) => formatNPR(v)} />}
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------ row 3: statistics */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardHeader title="Statistics" subtitle="Revenue and orders over time" />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented options={['Monthly', 'Quarterly', 'Annually']} value={range} onChange={setRange} />
            <span className="hidden items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-[.8rem] text-gray-600 sm:flex">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Last 14 days
            </span>
          </div>
        </div>
        <div className="mt-5">
          {loading
            ? <div className="h-[290px] animate-pulse rounded-xl bg-gray-100" />
            : <AreaChart data={areaData} format={(v) => formatNPR(v)} />}
        </div>
      </Card>

      {/* --------------------------------------- row 4: secondary metrics + lists */}
      <div className="grid gap-4 md:gap-5 xl:grid-cols-3">
        <MetricCard label="Revenue" value={totals.revenue} prefix="Rs. " delta={revDelta} Icon={ChartIcon} sub="All non-cancelled orders" />
        <MetricCard label="Products live" value={totals.products} Icon={BoxIcon} sub="Excludes archived" />
        <MetricCard label="Average order" value={totals.aov} prefix="Rs. " decimals={0} Icon={TruckIcon} sub="Revenue ÷ orders" />
      </div>

      <div className="grid gap-4 md:gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* recent orders */}
        <Card>
          <div className="flex items-center justify-between gap-3 p-5 pb-4">
            <CardHeader title="Recent Orders" subtitle="Latest activity from the storefront" />
            <Link to="/admin/orders">
              <TaButton variant="ghost">See all <ArrowRight size={14} /></TaButton>
            </Link>
          </div>
          <TaTable
            head={['Order', 'Customer', 'Items', 'Total', 'Status']}
            loading={loading}
            empty={!data?.recent?.length && (
              <p className="px-5 py-10 text-center text-[.86rem] text-gray-400">
                No orders yet — place one on the storefront to see it here.
              </p>
            )}
          >
            {(data?.recent || []).map((o) => (
              <TaTr key={o.id}>
                <TaTd className="font-medium text-gray-800">
                  #{String(o.id).slice(0, 8)}
                  <span className="block text-[.74rem] font-normal text-gray-400">{relTime(o.createdAt)}</span>
                </TaTd>
                <TaTd>{o.customer?.name || '—'}</TaTd>
                <TaTd>{(o.items || []).reduce((t, i) => t + i.qty, 0)}</TaTd>
                <TaTd className="font-semibold text-gray-800">
                  {formatNPR((o.items || []).reduce((t, i) => t + i.subtotal, 0))}
                </TaTd>
                <TaTd><StatusPill tone={STATUS_TONE[o.status] || 'neutral'}>{o.status}</StatusPill></TaTd>
              </TaTr>
            ))}
          </TaTable>
        </Card>

        <div className="flex flex-col gap-4 md:gap-5">
          {/* top products */}
          <Card className="p-5">
            <CardHeader title="Top Products" subtitle="By units sold" />
            <ul className="mt-4 flex flex-col gap-3.5">
              {loading && Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-9 animate-pulse rounded-lg bg-gray-100" />)}
              {!loading && !data.topProducts?.length && <li className="py-4 text-center text-[.84rem] text-gray-400">No sales yet.</li>}
              {(data?.topProducts || []).map((p, i) => {
                const max = Math.max(...(data.topProducts || []).map((x) => x.units), 1)
                return (
                  <li key={p.id} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-[.85rem]">
                      <span className="truncate text-gray-700">{i + 1}. {p.name}</span>
                      <span className="shrink-0 font-semibold text-gray-800">{p.units} sold</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        className="h-full rounded-full bg-brand-500"
                        initial={{ width: 0 }} animate={{ width: `${(p.units / max) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.07, ease: [0.22, 0.8, 0.25, 1] }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* low stock */}
          <Card className="p-5">
            <CardHeader
              title="Needs restocking"
              subtitle={`${data?.lowStock?.length || 0} item(s) low or out`}
              action={<Link to="/admin/inventory" className="text-[.8rem] font-medium text-brand-500 hover:text-brand-600">Manage</Link>}
            />
            <ul className="mt-4 flex flex-col gap-2.5">
              {loading && Array.from({ length: 3 }).map((_, i) => <li key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
              {!loading && !data.lowStock?.length && (
                <li className="rounded-lg bg-success-50 px-3 py-3 text-center text-[.84rem] text-success-700">
                  Everything is in stock.
                </li>
              )}
              {(data?.lowStock || []).slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                  {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded-md object-cover" />}
                  <span className="min-w-0 flex-1 truncate text-[.85rem] text-gray-700">{p.name}</span>
                  <StatusPill tone={p.stock === 'out' ? 'error' : 'warning'}>{p.stock}</StatusPill>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
