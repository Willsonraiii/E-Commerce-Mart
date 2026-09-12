import { useEffect, useState, useCallback } from 'react'
import { Panel, Table, Td, Tr, Badge, AdminButton, Modal, adminField } from '../ui'
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, UploadIcon, CheckIcon } from '../../components/Icons'
import { formatNPR } from '../../lib/utils'
import { adminGet, adminSend, adminUpload } from '../../lib/api'
import { useCatalog } from '../../context/CatalogContext'
import { useCart } from '../../context/CartContext'

const EMPTY = {
  id: '', name: '', brand: '', category: 'groceries', description: '', price: '', originalPrice: '',
  stock: 'in', weight: '', image: '', featured: false, popular: 50, keywords: '', model: '', modelColor: '#c45d2c', note: '',
}

const MODELS = ['', 'pack', 'bottle', 'carton', 'bag', 'sphere']

export default function ProductsPage() {
  const { categories } = useCatalog()
  const { notify } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback((query = '') => {
    setLoading(true)
    adminGet(`/products${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setTimeout(() => load(q), 260)
    return () => clearTimeout(t)
  }, [q, load])

  const openNew = () => { setForm(EMPTY); setEditing(false); setOpen(true) }
  const openEdit = (p) => {
    setForm({
      ...EMPTY, ...p,
      originalPrice: p.originalPrice ?? '',
      keywords: (p.keywords || []).join(', '),
      model: p.model || '',
    })
    setEditing(true); setOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        popular: Number(form.popular) || 50,
        keywords: form.keywords.split(',').map((s) => s.trim()).filter(Boolean),
        model: form.model || null,
      }
      if (editing) await adminSend(`/products/${form.id}`, 'PATCH', payload)
      else await adminSend('/products', 'POST', payload)
      notify(editing ? 'Product updated' : 'Product added')
      setOpen(false); load(q)
    } catch (err) { notify(err.message || 'Save failed', 'error') } finally { setBusy(false) }
  }

  const archive = async (p) => {
    if (!window.confirm(`Archive "${p.name}"? It will disappear from the storefront.`)) return
    try { await adminSend(`/products/${p.id}`, 'DELETE'); notify('Product archived'); load(q) }
    catch (err) { notify(err.message, 'error') }
  }

  const restore = async (p) => {
    try { await adminSend(`/products/${p.id}`, 'PATCH', { archived: false }); notify('Product restored'); load(q) }
    catch (err) { notify(err.message, 'error') }
  }

  const upload = async (file) => {
    if (!file) return
    try { const d = await adminUpload(file); setForm((f) => ({ ...f, image: d.url })); notify('Image uploaded') }
    catch (err) { notify(err.message || 'Upload failed', 'error') }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.8rem] text-gray-800">Products</h1>
          <p className="mt-1 text-[.88rem] text-gray-500">{items.length} items on the racks. Create, edit, archive.</p>
        </div>
        <AdminButton onClick={openNew}><PlusIcon size={16} /> New product</AdminButton>
      </div>

      <Panel>
        <div className="relative mb-4 max-w-sm">
          <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, brand or ID…"
            className={`${adminField} pl-10`} />
        </div>

        <Table head={['Product', 'Aisle', 'Price', 'Stock', 'Featured', '']} loading={loading}
          empty={!items.length ? 'No products match that search.' : null}>
          {items.map((p) => (
            <Tr key={p.id} className={p.archived ? 'opacity-45' : ''}>
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
              <Td>
                <span className="font-semibold text-gray-800">{formatNPR(p.price)}</span>
                {p.originalPrice && <span className="ml-1.5 text-[.74rem] text-gray-400 line-through">{formatNPR(p.originalPrice)}</span>}
              </Td>
              <Td>
                <Badge color={p.stock === 'in' ? '#4fd18b' : p.stock === 'low' ? '#f0b429' : '#e2795b'}>
                  {p.stockLabel}
                </Badge>
              </Td>
              <Td>{p.featured ? <CheckIcon size={16} className="text-brand-500" /> : <span className="text-gray-300">—</span>}</Td>
              <Td>
                <span className="flex justify-end gap-1.5">
                  <button onClick={() => openEdit(p)} aria-label="Edit"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800">
                    <EditIcon size={15} />
                  </button>
                  {p.archived ? (
                    <button onClick={() => restore(p)} className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 text-[.74rem] font-semibold text-brand-600">
                      Restore
                    </button>
                  ) : (
                    <button onClick={() => archive(p)} aria-label="Archive"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:border-errorc-300 hover:bg-errorc-50 hover:text-errorc-600">
                      <TrashIcon size={15} />
                    </button>
                  )}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit product' : 'New product'} wide>
        <form onSubmit={save} className="grid gap-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[.78rem] text-gray-500">Name *</span>
            <input required name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={adminField} />
          </label>

          {!editing && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[.78rem] text-gray-500">ID (auto from name)</span>
              <input name="id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="wai-wai" className={adminField} />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Brand</span>
            <input name="brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={adminField} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Aisle</span>
            <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={adminField}>
              {categories.map((c) => <option key={c.id} value={c.id} className="bg-[#12291f]">{c.name}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Weight / size</span>
            <input name="weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="1 kg" className={adminField} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Price (Rs.) *</span>
            <input required type="number" step="0.01" name="price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={adminField} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Original price (for discount)</span>
            <input type="number" step="0.01" name="originalPrice" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className={adminField} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Stock</span>
            <select name="stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={adminField}>
              <option value="in" className="bg-[#12291f]">In stock</option>
              <option value="low" className="bg-[#12291f]">Low stock</option>
              <option value="out" className="bg-[#12291f]">Out of stock</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">Popularity (0–100)</span>
            <input type="number" min="0" max="100" name="popular" value={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.value })} className={adminField} />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[.78rem] text-gray-500">Description</span>
            <textarea rows={2} name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${adminField} resize-none`} />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[.78rem] text-gray-500">Image path</span>
            <span className="flex gap-2">
              <input name="image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/images/apple.jpg" className={adminField} />
              <label className="grid w-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100">
                <UploadIcon size={17} />
                <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
              </label>
            </span>
            {form.image && <img src={form.image} alt="" className="mt-1 h-16 w-16 rounded-lg object-cover" />}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">3D model shape</span>
            <select name="model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={adminField}>
              {MODELS.map((m) => <option key={m} value={m} className="bg-[#12291f]">{m || 'card (default)'}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[.78rem] text-gray-500">3D colour</span>
            <span className="flex gap-2">
              <input type="color" value={form.modelColor} onChange={(e) => setForm({ ...form, modelColor: e.target.value })}
                className="h-[42px] w-14 shrink-0 cursor-pointer rounded-xl border border-gray-300 bg-gray-50" />
              <input value={form.modelColor} onChange={(e) => setForm({ ...form, modelColor: e.target.value })} className={adminField} />
            </span>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[.78rem] text-gray-500">Search keywords (comma separated)</span>
            <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="noodles, instant, snack" className={adminField} />
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
            <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="h-4 w-4 accent-[#4fd18b]" />
            <span className="text-[.85rem] text-gray-600">Show in the Featured section on the homepage</span>
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <AdminButton type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</AdminButton>
            <AdminButton disabled={busy} className="flex-[2]">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</AdminButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
