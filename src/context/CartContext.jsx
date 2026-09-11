import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../lib/api'
import { useAuth } from './AuthContext'
import useLocalStorage from '../hooks/useLocalStorage'

const CartContext = createContext(null)
const DELIVERY_FEE = 60
const FREE_OVER = 1500

export function CartProvider({ children }) {
  const { user, ready } = useAuth()
  const [items, setItems] = useLocalStorage('ym_bag', [])
  const [wishlist, setWishlist] = useLocalStorage('ym_wish', [])
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const merged = useRef(false)
  const toastTimer = useRef(null)

  const notify = useCallback((message, kind = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ message, kind, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  /* Merge the guest bag into the account on sign-in, then follow the server */
  useEffect(() => {
    if (!ready) return
    if (!user) { merged.current = false; return }
    if (merged.current) return
    merged.current = true
    const local = items.map((i) => ({ id: i.id, qty: i.qty }))
    const run = local.length ? api.mergeCart(local) : api.fetchCart()
    run.then((d) => setItems(d.items || [])).catch(() => {})
    api.fetchWishlist().then((d) => setWishlist((d.items || []).map((p) => p.id))).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ready])

  const syncServer = useCallback((next) => {
    if (!user) return
    api.replaceCart(next.map((i) => ({ id: i.id, qty: i.qty }))).catch(() => {})
  }, [user])

  const addToCart = useCallback((product, qty = 1) => {
    if (product.stock === 'out') { notify(`${product.name} is out of stock.`, 'error'); return }
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id)
      const next = found
        ? prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
        : [...prev, { ...product, qty }]
      syncServer(next)
      return next
    })
    notify(`${product.name} added to your bag`)
  }, [notify, setItems, syncServer])

  const setQty = useCallback((id, qty) => {
    setItems((prev) => {
      const next = qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i))
      syncServer(next)
      return next
    })
  }, [setItems, syncServer])

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id)
      const next = prev.filter((i) => i.id !== id)
      syncServer(next)
      if (gone) notify(`${gone.name} removed`, 'info')
      return next
    })
  }, [notify, setItems, syncServer])

  const clearCart = useCallback(() => {
    setItems([])
    if (user) api.replaceCart([]).catch(() => {})
  }, [setItems, user])

  const toggleWish = useCallback((product) => {
    const has = wishlist.includes(product.id)
    setWishlist((prev) => (has ? prev.filter((x) => x !== product.id) : [...prev, product.id]))
    notify(has ? `Removed from saved` : `Saved ${product.name}`, has ? 'info' : 'success')
    if (user) (has ? api.removeWish(product.id) : api.addWish(product.id)).catch(() => {})
  }, [wishlist, setWishlist, notify, user])

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    const savings = items.reduce(
      (s, i) => s + (i.originalPrice ? (i.originalPrice - i.price) * i.qty : 0), 0)
    const delivery = items.length === 0 || subtotal >= FREE_OVER ? 0 : DELIVERY_FEE
    return {
      subtotal, savings, delivery, total: subtotal + delivery,
      count: items.reduce((s, i) => s + i.qty, 0),
      freeIn: Math.max(0, FREE_OVER - subtotal),
    }
  }, [items])

  const value = useMemo(() => ({
    items, totals, wishlist,
    addToCart, setQty, removeItem, clearCart, toggleWish,
    cartOpen, setCartOpen, searchOpen, setSearchOpen, menuOpen, setMenuOpen,
    toast, notify, cartCount: totals.count,
    DELIVERY_FEE, FREE_OVER,
  }), [items, totals, wishlist, addToCart, setQty, removeItem, clearCart, toggleWish,
    cartOpen, searchOpen, menuOpen, toast, notify])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
