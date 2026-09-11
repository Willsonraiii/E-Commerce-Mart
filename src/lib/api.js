const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'ym_bearer'

const read = () => { try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' } }
let token = read()

export function setToken(t) {
  token = t || ''
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* private */ }
}

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  const t = token || read()
  if (t) { headers.Authorization = `Bearer ${t}`; headers['X-Auth-Token'] = t }

  const res = await fetch(`${BASE}${path}`, {
    method, headers, credentials: 'include',
    body: body ? JSON.stringify(body) : undefined, signal,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.success === false) {
    throw new ApiError(json?.error?.message || `Request failed (${res.status})`, res.status)
  }
  return json?.data
}

const qs = (params = {}) => {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === '' || v === false) return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/* catalog */
export const fetchProducts = (p = {}, o) => request(`/products${qs(p)}`, o)
export const fetchProduct = (id, o) => request(`/products/${encodeURIComponent(id)}`, o)
export const fetchCategories = (o) => request('/categories', o)
export const fetchOffers = (o) => request('/offers', o)
export const fetchMeta = (o) => request('/meta', o)
export const postReview = (id, body) => request(`/products/${encodeURIComponent(id)}/reviews`, { method: 'POST', body })

/* auth */
export const fetchMe = (o) => request('/auth/me', o)
export async function login(body) {
  const d = await request('/auth/login', { method: 'POST', body })
  setToken(d?.token); return d
}
export async function register(body) {
  const d = await request('/auth/register', { method: 'POST', body })
  setToken(d?.token); return d
}
export async function logout() {
  try { return await request('/auth/logout', { method: 'POST', body: {} }) }
  finally { setToken('') }
}
export const updateProfile = (body) => request('/auth/profile', { method: 'PATCH', body })

/* cart + wishlist */
export const fetchCart = (o) => request('/cart', o)
export const replaceCart = (items) => request('/cart', { method: 'PUT', body: { items } })
export const mergeCart = (items) => request('/cart/merge', { method: 'POST', body: { items } })
export const fetchWishlist = (o) => request('/wishlist', o)
export const addWish = (id) => request(`/wishlist/${id}`, { method: 'POST', body: {} })
export const removeWish = (id) => request(`/wishlist/${id}`, { method: 'DELETE' })

/* orders */
export const createOrder = (body) => request('/orders', { method: 'POST', body })
export const fetchOrder = (id, o) => request(`/orders/${encodeURIComponent(id)}`, o)
export const fetchMyOrders = (o) => request('/orders', o)

/* admin */
export const adminGet = (p, o) => request(`/admin${p}`, o)
export const adminSend = (p, method, body) => request(`/admin${p}`, { method, body })
export async function adminUpload(file) {
  const fd = new FormData()
  fd.append('image', file)
  const t = token || read()
  const res = await fetch(`${BASE}/admin/uploads`, {
    method: 'POST', credentials: 'include',
    headers: t ? { Authorization: `Bearer ${t}`, 'X-Auth-Token': t } : {},
    body: fd,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.success === false) throw new ApiError(json?.error?.message || 'Upload failed', res.status)
  return json?.data
}
