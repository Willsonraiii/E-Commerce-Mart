import { useRef, useState, useCallback } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo'
// Adjust these two import paths if your context files live somewhere else —
// this is the one part I had to guess at, since I don't have your actual
// Header.jsx or context files to read the real hook names from.
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/categories', label: 'Categories' },
  { to: '/offers', label: 'Offers' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

/** Nav bar where a soft pill glides to whichever item the cursor is over. */
function MagneticNav() {
  const containerRef = useRef(null)
  const itemRefs = useRef({})
  const [hover, setHover] = useState(null) // { x, width } relative to container

  const measure = useCallback((label) => {
    const el = itemRefs.current[label]
    const container = containerRef.current
    if (!el || !container) return
    const elRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    setHover({ x: elRect.left - containerRect.left, width: elRect.width })
  }, [])

  return (
    <nav
      ref={containerRef}
      onMouseLeave={() => setHover(null)}
      className="relative hidden items-center gap-1 rounded-full border border-line/70 bg-paper/70 px-1.5 py-1.5 backdrop-blur md:flex"
    >
      <AnimatePresence>
        {hover && (
          <motion.div
            key="pill"
            className="absolute inset-y-1.5 rounded-full bg-forest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: hover.x, width: hover.width }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.6 }}
          />
        )}
      </AnimatePresence>
      {NAV.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.end}
          ref={(el) => { itemRefs.current[item.label] = el }}
          onMouseEnter={() => measure(item.label)}
          onFocus={() => measure(item.label)}
          className={({ isActive }) =>
            [
              'relative z-10 rounded-full px-4 py-1.5 text-[.92rem] font-medium transition-colors duration-200',
              hover ? 'hover:text-cream' : '',
              isActive && !hover ? 'text-cream' : 'text-ink-2 hover:text-ink',
            ].join(' ')
          }
        >
          {({ isActive }) =>
            isActive && !hover ? (
              <>
                <span className="absolute inset-0 -z-10 rounded-full bg-forest" aria-hidden />
                {item.label}
              </>
            ) : (
              item.label
            )
          }
        </NavLink>
      ))}
    </nav>
  )
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}
function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="21" r="1.4" />
      <circle cx="17.5" cy="21" r="1.4" />
    </svg>
  )
}

/**
 * Account entry point. The old heart/wishlist button that used to sit as a
 * standalone icon in the action row is gone — wishlist visibility now lives
 * here instead, as a small count badge riding the account name.
 */
function AccountButton() {
  const { user } = useAuth() || {}
  const { wishlistCount = 0 } = useCart() || {} // swap this source if wishlist count lives elsewhere

  if (!user) {
    return (
      <Link
        to="/login"
        className="rounded-full bg-forest px-5 py-2 text-[.92rem] font-medium text-cream transition-colors hover:bg-forest-mid"
      >
        Sign in
      </Link>
    )
  }

  return (
    <Link
      to="/account"
      className="flex items-center gap-2 rounded-full border border-line/70 bg-paper/70 py-1.5 pl-1.5 pr-3.5 backdrop-blur transition-colors hover:border-leaf/50"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-[.72rem] font-semibold text-cream">
        {user.name?.[0]?.toUpperCase() || '?'}
      </span>
      <span className="max-w-[86px] truncate text-[.82rem] font-medium">{user.name.split(' ')[0]}</span>
      {wishlistCount > 0 && (
        <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-terracotta px-1 text-[.68rem] font-semibold text-cream">
          {wishlistCount > 9 ? '9+' : wishlistCount}
        </span>
      )}
    </Link>
  )
}

export default function Header() {
  const { items = [] } = useCart() || {}
  const cartCount = items.reduce((n, i) => n + (i.qty || 1), 0)

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3">
        <Link to="/" className="flex h-10 shrink-0 items-center overflow-hidden">
          <Logo size={40} className="!h-10 w-auto" />
        </Link>

        <MagneticNav />

        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Search"
            className="grid h-10 w-10 place-items-center rounded-full border border-line/70 bg-paper/70 text-ink-2 transition-colors hover:text-ink"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
          </button>

          <Link
            to="/cart"
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-forest text-cream transition-colors hover:bg-forest-mid"
          >
            <CartIcon className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-terracotta px-1 text-[.68rem] font-semibold text-cream">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          <AccountButton />
        </div>
      </div>
    </header>
  )
}
