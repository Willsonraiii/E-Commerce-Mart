import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Panel, AdminButton, Modal, adminField, Badge } from '../ui'
import { PlusIcon, EditIcon, TrashIcon, GridIcon } from '../../components/Icons'
import { tone, TONES } from '../../lib/utils'
import { adminGet, adminSend } from '../../lib/api'
import { useCart } from '../../context/CartContext'

const EMPTY = { id: '', name: '', tone: 'leaf', blurb: '' }

export default function CategoriesPage() {
  const { notify } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminGet('/categories').then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editing) await adminSend(`/categories/${form.id}`, 'PATCH', form)
      else await adminSend('/categories', 'POST', form)
      notify(editing ? 'Aisle updated' : 'Aisle created')
      setOpen(false); load()
    } catch (err) { notify(err.message, 'error') } finally { setBusy(false) }
  }

  const remove = async (c) => {
    if (!window.confirm(`Delete the "${c.name}" aisle?`)) return
    try { await adminSend(`/categories/${c.id}`, 'DELETE'); notify('Aisle deleted'); load() }
    catch (err) { notify(err.message, 'error') }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.8rem] text-paper">Categories</h1>
          <p className="mt-1 text-[.88rem] text-mint/50">The aisles customers browse on the homepage.</p>
        </div>
        <AdminButton onClick={() => { setForm(EMPTY); setEditing(false); setOpen(true) }}>
          <PlusIcon size={16} /> New aisle
        </AdminButton>
      </div>

      {loading ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[20px] bg-white/6" />)}
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((c, i) => {
            const t = tone(c.tone)
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}
                className="group relative overflow-hidden rounded-[20px] border border-white/8 p-4"
                style={{ background: `linear-gradient(150deg, ${t.from}22, ${t.to}33)` }}
              >
                <span aria-hidden className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-xl" style={{ background: t.to }} />
                <div className="relative z-10">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg,${t.from},${t.to})` }}>
                      <GridIcon size={17} />
                    </span>
                    <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => { setForm({ ...c }); setEditing(true); setOpen(true) }} aria-label="Edit"
                        className="grid h-7 w-7 place-items-center rounded-lg border border-white/15 bg-black/20 text-mint hover:bg-black/40">
                        <EditIcon size={13} />
                      </button>
                      <button onClick={() => remove(c)} aria-label="Delete"
                        className="grid h-7 w-7 place-items-center rounded-lg border border-white/15 bg-black/20 text-[#f0a58a] hover:bg-terracotta/40">
                        <TrashIcon size={13} />
                      </button>
                    </span>
                  </div>
                  <p className="font-display text-[1.05rem] text-paper">{c.name}</p>
                  <p className="text-[.76rem] text-mint/55">{c.blurb || c.id}</p>
                  <Badge color={t.from} className="mt-2">{c.count} products</Badge>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit aisle' : 'New aisle'}>
        <form onSubmit={save} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-mint/60">Name *</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={adminField} />
          </label>
          {!editing && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[.78rem] text-mint/60">ID (auto from name)</span>
              <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="frozen" className={adminField} />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-mint/60">Tagline</span>
            <input value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} placeholder="Cut this morning" className={adminField} />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-mint/60">Colour tone</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(TONES).map((k) => {
                const t = TONES[k]
                return (
                  <button key={k} type="button" onClick={() => setForm({ ...form, tone: k })}
                    aria-label={k}
                    className={`h-8 w-8 rounded-lg border-2 transition-transform ${form.tone === k ? 'scale-110 border-white' : 'border-transparent'}`}
                    style={{ background: `linear-gradient(135deg,${t.from},${t.to})` }} />
                )
              })}
            </div>
          </div>
          <div className="mt-1 flex gap-2">
            <AdminButton type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</AdminButton>
            <AdminButton disabled={busy} className="flex-[2]">{busy ? 'Saving…' : editing ? 'Save' : 'Create aisle'}</AdminButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
