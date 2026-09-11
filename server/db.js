import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { DB_FILE } from './config.js'

// Create the parent directory for whatever DB_FILE points at, so pointing it
// at a mounted volume (e.g. /var/data/yalamber.db) just works.
const dataDir = path.dirname(DB_FILE)
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

export const dbFile = DB_FILE
export const db = new Database(DB_FILE)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'New Baneshwor',
  landmark TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'leaf',
  blurb TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  category_id TEXT REFERENCES categories(id),
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL,
  original_price REAL,
  discount INTEGER NOT NULL DEFAULT 0,
  stock TEXT NOT NULL DEFAULT 'in',
  weight TEXT NOT NULL DEFAULT '',
  image TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (date('now')),
  popular INTEGER NOT NULL DEFAULT 50,
  keywords TEXT NOT NULL DEFAULT '',
  model TEXT,
  model_color TEXT DEFAULT '#c45d2c',
  note TEXT NOT NULL DEFAULT '',
  archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  kicker TEXT, title TEXT NOT NULL, tag TEXT, detail TEXT,
  cta TEXT, to_path TEXT, theme TEXT DEFAULT 'leaf', sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  address_line TEXT NOT NULL,
  landmark TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  delivery_fee REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  eta TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  image TEXT, brand TEXT, weight TEXT
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL CHECK (qty > 0),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wishlist (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS products_cat_idx ON products(category_id);
`)

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
