import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Panel, AdminButton, adminField, Badge } from '../ui'
import { SettingsIcon, ShieldIcon, TruckIcon, BoxIcon, PinIcon, PhoneIcon, ClockIcon, StarIcon, CloseIcon, PlusIcon } from '../../components/Icons'
import { adminGet, adminSend } from '../../lib/api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { DAYS, to12h, formatHours } from '../../lib/utils'

/* Every field the storefront reads, with a safe default. */
const BLANK = {
  name: '', tagline: '',
  address: '', phone: '', email: '',
  hours: DAYS.map((day) => ({ day, open: '07:00', close: '21:00', closed: false })),
  deliveryFee: 60, freeDeliveryOver: 1500, currencyPrefix: 'Rs.',
  deliveryEta: '', deliveryArea: '',
  announcements: [],
  heroTitle: '', heroAccent: '', heroSubtitle: '',
  facebook: '', instagram: '', whatsapp: '',
}

const TABS = [
  { id: 'identity', label: 'Identity', Icon: StarIcon },
  { id: 'contact', label: 'Contact', Icon: PinIcon },
  { id: 'hours', label: 'Opening hours', Icon: ClockIcon },
  { id: 'delivery', label: 'Delivery', Icon: TruckIcon },
  { id: 'home', label: 'Homepage', Icon: BoxIcon },
]

function Field({ label, hint, className = '', children }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[.78rem] text-gray-500">{label}</span>
      {children}
      {hint && <span className="text-[.72rem] text-gray-400">{hint}</span>}
    </label>
  )
}

export default function SettingsPage() {
  const { notify } = useCart()
  const { user } = useAuth()
  const [store, setStore] = useState(BLANK)
  const [initial, setInitial] = useState(BLANK)
  const [tab, setTab] = useState('identity')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminGet('/settings')
      .then((d) => {
        const s = { ...BLANK, ...(d.store || {}) }
        // normalise: always 7 days, in week order
        s.hours = DAYS.map((day) => {
          const found = (s.hours || []).find((h) => h.day === day)
          return found ? { day, open: found.open || '07:00', close: found.close || '21:00', closed: !!found.closed } : { day, open: '07:00', close: '21:00', closed: false }
        })
        s.announcements = Array.isArray(s.announcements) ? s.announcements : []
        setStore(s); setInitial(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const dirty = useMemo(() => JSON.stringify(store) !== JSON.stringify(initial), [store, initial])
  const set = (patch) => setStore((s) => ({ ...s, ...patch }))
  const setDay = (i, patch) => setStore((s) => ({ ...s, hours: s.hours.map((h, j) => (j === i ? { ...h, ...patch } : h)) }))

  /** Copy day i's times to every other open day — the usual "same all week" case. */
  const applyToAll = (i) => {
    const src = store.hours[i]
    setStore((s) => ({ ...s, hours: s.hours.map((h) => ({ ...h, open: src.open, close: src.close })) }))
    notify(`Applied ${src.day}'s hours to every day`)
  }

  const save = async (e) => {
    e?.preventDefault()
    setBusy(true)
    try {
      const payload = {
        ...store,
        deliveryFee: Number(store.deliveryFee) || 0,
        freeDeliveryOver: Number(store.freeDeliveryOver) || 0,
        announcements: store.announcements.filter((a) => a.trim()),
      }
      await adminSend('/settings', 'PUT', payload)
      setInitial(payload); setStore(payload)
      notify('Settings saved — the storefront updates on next load')
    } catch (err) { notify(err.message, 'error') } finally { setBusy(false) }
  }

  const preview = formatHours(store.hours)

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-50" />
        <Panel><div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-gray-50" />)}</div></Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.8rem] text-gray-800">Settings</h1>
          <p className="mt-1 text-[.88rem] text-gray-500">Everything the storefront shows — name, contact, opening hours, delivery and homepage copy.</p>
        </div>
        <AnimatePresence>
          {dirty && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex items-center gap-2.5">
              <span className="text-[.78rem] text-warning-600">Unsaved changes</span>
              <AdminButton variant="ghost" onClick={() => setStore(initial)} type="button">Discard</AdminButton>
              <AdminButton onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</AdminButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* tabs */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id} type="button" onClick={() => setTab(id)}
            className={`relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[.83rem] transition-colors ${tab === id ? 'text-white' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {tab === id && <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-full bg-brand-500" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative z-10 flex items-center gap-2"><Icon size={15} />{label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <form onSubmit={save} className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'identity' && (
                <Panel title="Store identity">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Store name" className="sm:col-span-2" hint="Shown in the header, footer, page titles and order emails.">
                      <input value={store.name} onChange={(e) => set({ name: e.target.value })} className={adminField} />
                    </Field>
                    <Field label="Tagline" className="sm:col-span-2">
                      <input value={store.tagline} onChange={(e) => set({ tagline: e.target.value })} className={adminField} />
                    </Field>
                    <Field label="Currency prefix" hint="Appears before every price.">
                      <input value={store.currencyPrefix} onChange={(e) => set({ currencyPrefix: e.target.value })} className={adminField} />
                    </Field>
                  </div>
                </Panel>
              )}

              {tab === 'contact' && (
                <Panel title="Contact details">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Street address" className="sm:col-span-2">
                      <input value={store.address} onChange={(e) => set({ address: e.target.value })} className={adminField} />
                    </Field>
                    <Field label="Phone" hint="Tap-to-call in the mobile menu and footer.">
                      <input value={store.phone} onChange={(e) => set({ phone: e.target.value })} className={adminField} />
                    </Field>
                    <Field label="Email">
                      <input type="email" value={store.email} onChange={(e) => set({ email: e.target.value })} className={adminField} />
                    </Field>
                    <Field label="Facebook URL"><input value={store.facebook} onChange={(e) => set({ facebook: e.target.value })} placeholder="https://facebook.com/…" className={adminField} /></Field>
                    <Field label="Instagram URL"><input value={store.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="https://instagram.com/…" className={adminField} /></Field>
                    <Field label="WhatsApp number" className="sm:col-span-2"><input value={store.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+977…" className={adminField} /></Field>
                  </div>
                </Panel>
              )}

              {tab === 'hours' && (
                <Panel title="Opening hours" action={<span className="text-[.76rem] text-gray-400">Times are 24-hour</span>}>
                  <div className="flex flex-col gap-2">
                    {store.hours.map((h, i) => (
                      <div key={h.day} className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-gray-200 px-3 py-2.5 transition-colors sm:grid-cols-[7.5rem_1fr_auto] ${h.closed ? 'bg-white/[.02]' : 'bg-white/[.04]'}`}>
                        <span className={`text-[.86rem] ${h.closed ? 'text-gray-400' : 'text-gray-800'}`}>{h.day}</span>

                        <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
                          {h.closed ? (
                            <span className="text-[.82rem] italic text-gray-400">Closed all day</span>
                          ) : (
                            <>
                              <input
                                type="time" value={h.open} onChange={(e) => setDay(i, { open: e.target.value })}
                                className="rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-[.82rem] text-gray-800 outline-none focus:border-brand-400 [color-scheme:dark]"
                              />
                              <span className="text-gray-400">→</span>
                              <input
                                type="time" value={h.close} onChange={(e) => setDay(i, { close: e.target.value })}
                                className="rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-[.82rem] text-gray-800 outline-none focus:border-brand-400 [color-scheme:dark]"
                              />
                              <span className="hidden text-[.74rem] text-gray-400 xl:inline">{to12h(h.open)} – {to12h(h.close)}</span>
                              <button type="button" onClick={() => applyToAll(i)} title="Apply these times to every day"
                                className="rounded-lg border border-gray-200 px-2 py-1 text-[.72rem] text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500">
                                Apply to all
                              </button>
                            </>
                          )}
                        </div>

                        <label className="flex items-center gap-2 justify-self-end text-[.78rem] text-gray-500">
                          <input type="checkbox" checked={h.closed} onChange={(e) => setDay(i, { closed: e.target.checked })}
                            className="h-4 w-4 accent-errorc-500" />
                          Closed
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3.5 rounded-xl border border-brand-100 bg-brand-25 p-3">
                    <p className="mb-1.5 text-[.74rem] uppercase tracking-wider text-brand-600">Footer preview</p>
                    <div className="flex flex-col gap-0.5 text-[.84rem] text-gray-800">
                      {preview.map((h) => <span key={h.days}>{h.days}: {h.time}</span>)}
                    </div>
                  </div>
                </Panel>
              )}

              {tab === 'delivery' && (
                <Panel title="Delivery rules">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Delivery fee (Rs.)"><input type="number" min="0" value={store.deliveryFee} onChange={(e) => set({ deliveryFee: e.target.value })} className={adminField} /></Field>
                    <Field label="Free delivery over (Rs.)" hint="Set 0 to always charge."><input type="number" min="0" value={store.freeDeliveryOver} onChange={(e) => set({ freeDeliveryOver: e.target.value })} className={adminField} /></Field>
                    <Field label="Delivery window" hint='e.g. "45–90 minutes"'><input value={store.deliveryEta} onChange={(e) => set({ deliveryEta: e.target.value })} className={adminField} /></Field>
                    <Field label="Delivery area"><input value={store.deliveryArea} onChange={(e) => set({ deliveryArea: e.target.value })} className={adminField} /></Field>
                  </div>
                </Panel>
              )}

              {tab === 'home' && (
                <Panel title="Homepage copy">
                  <div className="grid gap-3.5">
                    <Field label="Hero heading"><input value={store.heroTitle} onChange={(e) => set({ heroTitle: e.target.value })} className={adminField} /></Field>
                    <Field label="Hero accent line" hint="Rendered in the script accent face.">
                      <input value={store.heroAccent} onChange={(e) => set({ heroAccent: e.target.value })} className={adminField} />
                    </Field>
                    <Field label="Hero subtitle">
                      <textarea rows={3} value={store.heroSubtitle} onChange={(e) => set({ heroSubtitle: e.target.value })} className={`${adminField} resize-y`} />
                    </Field>

                    <div className="flex flex-col gap-2">
                      <span className="text-[.78rem] text-gray-500">Announcement bar messages</span>
                      {store.announcements.map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={a}
                            onChange={(e) => set({ announcements: store.announcements.map((x, j) => (j === i ? e.target.value : x)) })}
                            className={adminField}
                          />
                          <button type="button" aria-label="Remove message"
                            onClick={() => set({ announcements: store.announcements.filter((_, j) => j !== i) })}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-errorc-300 hover:text-errorc-600">
                            <CloseIcon size={14} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => set({ announcements: [...store.announcements, ''] })}
                        className="flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-[.8rem] text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500">
                        <PlusIcon size={14} /> Add message
                      </button>
                    </div>
                  </div>
                </Panel>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <AdminButton disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</AdminButton>
            {dirty && <button type="button" onClick={() => setStore(initial)} className="text-[.82rem] text-gray-500 underline-offset-4 hover:underline">Discard</button>}
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <Panel title="Live preview">
            <div className="flex flex-col gap-2.5 text-[.85rem]">
              <p className="font-display text-[1.1rem] text-gray-800">{store.name || '—'}</p>
              <p className="text-gray-500">{store.tagline}</p>
              <div className="mt-1 flex flex-col gap-1.5 border-t border-gray-200 pt-2.5 text-gray-600">
                <span className="flex gap-2"><PinIcon size={15} className="mt-0.5 shrink-0 text-brand-500" />{store.address || '—'}</span>
                <span className="flex gap-2"><PhoneIcon size={15} className="mt-0.5 shrink-0 text-brand-500" />{store.phone || '—'}</span>
                <span className="flex gap-2"><ClockIcon size={15} className="mt-0.5 shrink-0 text-brand-500" />
                  <span className="flex flex-col">{preview.map((h) => <span key={h.days}>{h.days}: {h.time}</span>)}</span>
                </span>
                <span className="flex gap-2"><TruckIcon size={15} className="mt-0.5 shrink-0 text-brand-500" />
                  Rs. {store.deliveryFee} · free over Rs. {store.freeDeliveryOver}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Signed in as">
            <div className="flex flex-col gap-1.5 text-[.86rem]">
              <p className="text-gray-800">{user?.name}</p>
              <p className="text-gray-500">{user?.email}</p>
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
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gray-200 text-brand-500">
                    <Icon size={15} />
                  </span>
                  <span>
                    <span className="block text-gray-500">{k}</span>
                    <span className="block text-gray-800">{v}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
