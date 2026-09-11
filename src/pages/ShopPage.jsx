import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { Reveal } from '../components/ui/Aceternity'
import { FilterIcon, CloseIcon, ArrowRight, ArrowLeft, SearchIcon, GridIcon } from '../components/Icons'
import { cn, formatNPR } from '../lib/utils'
import { fetchProducts } from '../lib/api'
import { useCatalog } from '../context/CatalogContext'

const AVAIL = [
  { id: 'all', label: 'All items' },
  { id: 'available', label: 'Available' },
  { id: 'in', label: 'In stock' },
  { id: 'low', label: 'Low stock' },
]

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const { categories, meta } = useCatalog()
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageCount: 1 })
  const [loading, setLoading] = useState(true)
  const [openFilters, setOpenFilters] = useState(false)

  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'popular'
  const availability = params.get('availability') || 'all'
  const discounted = params.get('discounted') === '1'
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const page = Number(params.get('page') || 1)

  const [draftQ, setDraftQ] = useState(q)
  useEffect(() => setDraftQ(q), [q])

  const update = useCallback((patch, resetPage = true) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null || v === false || v === 'all') next.delete(k)
      else next.set(k, v === true ? '1' : String(v))
    })
    if (resetPage) next.delete('page')
    setParams(next, { replace: true })
  }, [params, setParams])

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    fetchProducts(
      { q, category, sort, availability, discounted, minPrice, maxPrice, page, pageSize: 12 },
      { signal: ctrl.signal },
    )
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [q, category, sort, availability, discounted, minPrice, maxPrice, page])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [page])

  const activeCat = categories.find((c) => c.id === category)
  const chips = useMemo(() => {
    const out = []
    if (q) out.push({ k: 'q', label: `“${q}”` })
    if (activeCat) out.push({ k: 'category', label: activeCat.name })
    if (discounted) out.push({ k: 'discounted', label: 'On offer' })
    if (availability !== 'all') out.push({ k: 'availability', label: AVAIL.find((a) => a.id === availability)?.label })
    if (minPrice) out.push({ k: 'minPrice', label: `Min ${formatNPR(minPrice)}` })
    if (maxPrice) out.push({ k: 'maxPrice', label: `Max ${formatNPR(maxPrice)}` })
    return out
  }, [q, activeCat, discounted, availability, minPrice, maxPrice])

  const Filters = (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2.5 text-[.72rem] font-bold uppercase tracking-[.14em] text-ink-3">Aisles</h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => update({ category: '' })}
            className={cn('rounded-xl px-3 py-2 text-left text-[.88rem] transition-colors',
              !category ? 'bg-forest font-semibold text-mint' : 'text-ink-2 hover:bg-mint/70')}
          >
            All products <span className="text-ink-3">({meta.totalProducts ?? 47})</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => update({ category: c.id })}
              className={cn('flex items-center justify-between rounded-xl px-3 py-2 text-left text-[.88rem] transition-colors',
                category === c.id ? 'bg-forest font-semibold text-mint' : 'text-ink-2 hover:bg-mint/70')}
            >
              {c.name}
              <span className={category === c.id ? 'text-mint/60' : 'text-ink-3'}>{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-[.72rem] font-bold uppercase tracking-[.14em] text-ink-3">Price range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number" inputMode="numeric" placeholder={`${meta.priceBounds?.min ?? 0}`} value={minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
            className="field py-2 text-[.85rem]" aria-label="Minimum price"
          />
          <span className="text-ink-3">–</span>
          <input
            type="number" inputMode="numeric" placeholder={`${meta.priceBounds?.max ?? 400}`} value={maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
            className="field py-2 text-[.85rem]" aria-label="Maximum price"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-[.72rem] font-bold uppercase tracking-[.14em] text-ink-3">Availability</h3>
        <div className="flex flex-wrap gap-1.5">
          {AVAIL.map((a) => (
            <button
              key={a.id}
              onClick={() => update({ availability: a.id })}
              className={cn('rounded-full border px-3 py-1.5 text-[.8rem] transition-colors',
                availability === a.id ? 'border-leaf-bright bg-mint font-semibold text-forest' : 'border-line bg-white text-ink-2 hover:border-leaf-bright')}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white p-3">
        <input
          type="checkbox" checked={discounted}
          onChange={(e) => update({ discounted: e.target.checked })}
          className="h-4 w-4 accent-[#2f6b47]"
        />
        <span className="text-[.88rem] font-medium text-ink">Only discounted items</span>
      </label>

      {chips.length > 0 && (
        <button onClick={() => setParams({}, { replace: true })} className="btn btn-ghost text-[.85rem]">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <>
      <Seo
        title={`${activeCat ? activeCat.name : 'Shop'} — Yalambar Store`}
        description="Browse every aisle at Yalambar Store: noodles, produce, dairy, bakery, snacks and household essentials."
        path="/shop"
      />

      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-mint/50 to-cream py-10">
        <div className="wrap">
          <nav className="mb-3 flex items-center gap-1.5 text-[.8rem] text-ink-3" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-leaf">Home</Link> <span>/</span>
            <span className="font-medium text-ink-2">{activeCat ? activeCat.name : 'Shop'}</span>
          </nav>
          <Reveal>
            <h1 className="font-display text-[2.1rem] leading-tight text-forest sm:text-[2.7rem]">
              {activeCat ? activeCat.name : 'Every aisle, one page'}
            </h1>
            <p className="mt-2 max-w-xl text-[.95rem] text-ink-2">
              {activeCat?.blurb || 'Forty-seven products on the racks right now. Filter, sort, and add to your bag.'}
            </p>
          </Reveal>

          <form
            onSubmit={(e) => { e.preventDefault(); update({ q: draftQ }) }}
            className="mt-5 flex max-w-md gap-2"
          >
            <div className="relative flex-1">
              <SearchIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                value={draftQ} onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Search the shelves…" aria-label="Search products"
                className="field pl-10"
              />
            </div>
            <button type="submit" className="btn btn-primary px-5 text-[.88rem]">Search</button>
          </form>
        </div>
      </section>

      <section className="wrap grid gap-8 py-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header)+20px)] rounded-[24px] border border-line bg-paper p-5 shadow-premium">
            {Filters}
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[.88rem] text-ink-2">
              {loading ? 'Loading…' : <><b className="text-forest">{data.total}</b> {data.total === 1 ? 'product' : 'products'}</>}
              {activeCat && <> in <b className="text-forest">{activeCat.name}</b></>}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenFilters(true)}
                className="btn btn-ghost gap-1.5 px-4 py-2 text-[.85rem] lg:hidden"
              >
                <FilterIcon size={16} /> Filters
                {chips.length > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-forest text-[.65rem] text-mint">{chips.length}</span>}
              </button>
              <label className="flex items-center gap-2 text-[.85rem] text-ink-3">
                <GridIcon size={15} className="hidden sm:block" />
                <select
                  value={sort} onChange={(e) => update({ sort: e.target.value })}
                  aria-label="Sort products"
                  className="field w-auto cursor-pointer py-2 pr-8 text-[.85rem] font-medium text-ink"
                >
                  {(meta.sorts || []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <motion.button
                  key={c.k} layout
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={() => update({ [c.k]: '' })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-leaf-bright/40 bg-mint px-3 py-1.5 text-[.8rem] font-medium text-forest transition-colors hover:bg-leaf-bright hover:text-white"
                >
                  {c.label} <CloseIcon size={13} />
                </motion.button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[330px] animate-pulse rounded-[24px] bg-cream-2/70" />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-line bg-paper py-20 text-center">
              <p className="font-display text-xl text-forest">Nothing matches those filters</p>
              <p className="mx-auto mt-2 max-w-sm text-[.9rem] text-ink-3">
                Try widening the price range or clearing a filter — the shop is small but the shelves rotate.
              </p>
              <button onClick={() => setParams({}, { replace: true })} className="btn btn-primary mt-5 text-[.88rem]">
                Reset filters
              </button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {data.items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </AnimatePresence>
            </motion.div>
          )}

          {data.pageCount > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
              <button
                disabled={page <= 1} onClick={() => update({ page: page - 1 }, false)}
                className="btn btn-ghost h-10 w-10 !p-0 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ArrowLeft size={16} />
              </button>
              {Array.from({ length: data.pageCount }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === data.pageCount || Math.abs(n - page) <= 1)
                .map((n, i, arr) => (
                  <span key={n} className="flex items-center gap-1.5">
                    {i > 0 && arr[i - 1] !== n - 1 && <span className="px-1 text-ink-3">…</span>}
                    <button
                      onClick={() => update({ page: n }, false)}
                      aria-current={page === n ? 'page' : undefined}
                      className={cn('h-10 min-w-[40px] rounded-full text-[.88rem] font-semibold transition-colors',
                        page === n ? 'bg-forest text-mint' : 'border border-line bg-paper text-ink-2 hover:border-leaf-bright')}
                    >
                      {n}
                    </button>
                  </span>
                ))}
              <button
                disabled={page >= data.pageCount} onClick={() => update({ page: page + 1 }, false)}
                className="btn btn-ghost h-10 w-10 !p-0 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ArrowRight size={16} />
              </button>
            </nav>
          )}
        </div>
      </section>

      {/* mobile filter sheet */}
      <AnimatePresence>
        {openFilters && (
          <div className="fixed inset-0 z-[85] lg:hidden">
            <motion.div
              className="absolute inset-0 bg-forest-deep/55 backdrop-blur-md"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpenFilters(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-paper p-5 pb-8"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl text-forest">Filters</h2>
                <button onClick={() => setOpenFilters(false)} aria-label="Close filters"
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2">
                  <CloseIcon size={18} />
                </button>
              </div>
              {Filters}
              <button onClick={() => setOpenFilters(false)} className="btn btn-primary mt-6 w-full">
                Show {data.total} products
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
