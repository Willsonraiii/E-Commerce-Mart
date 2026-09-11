# Yalambar Store — 3D Storefront

> **Your Everyday Store.** — a full-stack, 3D, responsive remake of
> [Willsonraiii/MART-SITE](https://github.com/Willsonraiii/MART-SITE) for a neighbourhood
> store at New Baneshwor Chowk, Kathmandu.

This is not a static mock. It ships a real Express + SQLite backend, cookie/JWT auth,
a guest bag that merges into the account on sign-in, and a complete admin console —
plus a WebGL hero, an interactive 3D product viewer, and Aceternity/Magic-UI style motion
throughout.

---

## Quick start

```bash
npm install
npm run seed     # creates server/data/mart.db with 47 products, 12 aisles, 3 offers
npm run dev      # API on :4000 + Vite on :5173 (concurrently)
```

Open **http://localhost:5173**.

| Script | What it does |
| --- | --- |
| `npm run dev` | API + web together (recommended) |
| `npm run dev:web` | Vite dev server only |
| `npm run dev:api` | Express API only |
| `npm run seed` | (Re)seed the SQLite database |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the built bundle |
| `npm start` | Serve API + built `dist/` from one process |

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@yalambermart.com.np` | `admin123` |
| Customer | `demo@yalambermart.com.np` | `demo1234` |

The sign-in page shows one-tap chips that fill either set of credentials.

> **Before you launch:** those chips publish a working admin login, so they are
> gated behind `VITE_SHOW_DEMO_LOGINS`. Set it to `false` (or delete it) and Vite
> tree-shakes the whole block — verified: no demo email or password appears
> anywhere in `dist/` when the flag is off. Also change `JWT_SECRET` and the
> seeded `ADMIN_PASSWORD`.

---

## Stack

**Frontend** — React 18, Vite 5, React Router 6, Framer Motion 11, Tailwind CSS 3,
`three` + `@react-three/fiber` + `@react-three/drei`.

**Backend** — Express 4, `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`,
`multer` (image uploads).

SQLite was chosen so the whole thing boots instantly with zero external services. The
schema is plain SQL in `server/db.js` and swaps to Postgres with only the driver changing.

---

## The 3D layer

Two places use real WebGL; everything else is 2.5D tilt/parallax so the site stays light.

- **Hero** (`src/components/three/Scene3D.jsx`) — a floating shopping bag, photo tiles and
  produce on a transparent canvas with contact shadows and an environment light. A pointer
  `Rig` parallaxes the whole shelf; on touch devices you drag it instead.
- **Auth screens** (`src/components/three/AuthScene3D.jsx`) — a slowly rotating carousel of
  six product cards orbiting a paper bag. Each card billboards (counter-rotates against the
  ring) so its artwork always faces you, and scales with depth as it swings behind. The ring
  radius derives from the live viewport so cards never clip the panel edge.
- **Product viewer** (`src/components/three/ProductViewer3D.jsx`) — every product carries a
  `model` archetype (`pack` · `sphere` · `bottle` · `carton` · `bag`) plus a `modelColor`, so
  all 47 items get a viewer with OrbitControls. Rounded shapes auto-spin; flat ones
  (`pack`, `carton`, `card`) rock on a sine so they never freeze edge-on. Product pages
  toggle between the photo and the 3D model.

Both scenes are gated behind a WebGL capability check, an on-screen check, and
`prefers-reduced-motion` — the site degrades to still imagery rather than breaking.

---

## Features

**Storefront** — home (hero, 12 aisles, featured, offers, vegetables, testimonials), shop
with URL-synced filters (search, aisle, price range, availability, discounted, featured),
6 sort modes and pagination, product detail with tabs/reviews/related, cart drawer + cart
page, 3-step checkout, order confirmation with a live tracker, ⌘K search overlay, toasts,
wishlist, and JSON-LD + meta tags per route.

**Accounts** — sign-in and registration run on a dedicated full-viewport shell
(`src/components/AuthLayout.jsx`) that deliberately renders **no Header and no Footer** and
locks the body scroll, so neither screen ever scrolls on desktop or mobile. A 3D brand panel
sits opposite the form with a pointer-tracked glow and a rotating line of shop truths;
registration is split into two animated steps (You → Security) to keep it inside one
viewport. Fields use floating labels with inline validation ticks and a password reveal
toggle. Profile editing and order history with one-tap reorder live on `/account`. Guests
can shop freely; the local bag merges into the account on sign-in.

**Admin console** (`/admin`, admin role required) — dashboard with a dense 14-day revenue
chart, top sellers and restock alerts; product CRUD with image upload and 3D model pickers;
order management with inline status advance (`confirmed → packing → out-for-delivery →
delivered`); inventory toggles; categories; offers; customers; settings.

---

## Project layout

```
server/
  db.js          schema + connection        routes/catalog.js   public catalog
  seed.js        aisles, offers, users      routes/account.js   auth, cart, orders
  seed-products.js  the 47 products         routes/admin.js     admin API
  auth.js        JWT + bcrypt middleware    index.js            app entry
src/
  components/    header, cards, sections, ui/Aceternity.jsx, three/
  pages/         storefront routes
  admin/         AdminApp, AdminLayout, ui.jsx, pages/ (8 screens)
  context/       Auth, Catalog, Cart
  lib/           api.js (fetch wrapper), utils.js (formatNPR, tokens)
```

---

## API

All responses are `{ success, data }` or `{ success: false, error: { message } }`.
The Vite dev server proxies `/api` and `/uploads` to `:4000`.

```
GET    /api/products?q&category&minPrice&maxPrice&availability&discounted&featured&page&sort
GET    /api/products/:id          GET  /api/categories      GET /api/offers
POST   /api/auth/register|login|logout        GET /api/auth/me
GET/PUT /api/cart                 GET/POST/DELETE /api/wishlist
POST   /api/orders                GET /api/orders/:id       GET /api/orders
GET    /api/admin/stats|products|orders|customers|categories|offers|settings
POST   /api/admin/products|orders/:id/status|inventory|categories|offers
```

---

## Hosting it yourself

> **Deploying to Vercel?** See [`DEPLOY-VERCEL.md`](./DEPLOY-VERCEL.md). Vercel can
> serve the site but **cannot store your data** — its filesystem is ephemeral, so
> SQLite writes and uploaded images are lost. Run the API on a host with a disk
> (Render/Railway/Fly, free tiers available) and point the site at it.


One process serves both the API and the built site, so you only need one port.

```bash
npm install
cp .env.example .env        # then edit it — see the notes inside
npm run build               # -> dist/
npm start                   # serves API + site on PORT (default 4000)
```

Open `http://your-server:4000`. Deep links like `/shop` and `/product/wai-wai`
work because Express falls back to `index.html` for non-API routes.

Keep it running with pm2, systemd or Docker, and put nginx or Caddy in front for
HTTPS. Behind a reverse proxy the app already sets `trust proxy`, so secure
cookies work once you terminate TLS.

On first boot you'll see a `[security]` block listing anything still on a default
value (JWT secret, admin password, demo login chips). It disappears as you fix
each one.

## Your data — what persists and what to back up

Everything the shop knows lives in **one SQLite file** (`server/data/yalamber.db`
by default) plus **one folder of uploaded photos** (`public/uploads/`):

| In the database | In `public/uploads/` |
| --- | --- |
| Products, categories, offers | Product photos uploaded via the admin panel |
| Orders and order items | |
| Customer accounts and hashed passwords | |
| Carts, wishlists, reviews, settings | |

**Nothing is lost when you download the files and host them elsewhere.** The
database is created and seeded automatically on first boot, so a fresh copy
starts with all 47 products. From then on every change you make through the
admin panel is written to disk immediately and survives restarts and redeploys.

Verified end-to-end: created a product, edited a price, changed stock,
registered a customer, placed an order and uploaded an image — then stopped the
server, deleted and rebuilt `dist/`, and restarted. All of it was still there,
and the customer could still sign in.

### Two things that WILL lose data

1. **Ephemeral hosting.** Render, Railway, Fly and Heroku give containers a
   disposable filesystem — the `.db` file is erased on every redeploy. Attach a
   persistent volume and point at it:
   ```bash
   DB_FILE=/var/data/yalamber.db
   ```
   The parent directory is created automatically. Mount the same volume at
   `public/uploads` (or use S3) to keep uploaded photos. A plain VPS, a home
   server or shared hosting with a real disk needs none of this.

2. **`npm run seed -- --force`** rewrites the catalogue. Plain `npm run seed` is
   safe — on an existing store it refuses and tells you so.

`git` cannot hurt you here: the database, backups and uploads are all
git-ignored, so a `push` can't overwrite your live shop and a `pull` can't wipe it.

### Backups

```bash
npm run backup                    # -> backups/yalamber-<timestamp>.db
npm run backup -- /mnt/usb/shop.db
```

Safe to run while the shop is live — it uses SQLite's online backup API, so you
get a consistent snapshot including anything still in the write-ahead log
(copying the `.db` by hand while the server runs can miss recent writes). To
restore, stop the server and copy a backup over `server/data/yalamber.db`.

A nightly cron:
```bash
0 2 * * * cd /path/to/yalamber3d && npm run backup
```

The server also checkpoints the WAL on `SIGINT`/`SIGTERM`, so a clean stop or
redeploy never strands committed rows in a `-wal` file.

## Brand

The logo ships as pixels from the supplied artwork — no container card, and the
wordmark, cart and swoosh are never retyped. Files in `public/brand/`:

| File | Used for |
| --- | --- |
| `logo-h.png` / `logo-h-light.png` | Horizontal lockup — header, admin sidebar |
| `logo-full.png` / `logo-light.png` | Stacked original — footer, auth panel, og:image |
| `logo-mark.png` | Emblem only — favicon source, mobile auth corner |
| `icon-32/180/512.png` | Favicon and Apple touch icon |

The `-light` files are the *same artwork* with only the dark-green brand ink
(#006018) remapped to cream — it is invisible on our forest surfaces. The
figure, the orange, the cart and every outline are untouched, and the crown's
turquoise gems are explicitly protected from the recolour.

The horizontal lockup is composed from the source image's own pieces (emblem
left, wordmark right) because the stacked original is nearly square: at a usable
header height the words would be about six pixels tall. Both orientations are
the same drawing, just arranged for the space.

```jsx
<Logo className="h-[56px]" />                 // horizontal, light surface
<Logo light className="h-[46px]" />           // horizontal, on forest
<Logo light stacked className="h-[112px]" />  // stacked, on forest
<Logo compact size={54} />                    // emblem only
```

## Mobile

Every card surface is multi-column from the smallest supported phone (375 px) — no
grid ever shows one giant card filling the screen. Measured on an iPhone SE, product
cards occupy ~40 % of the viewport height, so two full rows are always visible:

| Surface | 375 px | 768 px | Desktop |
| --- | --- | --- | --- |
| Categories | 2 | 3 | 4–6 |
| Featured / Shop / Vegetables | 2 | 3 | 4–5 |
| Offers | 1 | 2 | 3 |

Card internals scale too, not just the grid: shorter images, clamped two-line titles,
non-wrapping prices, and hidden star ratings below 420 px. `TiltCard` detects
`(hover: hover) and (pointer: fine)` and renders a plain wrapper on touch devices,
so phones don't pay for springs that can never fire. Cart rows reflow to put the
quantity stepper on its own row with 36 px+ tap targets.

Verified with zero horizontal overflow across `/`, `/shop`, `/product/:id`, `/cart`,
`/checkout`, `/login`, `/register` and `/account` at 375, 390, 412 and 768 px.

## Notes

- Prices render as `Rs. X` via `Intl.NumberFormat('en-IN')`.
- Delivery is Rs. 60, free over Rs. 1,500.
- Uploaded images land in `public/uploads/` (git-ignored except `.gitkeep`).
- Set `JWT_SECRET` in `.env` before deploying; see `.env.example`.
- `VITE_SHOW_DEMO_LOGINS` controls the demo credential chips on `/login`. It ships
  as `true` in `.env` for the preview and `false` in `.env.example`.
- The iOS glass materials (`.glass-ios`, `.glass-ios-dark`, `.glass-field`) live in
  `src/index.css`. They rely on `backdrop-filter`, so they need something colourful
  behind them — `AuthLayout` renders drifting `AmbientOrbs` for exactly that reason.
