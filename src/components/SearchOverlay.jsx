import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Overlay } from './ui/Aceternity'
import { SearchIcon, CloseIcon, ArrowRight, BagIcon } from './Icons'
import { formatNPR } from '../lib/utils'
import { fetchProducts } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'

const QUICK = ['Wai Wai', 'milk', 'vegetables', 'chocolate', 'rice', 'oil']

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen, addToCart } = useCart()
  const { categories } = useCatalog()
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 120)
    else { setQ(''); setItems([]); setActive(0) }
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return undefined
    const ctrl = new AbortController()
    setBusy(true)
    const t = setTimeout(() => {
      fetchProducts({ q, limit: 7 }, { signal: ctrl.signal })
        .then((d) => { setItems(d.items || []); setActive(0) })
        .catch(() => {})
        .finally(() => setBusy(false))
    }, 190)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [q, searchOpen])

  const go = (id) => { setSearchOpen(false); navigate(`/product/${id}`) }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (items[active]) go(items[active].id)
      else { setSearchOpen(false); navigate(`/shop?q=${encodeURIComponent(q)}`) }
    }
  }

  return (
    <Overlay open={searchOpen} onClose={() => setSearchOpen(false)} align="top" className="max-w-2xl">
      <div className="glass-panel overflow-hidden rounded-[22px] sm:rounded-[26px]">
        {/* frosted search bar */}
        <div className="p-2.5 sm:p-3">
          <div
            className={`glass-field flex items-center gap-2 rounded-[16px] px-3 py-2.5 transition-all sm:gap-3 sm:px-4 sm:py-3 ${
              focused ? 'glass-field-focus' : ''
            }`}
          >
            <SearchIcon size={18} className="shrink-0 text-leaf sm:hidden" />
            <SearchIcon size={20} className="hidden shrink-0 text-leaf sm:block" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search noodles, milk, vegetables…"
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent text-[.95rem] text-ink outline-none placeholder:text-ink-3 sm:text-[1.02rem]"
            />
            {busy && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/50 border-t-leaf" />}
            <button onClick={() => setSearchOpen(false)} aria-label="Close search"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-white/50 hover:text-forest">
              <CloseIcon size={17} />
            </button>
          </div>
        </div>

        <div className="max-h-[62vh] overflow-y-auto overscroll-contain sm:max-h-[58vh]">
          {!q && (
            <div className="border-t border-line/50 px-3.5 py-3.5 sm:px-5 sm:py-4">
              <p className="mb-2 text-[.7rem] font-semibold uppercase tracking-[.14em] text-ink-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {QUICK.map((t) => (
                  <button key={t} onClick={() => setQ(t)}
                    className="rounded-full border border-line/70 bg-white/70 px-2.5 py-1 text-[.75rem] text-ink-2 transition-colors hover:border-leaf-bright hover:bg-mint hover:text-forest sm:px-3 sm:py-1.5 sm:text-[.8rem]">
                    {t}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 text-[.7rem] font-semibold uppercase tracking-[.14em] text-ink-3">Browse aisles</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 8).map((c) => (
                  <button key={c.id}
                    onClick={() => { setSearchOpen(false); navigate(`/shop?category=${c.id}`) }}
                    className="rounded-full border border-line/70 bg-white/70 px-2.5 py-1 text-[.75rem] text-ink-2 transition-colors hover:border-leaf-bright hover:text-forest sm:px-3 sm:py-1.5 sm:text-[.8rem]">
                    {c.name} <span className="text-ink-3">({c.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {items.length > 0 ? (
              <ul className="p-2">
                {items.map((p, i) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(p.id)}
                      onKeyDown={(e) => e.key === 'Enter' && go(p.id)}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-2xl p-2 transition-colors sm:gap-3 sm:p-2.5 ${
                        active === i ? 'bg-mint/80 ring-1 ring-leaf-bright/25' : 'hover:bg-white/70'
                      }`}
                    >
                      <img src={p.image} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover sm:h-12 sm:w-12" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[.87rem] font-semibold text-ink sm:text-[.92rem]">{p.name}</p>
                        <p className="truncate text-[.72rem] text-ink-3 sm:text-[.75rem]">{p.brand} · {p.weight}</p>
                        <p className="mt-0.5 font-display text-[.85rem] font-semibold text-forest xs:hidden">{formatNPR(p.price)}</p>
                      </div>
                      <span className="hidden shrink-0 font-display text-[.98rem] font-semibold text-forest xs:block">{formatNPR(p.price)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p) }}
                        aria-label={`Add ${p.name}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest text-white transition-transform hover:scale-110"
                      >
                        <BagIcon size={15} />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : q && !busy ? (
              <div className="px-5 py-8 text-center sm:py-10">
                <p className="font-display text-base text-forest sm:text-lg">Nothing on the racks for “{q}”</p>
                <p className="mt-1 text-[.85rem] text-ink-3">Try a shorter word, or browse all aisles.</p>
              </div>
            ) : null}
          </AnimatePresence>
        </div>

        {q && (
          <button
            onClick={() => { setSearchOpen(false); navigate(`/shop?q=${encodeURIComponent(q)}`) }}
            className="flex w-full items-center justify-center gap-2 border-t border-line/60 bg-cream/60 py-3 text-[.8rem] font-semibold text-forest backdrop-blur-sm transition-colors hover:bg-mint/60 sm:text-[.85rem]"
          >
            See all results for “{q}” <ArrowRight size={15} />
          </button>
        )}
      </div>
    </Overlay>
  )
}
