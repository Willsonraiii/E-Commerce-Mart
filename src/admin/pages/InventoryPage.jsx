import { useEffect, useState, useCallback } from 'react'
import { Panel, Table, Td, Tr, Badge, StatCard, AdminButton, adminField } from '../ui'
import { BoxIcon, TruckIcon, SearchIcon } from '../../components/Icons'
import { formatNPR, cn } from '../../lib/utils'
import { adminGet, adminSend } from '../../lib/api'
import { useCart } from '../../context/CartContext'

const LEVELS = [
  { id: 'in', label: 'In stock', color: '#4fd18b' },
  { id: 'low', label: 'Low', color: '#f0b429' },
  { id: 'out', label: 'Out', color: '#e2795b' },
]

export default function InventoryPage() {
  const { notify } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    adminGet('/inventory').then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const setStock = async (p, stock) => {
    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, stock } : x)))
    try { await adminSend(`/products/${p.id}`, 'PATCH', { stock }); notify(`${p.name} → ${stock}`) }
    catch (err) { notify(err.message, 'error'); load() }
  }

  const filtered = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
  const counts = LEVELS.map((l) => ({ ...l, n: items.filter((p) => p.stock === l.id).length }))
  const value = items.reduce((s, p) => s + p.price, 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.8rem] text-gray-800">Inventory</h1>
        <p className="mt-1 text-[.88rem] text-gray-500">Flip stock levels as the shelves empty and refill.</p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map((c, i) => (
          <StatCard key={c.id} label={c.label} value={c.n} sub={`${Math.round((c.n / (items.length || 1)) * 100)}% of catalog`}
            Icon={BoxIcon} accent={c.color} delay={i * .06} />
        ))}
        <StatCard label="Shelf value" value={formatNPR(value)} sub="Sum of unit prices" Icon={TruckIcon} accent="#7ab7e8" delay={.18} />
      </div>

      <Panel>
        <div className="relative mb-4 max-w-sm">
          <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a product…" className={`${adminField} pl-10`} />
        </div>

        <Table head={['Product', 'Aisle', 'Price', 'Set stock level']} loading={loading}
          empty={!filtered.length ? 'Nothing matches.' : null}>
          {filtered.map((p) => (
            <Tr key={p.id}>
              <Td>
                <span className="flex items-center gap-3">
                  <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-gray-800">{p.name}</span>
                    <span className="block truncate text-[.74rem] text-gray-400">{p.brand} · {p.weight}</span>
                  </span>
                </span>
              </Td>
              <Td className="capitalize">{p.category}</Td>
              <Td className="font-semibold text-gray-800">{formatNPR(p.price)}</Td>
              <Td>
                <span className="inline-flex gap-1.5">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id} onClick={() => setStock(p, l.id)}
                      className={cn('rounded-lg border px-2.5 py-1 text-[.74rem] font-semibold transition-all',
                        p.stock === l.id ? 'scale-105' : 'opacity-45 hover:opacity-90')}
                      style={{
                        color: l.color,
                        background: p.stock === l.id ? `${l.color}22` : 'transparent',
                        borderColor: p.stock === l.id ? `${l.color}66` : 'rgba(255,255,255,.12)',
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  )
}
