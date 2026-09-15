import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { sql } from './db.js'
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

export async function seed({ force = false } = {}) {
  const [{ c }] = await sql`select count(*)::int as c from products`
  if (c > 0 && !force) return { skipped: true }

  for (const [i, cat] of categoryMeta.entries()) {
    await sql`
      insert into categories (id, name, tone, blurb, sort_order)
      values (${cat.id}, ${cat.name}, ${cat.tone}, ${cat.blurb}, ${i})
      on conflict (id) do update set
        name = excluded.name, tone = excluded.tone,
        blurb = excluded.blurb, sort_order = excluded.sort_order
    `
  }

  // Mirrors the old `INSERT OR REPLACE` (full-row replace) semantics,
  // wrapped in one transaction like the old db.transaction() did.
  await sql.begin(async (tx) => {
    for (const p of products) {
      await tx`
        insert into products
          (id, name, brand, category_id, description, price, original_price, discount,
           stock, weight, image, featured, created_at, popular, keywords, model,
           model_color, note, archived)
        values
          (${p.id}, ${p.name}, ${p.brand}, ${p.category}, ${p.description || ''},
           ${p.price}, ${p.originalPrice ?? null}, ${p.discount}, ${p.stock}, ${p.weight},
           ${p.image}, ${!!p.featured}, ${p.createdAt}, ${p.popular},
           ${(p.keywords || []).join(',')}, ${p.model ?? null}, ${p.modelColor},
           ${p.note || ''}, false)
        on conflict (id) do update set
          name = excluded.name, brand = excluded.brand, category_id = excluded.category_id,
          description = excluded.description, price = excluded.price,
          original_price = excluded.original_price, discount = excluded.discount,
          stock = excluded.stock, weight = excluded.weight, image = excluded.image,
          featured = excluded.featured, created_at = excluded.created_at,
          popular = excluded.popular, keywords = excluded.keywords, model = excluded.model,
          model_color = excluded.model_color, note = excluded.note, archived = excluded.archived
      `
    }
  })

  for (const [i, o] of offerSeed.entries()) {
    await sql`
      insert into offers (id, kicker, title, tag, detail, cta, to_path, theme, sort_order)
      values (${o.id}, ${o.kicker}, ${o.title}, ${o.tag}, ${o.detail}, ${o.cta}, ${o.to_path}, ${o.theme}, ${i})
      on conflict (id) do update set
        kicker = excluded.kicker, title = excluded.title, tag = excluded.tag,
        detail = excluded.detail, cta = excluded.cta, to_path = excluded.to_path,
        theme = excluded.theme, sort_order = excluded.sort_order
    `
  }

  await sql`delete from reviews where user_id is null`
  for (const [pid, author, rating, body] of REVIEW_SEED) {
    try {
      await sql`
        insert into reviews (product_id, author, rating, body, created_at)
        values (${pid}, ${author}, ${rating}, ${body}, ${now()})
      `
    } catch {
      /* product missing — skip, same as the old try/catch */
    }
  }

  // Admin + demo customer. Keyed off the UNIQUE email column (not id, which
  // is a fresh random UUID every run) — same effect as the old
  // `INSERT OR IGNORE`: existing accounts are left untouched on re-seed.
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yalambermart.com.np'
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123'

  await sql`
    insert into users (id, name, phone, email, password_hash, role, address, city, landmark, created_at)
    values (${crypto.randomUUID()}, 'Store Admin', '+977 1-5901840', ${adminEmail},
            ${bcrypt.hashSync(adminPass, 10)}, 'admin', 'Shop 12, New Baneshwor Chowk',
            'Kathmandu', 'Near Chowk', ${now()})
    on conflict (email) do nothing
  `
  await sql`
    insert into users (id, name, phone, email, password_hash, role, address, city, landmark, created_at)
    values (${crypto.randomUUID()}, 'Sita Gurung', '+977 9801234567', 'demo@yalambermart.com.np',
            ${bcrypt.hashSync('demo1234', 10)}, 'customer', 'Sankhamul Road, Flat 4B',
            'New Baneshwor', 'Behind the school', ${now()})
    on conflict (email) do nothing
  `

  const storeSettings = JSON.stringify({
    name: 'Yalambar Store',
    tagline: 'Your Everyday Store.',
    address: 'Shop 12, New Baneshwor Chowk, Kathmandu 44600',
    phone: '+977 1-5901840',
    email: 'hello@yalambermart.com.np',
    hours: [
      { day: 'Sunday', open: '07:00', close: '21:00', closed: false },
      { day: 'Monday', open: '07:00', close: '21:00', closed: false },
      { day: 'Tuesday', open: '07:00', close: '21:00', closed: false },
      { day: 'Wednesday', open: '07:00', close: '21:00', closed: false },
      { day: 'Thursday', open: '07:00', close: '21:00', closed: false },
      { day: 'Friday', open: '07:00', close: '21:00', closed: false },
      { day: 'Saturday', open: '08:00', close: '20:00', closed: false },
    ],
    deliveryFee: 60, freeDeliveryOver: 1500,
    currencyPrefix: 'Rs.',
    deliveryEta: '45–90 minutes',
    deliveryArea: 'New Baneshwor',
    announcements: [
      'Free delivery on orders over Rs. 1,500',
      'Produce cut and weighed this morning',
    ],
    heroTitle: 'Everything you need',
    heroAccent: 'for a delicious meal',
    heroSubtitle: 'Fresh produce, daily groceries and household essentials from the corner of New Baneshwor Chowk — delivered in as little as one hour.',
    facebook: '', instagram: '', whatsapp: '',
  })

  await sql`
    insert into settings (key, value) values ('store', ${storeSettings})
    on conflict (key) do update set value = excluded.value
  `

  return { products: products.length, categories: categoryMeta.length, offers: offerSeed.length }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  // `npm run seed` is safe by default: on an existing store it does nothing.
  // Re-seeding rewrites the catalogue, so it must be asked for explicitly:
  //   npm run seed -- --force
  const force = process.argv.includes('--force')
  const [{ c: existing }] = await sql`select count(*)::int as c from products`

  if (existing > 0 && !force) {
    console.log(`[seed] ${existing} products already present — nothing to do.`)
    console.log('[seed] To wipe and re-seed the catalogue: npm run seed -- --force')
  } else {
    if (force && existing > 0) {
      console.log(`[seed] --force: rewriting catalogue over ${existing} existing products…`)
    }
    const r = await seed({ force })
    console.log('[seed] done:', r.skipped ? 'skipped' : `${r.products} products, ${r.categories} categories, ${r.offers} offers`)
  }
  await sql.end()
}
