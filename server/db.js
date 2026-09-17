import 'dotenv/config'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. In Supabase: click Connect -> Session pooler ' +
    '(port 5432). Put it in .env locally and in the Vercel dashboard for production.',
  )
}

// `prepare: false` isn't strictly required on the Session pooler (unlike
// Transaction mode, it does support prepared statements), but it's harmless
// to leave off here — every Vercel invocation may land on a different
// connection anyway, so there's nothing to gain from preparing.
export const sql = postgres(connectionString, {
  ssl: 'require',
  prepare: false,
})

export const STOCK_LABEL = { in: 'In Stock', low: 'Low Stock', out: 'Out of Stock' }

export function mapProduct(r) {
  if (!r) return null
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    category: r.category_id,
    description: r.description,
    price: Number(r.price),
    originalPrice: r.original_price != null ? Number(r.original_price) : null,
    discount: Number(r.discount) || 0,
    stock: r.stock,
    stockLabel: STOCK_LABEL[r.stock] || 'In Stock',
    weight: r.weight,
    image: r.image,
    featured: !!r.featured,
    createdAt: r.created_at,
    popular: Number(r.popular) || 0,
    keywords: r.keywords ? String(r.keywords).split(',').filter(Boolean) : [],
    model: r.model,
    modelColor: r.model_color,
    note: r.note,
    rating: r.rating != null ? Number(r.rating) : null,
    reviewCount: r.review_count != null ? Number(r.review_count) : 0,
  }
}

export function publicUser(u) {
  if (!u) return null
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    address: u.address, city: u.city, landmark: u.landmark, createdAt: u.created_at,
  }
}

export function mapOrder(o, items = []) {
  if (!o) return null
  return {
    id: o.id,
    createdAt: o.created_at,
    status: o.status,
    eta: o.eta,
    paymentMethod: o.payment_method,
    customer: { name: o.customer_name, phone: o.customer_phone, email: o.customer_email },
    address: { line: o.address_line, landmark: o.landmark, city: o.city, notes: o.notes },
    items: items.map((i) => ({
      id: i.product_id, name: i.name, qty: i.qty, price: Number(i.unit_price),
      subtotal: Number(i.subtotal), image: i.image, brand: i.brand, weight: i.weight,
    })),
    totals: {
      subtotal: Number(o.subtotal), discount: Number(o.discount),
      delivery: Number(o.delivery_fee), total: Number(o.total),
      count: items.reduce((s, i) => s + i.qty, 0),
    },
  }
}