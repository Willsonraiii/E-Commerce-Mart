import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../lib/api'
import { storeInfo as storeDefaults, formatHours } from '../lib/utils'

const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [offers, setOffers] = useState([])
  const [featured, setFeatured] = useState([])
  const [vegetables, setVegetables] = useState([])
  const [meta, setMeta] = useState({ priceBounds: { min: 0, max: 400 }, sorts: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      api.fetchCategories().catch(() => ({ items: [] })),
      api.fetchOffers().catch(() => ({ items: [] })),
      api.fetchProducts({ featured: 1, limit: 12 }).catch(() => ({ items: [] })),
      api.fetchProducts({ category: 'vegetables', limit: 8 }).catch(() => ({ items: [] })),
      api.fetchMeta().catch(() => null),
    ]).then(([c, o, f, v, m]) => {
      if (!alive) return
      setCategories(c.items || [])
      setOffers(o.items || [])
      setFeatured(f.items || [])
      setVegetables(v.items || [])
      if (m) setMeta(m)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  /**
   * Live store settings, admin-editable. Falls back to the bundled defaults so
   * the site still renders if the API is unreachable or a field is missing.
   */
  const store = useMemo(() => {
    const s = meta?.store || {}
    return {
      ...storeDefaults,
      ...s,
      hours: Array.isArray(s.hours) && s.hours.length ? s.hours : storeDefaults.hours,
      announcements: Array.isArray(s.announcements) && s.announcements.length
        ? s.announcements
        : storeDefaults.announcements,
    }
  }, [meta])

  const hoursText = useMemo(() => formatHours(store.hours), [store.hours])

  const categoryName = useMemo(() => {
    const map = {}
    categories.forEach((c) => { map[c.id] = c.name })
    return (id) => map[id] || id
  }, [categories])

  const value = useMemo(
    () => ({ categories, offers, featured, vegetables, meta, store, hoursText, loading, categoryName }),
    [categories, offers, featured, vegetables, meta, store, hoursText, loading, categoryName],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export const useCatalog = () => {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider')
  return ctx
}
