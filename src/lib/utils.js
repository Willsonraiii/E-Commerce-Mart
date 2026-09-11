import clsx from 'clsx'

export const cn = (...a) => clsx(...a)

export const formatNPR = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`

export const storeInfo = {
  name: 'Yalambar Store',
  tagline: 'Your Everyday Store.',
  address: 'Shop 12, New Baneshwor Chowk, Kathmandu 44600',
  phone: '+977 1-5901840',
  email: 'hello@yalambermart.com.np',
  hours: [
    { days: 'Sun – Fri', time: '7:00 AM – 9:00 PM' },
    { days: 'Saturday', time: '8:00 AM – 8:00 PM' },
  ],
}

export const navLinks = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'shop', label: 'Shop', to: '/shop' },
  { id: 'categories', label: 'Categories', to: '/#categories' },
  { id: 'offers', label: 'Offers', to: '/#offers' },
  { id: 'about', label: 'About', to: '/#about' },
  { id: 'contact', label: 'Contact', to: '/#contact' },
]

export const TONES = {
  coral: { from: '#f0a58a', to: '#c45d2c', ink: '#5b2411' },
  leaf: { from: '#8fd3a6', to: '#2f6b47', ink: '#123023' },
  rose: { from: '#f3aab5', to: '#b8425a', ink: '#4d1420' },
  sky: { from: '#a9cdf0', to: '#3c6f9e', ink: '#12293d' },
  wheat: { from: '#f2d9a0', to: '#b98a34', ink: '#4a3410' },
  sun: { from: '#f8d477', to: '#d99b1c', ink: '#4d3708' },
  mocha: { from: '#cbab8e', to: '#7a5334', ink: '#33210f' },
  teal: { from: '#96d6cf', to: '#2a7a72', ink: '#0e302c' },
  olive: { from: '#c3cf92', to: '#6b7c32', ink: '#2a300f' },
  lilac: { from: '#c9b6e8', to: '#6f52a8', ink: '#291a45' },
  slate: { from: '#b6c1cb', to: '#4d616f', ink: '#1b262d' },
  cocoa: { from: '#c39a86', to: '#6b3a2a', ink: '#2c1610' },
  gold: { from: '#f5dd9b', to: '#c4962a', ink: '#4a370a' },
}

export const tone = (t) => TONES[t] || TONES.leaf

export const stockMeta = {
  in: { label: 'In Stock', color: '#2f6b47', bg: 'rgba(61,138,88,.12)' },
  low: { label: 'Low Stock', color: '#b45309', bg: 'rgba(240,180,41,.16)' },
  out: { label: 'Out of Stock', color: '#9b2c2c', bg: 'rgba(196,93,44,.14)' },
}

export const PAYMENTS = [
  { id: 'cod', label: 'Cash on Delivery', hint: 'Pay the rider when the bag arrives.' },
  { id: 'esewa', label: 'eSewa', hint: 'Scan and pay from your eSewa wallet.' },
  { id: 'khalti', label: 'Khalti', hint: 'Instant wallet payment, receipt by SMS.' },
  { id: 'fonepay', label: 'FonePay QR', hint: 'Any bank app that supports FonePay.' },
]

export const ORDER_STATUS = {
  confirmed: { label: 'Confirmed', tone: 'leaf', step: 1 },
  packing: { label: 'Packing', tone: 'gold', step: 2 },
  'out-for-delivery': { label: 'Out for delivery', tone: 'sky', step: 3 },
  delivered: { label: 'Delivered', tone: 'leaf', step: 4 },
  cancelled: { label: 'Cancelled', tone: 'coral', step: 0 },
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'Y'
}

export function relTime(iso) {
  if (!iso) return ''
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fullDate(iso) {
  if (!iso) return ''
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`)
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
