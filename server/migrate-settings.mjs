/**
 * Backfill new store-settings fields onto an existing database.
 *
 * seed() only runs on an empty shop, so a live store would never gain the new
 * editable keys (hours, address, hero copy…). This merges the defaults in
 * WITHOUT overwriting anything the admin has already set.
 *
 *   node server/migrate-settings.mjs
 */
import { db } from './db.js'

const DEFAULTS = {
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
  deliveryFee: 60,
  freeDeliveryOver: 1500,
  currencyPrefix: 'Rs.',
  deliveryEta: '45–90 minutes',
  deliveryArea: 'New Baneshwor',
  announcements: [
    'Free delivery on orders over Rs. 1,500',
    'Produce cut and weighed this morning',
  ],
  heroTitle: 'Everything you need',
  heroAccent: 'for a delicious meal',
  heroSubtitle:
    'Fresh produce, daily groceries and household essentials from the corner of New Baneshwor Chowk — delivered in as little as one hour.',
  facebook: '',
  instagram: '',
  whatsapp: '',
}

const row = db.prepare("SELECT value FROM settings WHERE key='store'").get()
const current = row ? JSON.parse(row.value) : {}

const merged = { ...DEFAULTS, ...current }
const added = Object.keys(DEFAULTS).filter((k) => !(k in current))

db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('store',?)").run(
  JSON.stringify(merged),
)
db.pragma('wal_checkpoint(TRUNCATE)')

console.log(`[migrate] store settings updated. Added ${added.length} new field(s):`)
added.forEach((k) => console.log(`  + ${k}`))
if (!added.length) console.log('  (nothing to add — already up to date)')
console.log('[migrate] existing values preserved:', Object.keys(current).join(', ') || '(none)')
