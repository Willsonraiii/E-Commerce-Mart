import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Panel, AdminButton, Modal, adminField, Badge } from '../ui'
import { PlusIcon, TrashIcon, TagIcon, EditIcon } from '../../components/Icons'
import { tone, TONES } from '../../lib/utils'
import { adminGet, adminSend } from '../../lib/api'
import { useCart } from '../../context/CartContext'

const EMPTY = { id: '', kicker: '', title: '', tag: '', detail: '', cta: 'Shop now', to: '/shop', theme: 'leaf' }

export default function OffersPage() {
  const { notify } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminGet('/offers').then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await adminSend('/offers', 'POST', form)
      notify('Offer saved'); setOpen(false); load()
    } catch (err) { notify(err.message, 'error') } finally { setBusy(false) }
  }

  const remove = async (o) => {
    if (!window.confirm(`Remove the "${o.title}" offer?`)) return
    try { await adminSend(`/offers/${o.id}`, 'DELETE'); notify('Offer removed'); load() }
    catch (err) { notify(err.message, 'error') }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.8rem] text-gray-800">Offers</h1>
          <p className="mt-1 text-[.88rem] text-gray-500">The three deal cards on the homepage.</p>
        </div>
        <AdminButton onClick={() => { setForm(EMPTY); setOpen(true) }}><PlusIcon size={16} /> New offer</AdminButton>
      </div>

      {loading ? (
        <div className="grid gap-3.5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-[20px] bg-gray-50" />)}
        </div>
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-3">
          {items.map((o, i) => {
            const t = tone(o.theme)
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}
                className="group relative overflow-hidden rounded-[20px] border border-gray-200 p-5"
                style={{ background: `linear-gradient(150deg, ${t.from}1f, ${t.to}33)` }}
              >
                <span aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: t.to }} />
                <div className="relative z-10">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-[.72rem] font-semibold uppercase tracking-wider text-gray-500">{o.kicker}</span>
                    <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => { setForm({ ...o, to: o.to || o.to_path || '/shop' }); setOpen(true) }} aria-label="Edit"
                        className="grid h-7 w-7 place-items-center rounded-lg border border-white/70 bg-white/90 text-gray-700 shadow-ta backdrop-blur-sm hover:bg-white">
                        <EditIcon size={13} />
                      </button>
                      <button onClick={() => remove(o)} aria-label="Delete"
                        className="grid h-7 w-7 place-items-center rounded-lg border border-gray-300 bg-white text-errorc-600 hover:bg-errorc-50 hover:border-errorc-300">
                        <TrashIcon size={13} />
                      </button>
                    </span>
                  </div>
                  <p className="font-display text-[1.35rem] text-gray-800">{o.title}</p>
                  <Badge color={t.from} className="mt-1.5">{o.tag}</Badge>
                  <p className="mt-2.5 text-[.84rem] leading-relaxed text-gray-500">{o.detail}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[.78rem] font-semibold" style={{ color: t.from }}>
                    <TagIcon size={13} /> {o.cta} → {o.to || o.to_path}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Offer card" wide>
        <form onSubmit={save} className="grid gap-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Kicker</span>
            <input value={form.kicker} onChange={(e) => setForm({ ...form, kicker: e.target.value })} placeholder="Today's Deal" className={adminField} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Title *</span>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Instant Noodles" className={adminField} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Tag</span>
            <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="20% OFF" className={adminField} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Button label</span>
            <input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} className={adminField} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[.78rem] text-gray-500">Detail</span>
            <textarea rows={2} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} className={`${adminField} resize-none`} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[.78rem] text-gray-500">Links to</span>
            <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="/shop?category=noodles" className={adminField} />
          </label>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[.78rem] text-gray-500">Theme</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(TONES).map((k) => {
                const t = TONES[k]
                return (
                  <button key={k} type="button" onClick={() => setForm({ ...form, theme: k })} aria-label={k}
                    className={`h-8 w-8 rounded-lg border-2 transition-transform ${form.theme === k ? 'scale-110 border-white' : 'border-transparent'}`}
                    style={{ background: `linear-gradient(135deg,${t.from},${t.to})` }} />
                )
              })}
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <AdminButton type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</AdminButton>
            <AdminButton disabled={busy} className="flex-[2]">{busy ? 'Saving…' : 'Save offer'}</AdminButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
