import { useEffect, useState } from 'react'
import { Panel, Table, Td, Tr, Badge, StatCard, adminField } from '../ui'
import { UsersIcon, SearchIcon, ChartIcon, BagIcon } from '../../components/Icons'
import { formatNPR, relTime, initials } from '../../lib/utils'
import { adminGet } from '../../lib/api'
export default function CustomersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    adminGet('/customers').then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((u) =>
    [u.name, u.email, u.phone].join(' ').toLowerCase().includes(q.toLowerCase()))

  const customers = items.filter((u) => u.role === 'customer')
  const totalSpent = items.reduce((s, u) => s + u.spent, 0)
  const withOrders = items.filter((u) => u.orders > 0).length

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.8rem] text-gray-800">Customers</h1>
        <p className="mt-1 text-[.88rem] text-gray-500">Everyone with an account at the shop.</p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <StatCard label="Accounts" value={customers.length} sub="Registered customers" Icon={UsersIcon} accent="#4fd18b" />
        <StatCard label="Have ordered" value={withOrders} sub="At least one delivery" Icon={BagIcon} accent="#f0b429" delay={.06} />
        <StatCard label="Lifetime value" value={formatNPR(totalSpent)} sub="Across all accounts" Icon={ChartIcon} accent="#7ab7e8" delay={.12} />
      </div>

      <Panel>
        <div className="relative mb-4 max-w-sm">
          <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" className={`${adminField} pl-10`} />
        </div>

        <Table head={['Customer', 'Contact', 'Area', 'Orders', 'Spent', 'Joined']} loading={loading}
          empty={!filtered.length ? 'No customers match.' : null}>
          {filtered.map((u) => (
            <Tr key={u.id}>
              <Td>
                <span className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-[.72rem] font-bold text-white">
                    {initials(u.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-gray-800">{u.name}</span>
                    {u.role === 'admin' && <Badge color="#f0b429" className="mt-0.5">Admin</Badge>}
                  </span>
                </span>
              </Td>
              <Td><span className="block truncate">{u.email}</span><span className="text-[.74rem] text-gray-400">{u.phone}</span></Td>
              <Td>{u.city || '—'}</Td>
              <Td><Badge color={u.orders ? '#4fd18b' : '#7a7368'}>{u.orders}</Badge></Td>
              <Td className="font-semibold text-gray-800">{formatNPR(u.spent)}</Td>
              <Td className="text-[.8rem] text-gray-500">{relTime(u.createdAt)}</Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </div>
  )
}
