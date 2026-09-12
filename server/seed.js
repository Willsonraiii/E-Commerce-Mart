import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { db } from './db.js'
import { products } from './seed-products.js'

export const categoryMeta = [
  { id: 'noodles', name: 'Instant Noodles', tone: 'coral', blurb: 'Three-minute dinners' },
  { id: 'vegetables', name: 'Vegetables', tone: 'leaf', blurb: 'Cut this morning' },
  { id: 'fruits', name: 'Fruits', tone: 'rose', blurb: 'Hill orchards' },
  { id: 'dairy', name: 'Dairy', tone: 'sky', blurb: 'Cold chain kept' },
  { id: 'bakery', name: 'Bakery', tone: 'wheat', blurb: 'Baked at dawn' },
  { id: 'snacks', name: 'Snacks', tone: 'sun', blurb: 'For the remote hand' },
  { id: 'tea', name: 'Tea & Coffee', tone: 'mocha', blurb: 'Morning colour' },
  { id: 'beverages', name: 'Beverages', tone: 'teal', blurb: 'Fridge cold' },
  { id: 'groceries', name: 'Groceries', tone: 'olive', blurb: 'Pantry backbone' },
  { id: 'care', name: 'Personal Care', tone: 'lilac', blurb: 'Daily basics' },
  { id: 'household', name: 'Household', tone: 'slate', blurb: 'Keeps it running' },
  { id: 'chocolates', name: 'Chocolates', tone: 'cocoa', blurb: 'Counter temptation' },
]

export const offerSeed = [
  {
    id: 'deal-noodles', kicker: "Today's Deal", title: 'Instant Noodles', tag: '20% OFF',
    detail: 'Wai Wai, Rara and every pack on the rack. Stock up for the week.',
    cta: 'Shop noodles', to_path: '/shop?category=noodles&discounted=1', theme: 'coral',
  },
  {
    id: 'deal-snacks', kicker: 'Weekend special', title: 'Snacks', tag: 'Buy 2 Get 1',
    detail: 'Chips, biscuits and namkeen — mix any three, pay for two.',
    cta: 'Grab snacks', to_path: '/shop?category=snacks', theme: 'gold',
  },
  {
    id: 'deal-oil', kicker: 'Kitchen essential', title: 'Cooking Oil', tag: '10% OFF',
    detail: 'Mustard and sunflower, 1 litre bottles. Honest pantry prices.',
    cta: 'Shop oil', to_path: '/shop?category=groceries&q=oil', theme: 'leaf',
  },
]

const REVIEW_SEED = [
  ['wai-wai', 'Sabina R.', 5, 'Cheapest in Baneshwor and always in stock. Ordered at 9pm, arrived hot-fast.'],
  ['wai-wai', 'Prakash T.', 4, 'Box of 30 lasted the whole hostel a week.'],
  ['milk', 'Anita K.', 5, 'DDC bottle actually cold on arrival. Impressed.'],
  ['tomato', 'Bikash S.', 4, 'Weighed properly at the counter, no soft ones in the bag.'],
  ['bread', 'Rita M.', 5, 'Still warm. Golden Crust never misses.'],
  ['oil', 'Hari B.', 4, 'Good price for 1L mustard. Delivery guy was polite.'],
  ['cola', 'Nabin G.', 5, 'Glass bottle cola hits different. Fizzy and cold.'],
  ['tea', 'Sunita L.', 5, 'Proper morning colour, strong boil. Buying again.'],
]

const now = () => new Date().toISOString()

export function seed({ force = false } = {}) {
  const count = db.prepare('SELECT COUNT(*) c FROM products').get().c
  if (count > 0 && !force) return { skipped: true }

  const insCat = db.prepare(
    'INSERT OR REPLACE INTO categories (id,name,tone,blurb,sort_order) VALUES (?,?,?,?,?)',
  )
  categoryMeta.forEach((c, i) => insCat.run(c.id, c.name, c.tone, c.blurb, i))

  const insProd = db.prepare(`INSERT OR REPLACE INTO products
    (id,name,brand,category_id,description,price,original_price,discount,stock,weight,image,
     featured,created_at,popular,keywords,model,model_color,note,archived)
    VALUES (@id,@name,@brand,@category,@description,@price,@originalPrice,@discount,@stock,@weight,@image,
     @featured,@createdAt,@popular,@keywords,@model,@modelColor,@note,0)`)

  const tx = db.transaction((list) => {
    for (const p of list) {
      insProd.run({
        ...p,
        featured: p.featured ? 1 : 0,
        keywords: (p.keywords || []).join(','),
        originalPrice: p.originalPrice ?? null,
        model: p.model ?? null,
        note: p.note || '',
        description: p.description || '',
      })
    }
  })
  tx(products)

  const insOffer = db.prepare(`INSERT OR REPLACE INTO offers
    (id,kicker,title,tag,detail,cta,to_path,theme,sort_order) VALUES (?,?,?,?,?,?,?,?,?)`)
  offerSeed.forEach((o, i) =>
    insOffer.run(o.id, o.kicker, o.title, o.tag, o.detail, o.cta, o.to_path, o.theme, i))

  const insRev = db.prepare(
    'INSERT INTO reviews (product_id,author,rating,body,created_at) VALUES (?,?,?,?,?)',
  )
  db.prepare('DELETE FROM reviews WHERE user_id IS NULL').run()
  REVIEW_SEED.forEach(([pid, author, rating, body]) => {
    try { insRev.run(pid, author, rating, body, now()) } catch { /* product missing */ }
  })

  // Admin + demo customer
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yalambermart.com.np'
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123'
  const insUser = db.prepare(`INSERT OR IGNORE INTO users
    (id,name,phone,email,password_hash,role,address,city,landmark,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
  insUser.run(crypto.randomUUID(), 'Store Admin', '+977 1-5901840', adminEmail,
    bcrypt.hashSync(adminPass, 10), 'admin', 'Shop 12, New Baneshwor Chowk', 'Kathmandu', 'Near Chowk', now())
  insUser.run(crypto.randomUUID(), 'Sita Gurung', '+977 9801234567', 'demo@yalambermart.com.np',
    bcrypt.hashSync('demo1234', 10), 'customer', 'Sankhamul Road, Flat 4B', 'New Baneshwor', 'Behind the school', now())

  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)')
    .run('store', JSON.stringify({
      name: 'Yalambar Store',
      tagline: 'Your Everyday Store.',
      // contact — editable from the admin console
      address: 'Shop 12, New Baneshwor Chowk, Kathmandu 44600',
      phone: '+977 1-5901840',
      email: 'hello@yalambermart.com.np',
      // opening hours, per weekday. `closed` wins over the times.
      hours: [
        { day: 'Sunday',    open: '07:00', close: '21:00', closed: false },
        { day: 'Monday',    open: '07:00', close: '21:00', closed: false },
        { day: 'Tuesday',   open: '07:00', close: '21:00', closed: false },
        { day: 'Wednesday', open: '07:00', close: '21:00', closed: false },
        { day: 'Thursday',  open: '07:00', close: '21:00', closed: false },
        { day: 'Friday',    open: '07:00', close: '21:00', closed: false },
        { day: 'Saturday',  open: '08:00', close: '20:00', closed: false },
      ],
      // commerce
      deliveryFee: 60, freeDeliveryOver: 1500,
      currencyPrefix: 'Rs.',
      deliveryEta: '45–90 minutes',
      deliveryArea: 'New Baneshwor',
      // marketing strip + hero copy
      announcements: [
        'Free delivery on orders over Rs. 1,500',
        'Produce cut and weighed this morning',
      ],
      heroTitle: 'Everything you need',
      heroAccent: 'for a delicious meal',
      heroSubtitle: 'Fresh produce, daily groceries and household essentials from the corner of New Baneshwor Chowk — delivered in as little as one hour.',
      // social
      facebook: '', instagram: '', whatsapp: '',
    }))

  return { products: products.length, categories: categoryMeta.length, offers: offerSeed.length }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  // `npm run seed` is safe by default: on an existing store it does nothing.
  // Re-seeding rewrites the catalogue, so it must be asked for explicitly:
  //   npm run seed -- --force
  const force = process.argv.includes('--force')
  const existing = db.prepare('SELECT COUNT(*) c FROM products').get().c

  if (existing > 0 && !force) {
    console.log(`[seed] ${existing} products already present — nothing to do.`)
    console.log('[seed] To wipe and re-seed the catalogue: npm run seed -- --force')
    console.log('[seed] (take a snapshot first: npm run backup)')
  } else {
    if (force && existing > 0) console.log(`[seed] --force: rewriting catalogue over ${existing} existing products…`)
    const r = seed({ force })
    console.log('[seed] done:', r.skipped ? 'skipped' : `${r.products} products, ${r.categories} categories, ${r.offers} offers`)
  }
}
