import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import Logo from './Logo'
import { Magnetic, Marquee } from './ui/Aceternity'
import { SearchIcon, BagIcon, UserIcon, MenuIcon, CloseIcon, HeartIcon, TruckIcon, SparkIcon, LeafIcon } from './Icons'
import { cn, navLinks, storeInfo, initials } from '../lib/utils'
import { useCatalog } from '../context/CatalogContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const TICKER = [
  { icon: TruckIcon, text: 'Free delivery on orders over Rs. 1,500' },
  { icon: LeafIcon, text: 'Produce cut and weighed this morning' },
  { icon: SparkIcon, text: 'Open Sun–Fri · 7:00 AM – 9:00 PM' },
  { icon: TruckIcon, text: 'New Baneshwor · delivered in 45–90 minutes' },
]

export default function Header() {
  const { cartCount, setCartOpen, setSearchOpen, menuOpen, setMenuOpen, wishlist } = useCart()
  const { store } = useCatalog()
  const { user, isAdmin } = useAuth()
  const [solid, setSolid] = useState(false)
  const { scrollY } = useScroll()
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()

  useMotionValueEvent(scrollY, 'change', (v) => setSolid(v > 24))
  useEffect(() => { setMenuOpen(false) }, [pathname, hash, setMenuOpen])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen])

  const goto = (to) => {
    if (to.startsWith('/#')) {
      const id = to.slice(2)
      if (pathname !== '/') { navigate('/'); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 320) }
      else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    navigate(to)
  }

  return (
    <>
      {/* announcement ticker */}
      <div className="relative z-[60] bg-forest text-mint">
        <Marquee speed={44} className="h-9 items-center">
          {TICKER.map(({ icon: I, text }, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-2 whitespace-nowrap text-[.76rem] font-medium tracking-wide">
              <I size={14} className="text-leaf-glow" /> {text}
              <span className="ml-6 text-leaf-glow/50">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      <motion.header
        className={cn(
          'sticky top-0 z-[59] transition-all duration-500',
          solid ? 'shadow-[0_10px_40px_-24px_rgba(20,53,40,.55)]' : '',
        )}
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 0.8, 0.25, 1] }}
      >
        <div className={cn('transition-all duration-500', solid ? 'glass' : 'bg-cream/70 backdrop-blur-sm border-b border-transparent')}>
          <div className="wrap flex h-[var(--header)] items-center justify-between gap-4">
            <Link to="/" aria-label="Yalambar Store home" className="shrink-0">
              <Logo className="h-[46px] sm:h-[56px]" />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {navLinks.map((l) => {
                const active = l.to === pathname || (l.to.startsWith('/#') && hash === l.to.slice(1))
                return (
                  <button
                    key={l.id}
                    onClick={() => goto(l.to)}
                    className={cn(
                      'relative rounded-full px-4 py-2 text-[.9rem] font-medium transition-colors',
                      active ? 'text-forest' : 'text-ink-2 hover:text-forest',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm ring-1 ring-line"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {l.label}
                  </button>
                )
              })}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Magnetic strength={0.22}>
                <motion.button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search products"
                  title="Search products"
                  initial={false}
                  whileHover="hover"
                  whileFocus="hover"
                  whileTap={{ scale: 0.92 }}
                  variants={{ hover: { scale: 1.12 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                  className="group relative grid h-9 w-9 place-items-center rounded-full border border-line bg-paper/80 text-ink-2 transition-colors hover:border-leaf-bright hover:text-leaf focus-visible:border-leaf-bright focus-visible:text-leaf sm:h-10 sm:w-10"
                >
                  {/* halo that blooms behind the glyph on hover */}
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-full bg-leaf-bright"
                    initial={false}
                    variants={{ hover: { opacity: 0.12, scale: 1.06 } }}
                    style={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                  <motion.span
                    className="relative grid place-items-center"
                    variants={{ hover: { rotate: -10, scale: 1.06 } }}
                    transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                  >
                    <SearchIcon size={18} />
                  </motion.span>
                </motion.button>
              </Magnetic>

              <Link
                to="/account?tab=saved"
                aria-label="Saved items"
                className="relative hidden h-10 w-10 place-items-center rounded-full border border-line bg-paper/80 text-ink-2 transition-all hover:border-terracotta hover:text-terracotta sm:grid"
              >
                <HeartIcon size={18} />
                {wishlist.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-terracotta px-1 text-[.6rem] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Magnetic strength={0.22}>
                <button
                  onClick={() => setCartOpen(true)}
                  aria-label={`Open bag, ${cartCount} items`}
                  className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-leaf-bright to-forest text-white shadow-md transition-shadow hover:shadow-glowleaf"
                >
                  <BagIcon size={18} />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-gold-bright px-1 text-[.63rem] font-bold text-forest ring-2 ring-cream"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </Magnetic>

              <Link
                to={user ? '/account' : '/login'}
                aria-label={user ? 'Your account' : 'Sign in'}
                className="hidden h-10 items-center gap-2 rounded-full border border-line bg-paper/80 pl-1.5 pr-3.5 text-ink-2 transition-all hover:border-leaf-bright hover:text-leaf sm:flex"
              >
                {user ? (
                  <>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-leaf-bright to-forest text-[.68rem] font-bold text-white">
                      {initials(user.name)}
                    </span>
                    <span className="max-w-[86px] truncate text-[.82rem] font-medium">{user.name.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-cream-2"><UserIcon size={15} /></span>
                    <span className="text-[.82rem] font-medium">Sign in</span>
                  </>
                )}
              </Link>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
                aria-expanded={menuOpen}
                className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper/80 text-forest lg:hidden"
              >
                {menuOpen ? <CloseIcon size={19} /> : <MenuIcon size={19} />}
              </button>
            </div>
          </div>
        </div>

        {/*
          Mobile menu — OVERLAY, never in flow.
          It used to animate height 0 -> auto inside the header, which pushed
          the whole page down. Now it is `fixed`, so the homepage stays exactly
          where it is and the panel floats above it on frosted iOS glass.
          It is a card, not a takeover: auto height, capped width, page still
          visible around it.
        */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                key="menu-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="fixed inset-0 z-[58] cursor-default bg-forest-deep/25 backdrop-blur-[2px] lg:hidden"
              />
              <motion.nav
                key="menu-panel"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
                style={{ top: 'calc(var(--header) + 8px)' }}
                className="glass-panel fixed right-3 z-[60] w-[min(19rem,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-[22px] p-2 lg:hidden"
              >
                {navLinks.map((l, i) => (
                  <motion.button
                    key={l.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.035 }}
                    onClick={() => goto(l.to)}
                    className="w-full rounded-[14px] px-3.5 py-2.5 text-left text-[.95rem] font-medium text-ink transition-colors hover:bg-white/60 active:bg-mint/70"
                  >
                    {l.label}
                  </motion.button>
                ))}
                <div className="mt-1.5 grid grid-cols-2 gap-2 border-t border-line/50 px-1 pb-1 pt-2.5">
                  <Link to={user ? '/account' : '/login'} onClick={() => setMenuOpen(false)} className="btn btn-ghost justify-center text-[.82rem]">
                    {user ? 'Account' : 'Sign in'}
                  </Link>
                  {isAdmin
                    ? <Link to="/admin" onClick={() => setMenuOpen(false)} className="btn btn-primary justify-center text-[.82rem]">Admin</Link>
                    : <Link to="/shop" onClick={() => setMenuOpen(false)} className="btn btn-primary justify-center text-[.82rem]">Shop all</Link>}
                </div>
                <a href={`tel:${(store.phone||'').replace(/\s/g, '')}`} className="mt-1 block px-3.5 pb-1 text-[.76rem] text-ink-3">
                  Call the shop · {store.phone}
                </a>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}
