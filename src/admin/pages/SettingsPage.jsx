import { useEffect, useState } from 'react'
import { Panel, AdminButton, adminField, Badge } from '../ui'
import { SettingsIcon, ShieldIcon, TruckIcon, BoxIcon } from '../../components/Icons'
import { adminGet, adminSend } from '../../lib/api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

export default function SettingsPage() {
  const { notify } = useCart()
  const { user } = useAuth()
  const [store, setStore] = useState({ name: '', tagline: '', deliveryFee: 60, freeDeliveryOver: 1500 })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminGet('/settings')
      .then((d) => setStore((s) => ({ ...s, ...(d.store || {}) })))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await adminSend('/settings', 'PUT', {
        ...store,
        deliveryFee: Number(store.deliveryFee),
        freeDeliveryOver: Number(store.freeDeliveryOver),
      })
      notify('Settings saved')
    } catch (err) { notify(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.8rem] text-paper">Settings</h1>
        <p className="mt-1 text-[.88rem] text-mint/50">Store identity, delivery rules and system information.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Panel title="Store details">
          {loading ? (
            <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-white/6" />)}</div>
          ) : (
            <form onSubmit={save} className="grid gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[.78rem] text-mint/60">Store name</span>
                <input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} className={adminField} />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[.78rem] text-mint/60">Tagline</span>
                <input value={store.tagline} onChange={(e) => setStore({ ...store, tagline: e.target.value })} className={adminField} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[.78rem] text-mint/60">Delivery fee (Rs.)</span>
                <input type="number" value={store.deliveryFee} onChange={(e) => setStore({ ...store, deliveryFee: e.target.value })} className={adminField} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[.78rem] text-mint/60">Free delivery over (Rs.)</span>
                <input type="number" value={store.freeDeliveryOver} onChange={(e) => setStore({ ...store, freeDeliveryOver: e.target.value })} className={adminField} />
              </label>
              <div className="sm:col-span-2">
                <AdminButton disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</AdminButton>
              </div>
            </form>
          )}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Signed in as">
            <div className="flex flex-col gap-1.5 text-[.86rem]">
              <p className="text-paper">{user?.name}</p>
              <p className="text-mint/60">{user?.email}</p>
              <Badge color="#f0b429" className="mt-1 w-fit">Administrator</Badge>
            </div>
          </Panel>

          <Panel title="System">
            <ul className="flex flex-col gap-2.5 text-[.84rem]">
              {[
                { Icon: BoxIcon, k: 'Database', v: 'SQLite (WAL) · better-sqlite3' },
                { Icon: ShieldIcon, k: 'Auth', v: 'JWT in httpOnly cookie + bcrypt' },
                { Icon: TruckIcon, k: 'API', v: 'Express 4 · /api' },
                { Icon: SettingsIcon, k: 'Frontend', v: 'React 18 · Vite · Framer Motion · R3F' },
              ].map(({ Icon, k, v }) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-leaf-glow">
                    <Icon size={15} />
                  </span>
                  <span>
                    <span className="block text-mint/50">{k}</span>
                    <span className="block text-paper">{v}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Danger zone">
            <p className="mb-3 text-[.84rem] text-mint/55">
              Re-seeding restores the original 47 products, 12 aisles and 3 offers. Orders and customers are kept.
            </p>
            <AdminButton
              variant="danger"
              onClick={() => notify('Run `npm run seed` in the terminal to reset the catalog.', 'info')}
            >
              How to re-seed the catalog
            </AdminButton>
          </Panel>
        </div>
      </div>
    </div>
  )
}
