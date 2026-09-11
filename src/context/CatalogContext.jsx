import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../lib/api'

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

  const categoryName = useMemo(() => {
    const map = {}
    categories.forEach((c) => { map[c.id] = c.name })
    return (id) => map[id] || id
  }, [categories])

  const value = useMemo(
    () => ({ categories, offers, featured, vegetables, meta, loading, categoryName }),
    [categories, offers, featured, vegetables, meta, loading, categoryName],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export const useCatalog = () => {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider')
  return ctx
}
