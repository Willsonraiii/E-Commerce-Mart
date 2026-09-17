# Frontend redesign — what's here and how to wire it in

Honest caveat first: I don't have your actual `Scene3D.jsx` or `Header.jsx` —
you sent config/root files, not components — so those two are full rebuilds
in the same spirit the README describes, not edits to your real code. I
matched your existing tokens exactly (colors, fonts, the `float`/`shimmer`/
`spotlight` keyframes already in `tailwind.config.js`) so they should drop in
without clashing, but double-check against what you actually have before
deleting the originals.

## 1. Hero 3D — `src/components/three/Scene3D.jsx`

Replaces the whole file. No wrapping card/panel/background div — the canvas
is `alpha: true` with nothing behind it, so the bag/produce/tiles float
directly on the page background. Built from primitives (box, sphere, torus)
rather than your original assets, since I don't know what those were.
Keeps the WebGL-capability + `prefers-reduced-motion` gating your README
describes, falling back to a quiet gradient instead of the 3D scene.

If your actual scene uses GLTF models or textures you want kept, send me
the real file and I'll strip just the frame instead of rebuilding whole.

## 2. Header — `src/components/Header.jsx`

Replaces the whole file. Two things assumed that you should check:

- **`useAuth()` from `../context/Auth`** and **`useCart()` from
  `../context/Cart`** — adjust the import paths/hook names if yours differ.
- **Wishlist count**: I pulled it from `useCart().wishlistCount`, purely as
  a guess — your README mentions `context/ Auth, Catalog, Cart` with no
  separate Wishlist context, so it might live elsewhere (a `useWishlist()`
  hook, or fetched directly via `api.js`). Search your codebase for how
  `/api/wishlist` gets called today and point the `AccountButton` component
  at whatever that returns.
- If your account menu has more in it than a name (order history link,
  admin link, sign-out) — I only ever saw one line of that section
  (the truncated-name span) — merge those back in; I built a minimal
  version around just that fragment.

The nav highlight: hovering a link measures its position and animates a
pill (`bg-forest`) under the cursor via `framer-motion`'s spring transition;
the active route gets a static version of the same pill when nothing's
hovered.

## 3. Scroll reveals — `src/components/Reveal.jsx` (new file)

Three exports:

```jsx
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal'

// A single heading or block settling into place on scroll
<Reveal><h2>Featured on the racks</h2></Reveal>

// A grid where children settle in as one staggered wave
<RevealGroup className="grid grid-cols-5 gap-4">
  {products.map(p => <RevealItem key={p.id}><ProductCard {...p} /></RevealItem>)}
</RevealGroup>
```

Deliberately one restrained animation (fade + 18px rise), not a different
effect per section — per the design brief, scattered per-section flourishes
read as generic. Drop `<Reveal>` around each homepage section (Featured,
Offers, Vegetables, Testimonials, etc.) in whichever file renders your
homepage — I don't have that file either, so this is the wrapper, not the
homepage edit itself.

## 4. Loading screen — `src/components/LoadingScreen.jsx` (new file)

Mount it once, near your app root, controlled by whatever boolean means
"critical data isn't ready yet" — likely your catalog/meta fetch:

```jsx
// e.g. in App.jsx, alongside your existing routes
import LoadingScreen from './components/LoadingScreen'

function App() {
  const { loading } = useCatalog() // or however you track the initial fetch
  return (
    <>
      <LoadingScreen loading={loading} />
      {/* ...rest of your app... */}
    </>
  )
}
```

It fades itself out via `AnimatePresence` once `loading` flips to `false` —
no timers to tune, just wire the real boolean in.

## Still needed from you

To go further than "drop-in components," and to actually verify none of
this clashes with what's already there, I need:
- Your real `Scene3D.jsx` (if you want the actual frame stripped rather
  than a rebuild)
- Your real `Header.jsx` (to confirm the auth/cart hook names and the rest
  of the account menu)
- Whatever file renders the homepage sections (to actually apply `<Reveal>`)
- `App.jsx` or `main.jsx` (to actually wire in `<LoadingScreen>`)
