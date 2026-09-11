# Deploying to Vercel

**Short version:** Vercel hosts your *site*. It cannot hold your *data*.
Push to GitHub, deploy the site on Vercel, and run the API on a small host that
has a real disk. Both have free tiers. Total time: about 20 minutes.

---

## Why the API can't live on Vercel

Vercel runs serverless functions. Their filesystem is read-only apart from
`/tmp`, which belongs to a single function instance and is erased on cold start.
Vercel's own documentation says SQLite can't be used because "storage is
ephemeral with serverless functions."

For this shop that means:

- every order, customer account and product edit **disappears** — often within
  minutes, and always on the next deploy;
- with two visitors at once, Vercel may run two instances, each with its own
  empty database, so they see different shops;
- admin image uploads fail immediately with `EROFS: read-only file system`.

This is not a configuration problem. A file-based database needs a persistent
disk, and serverless functions don't have one.

---

## Step 1 — push to GitHub

```bash
cd yalamber3d
git init
git add .
git commit -m "Yalambar Store"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `dist`, `.env`, the database and
`public/uploads/` — so your secrets and live data are never committed.

## Step 2 — API on Render (free, has a disk)

The repo contains `render.yaml`, so Render configures itself:

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Pick your repo. Render reads `render.yaml` and creates the service with a
   **1 GB persistent disk mounted at `/var/data`**.
3. Set these in the dashboard when prompted:

   | Variable | Value |
   | --- | --- |
   | `ADMIN_EMAIL` | your real admin email |
   | `ADMIN_PASSWORD` | a strong password (not `admin123`) |
   | `CORS_ORIGIN` | your Vercel URL, e.g. `https://yalambar.vercel.app` |

   `JWT_SECRET` is generated for you. `DB_FILE` and `UPLOAD_DIR` already point
   at the mounted disk.
4. Deploy, then copy the URL, e.g. `https://yalambar-api.onrender.com`.

Railway and Fly.io work the same way — any host where you can attach a volume
and set `DB_FILE=/var/data/yalamber.db`.

> Render's free tier sleeps after 15 minutes idle; the first request then takes
> ~30 s to wake. Your **data is not affected** — it is on the disk. The paid
> tier (about \$7/month) removes the sleep.

## Step 3 — site on Vercel

1. [vercel.com/new](https://vercel.com/new) → import the same repo.
2. Vercel detects Vite and reads `vercel.json`. Leave the build settings alone.
3. Add two environment variables:

   | Variable | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://yalambar-api.onrender.com/api` |
   | `VITE_SHOW_DEMO_LOGINS` | `false` |

4. Deploy.

`VITE_API_URL` is read at **build time**, so after changing it you must
redeploy — not just restart.

## Step 4 — check it

- Open the Vercel URL; the shop should list 47 products.
- Sign in with your admin credentials → `/admin` should open.
- Add a product, upload a photo, place a test order.
- Redeploy on Vercel, then reload: everything must still be there.

---

## Verified

This exact split was tested locally before shipping: the built site on one
origin, the API on another with `DB_FILE` and `UPLOAD_DIR` on a mounted path.

- Site loaded 47 products cross-origin — **no CORS failures, no console errors**.
- Login worked across origins (the app falls back to a bearer token when
  browsers block third-party cookies).
- A product and an uploaded image were written to the **mounted disk**, not the
  app folder.
- The entire application folder was then **deleted and re-extracted** — the
  redeploy scenario — and after restart: 48 products, the new product present,
  the uploaded image still served (HTTP 200), admin login still working.

## Backups

Vercel and Render are not backups. On the API host:

```bash
npm run backup            # -> backups/yalamber-<timestamp>.db
```

Safe to run while the shop is live. Download the file somewhere you control.

## Before you launch

- [ ] `ADMIN_PASSWORD` changed from `admin123`
- [ ] `VITE_SHOW_DEMO_LOGINS=false` on Vercel (removes the demo login chips)
- [ ] `CORS_ORIGIN` set to your real Vercel domain
- [ ] Placed a test order and confirmed it survives a redeploy

The API prints a `[security]` warning at startup listing anything still on a
default value.
