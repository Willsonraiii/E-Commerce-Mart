import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../components/Logo'
import { BackgroundBeams } from '../components/ui/Aceternity'
import {
  ChartIcon, BoxIcon, BagIcon, UsersIcon, GridIcon, TagIcon,
  SettingsIcon, LogoutIcon, MenuIcon, ArrowRight, TruckIcon,
} from '../components/Icons'
import { cn, initials } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: ChartIcon, end: true },
  { to: '/admin/orders', label: 'Orders', Icon: BagIcon },
  { to: '/admin/products', label: 'Products', Icon: BoxIcon },
  { to: '/admin/inventory', label: 'Inventory', Icon: TruckIcon },
  { to: '/admin/categories', label: 'Categories', Icon: GridIcon },
  { to: '/admin/offers', label: 'Offers', Icon: TagIcon },
  { to: '/admin/customers', label: 'Customers', Icon: UsersIcon },
  { to: '/admin/settings', label: 'Settings', Icon: SettingsIcon },
]

export default function AdminLayout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const Sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/admin" className="flex items-center gap-2"><Logo light className="h-[46px]" /></Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[.88rem] font-medium transition-colors',
              isActive ? 'text-forest' : 'text-mint/65 hover:bg-white/6 hover:text-mint',
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="admin-active" className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-leaf-glow to-leaf-bright"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                )}
                <Icon size={18} /> {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-leaf-glow to-leaf-bright text-[.75rem] font-bold text-forest">
            {initials(user?.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[.85rem] font-semibold text-mint">{user?.name}</span>
            <span className="block truncate text-[.72rem] text-mint/50">Administrator</span>
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          <Link to="/" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/8 py-2 text-[.76rem] font-medium text-mint transition-colors hover:bg-white/14">
            Storefront <ArrowRight size={13} />
          </Link>
          <button
            onClick={async () => { await signOut(); navigate('/') }}
            aria-label="Sign out"
            className="grid w-9 place-items-center rounded-lg bg-white/8 text-mint transition-colors hover:bg-terracotta hover:text-white"
          >
            <LogoutIcon size={15} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b1f17] text-mint">
      <div className="relative mx-auto flex max-w-[1600px]">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 overflow-hidden border-r border-white/8 bg-forest-deep lg:block">
          <BackgroundBeams count={5} className="opacity-30" />
          <div className="relative z-10 h-full">{Sidebar}</div>
        </aside>

        {/* mobile drawer */}
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[90] lg:hidden">
              <motion.div className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.aside
                className="absolute left-0 top-0 h-full w-[260px] overflow-hidden bg-forest-deep"
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              >
                <BackgroundBeams count={4} className="opacity-30" />
                <div className="relative z-10 h-full">{Sidebar}</div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/8 bg-[#0b1f17]/85 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(true)} aria-label="Menu"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-mint lg:hidden">
                <MenuIcon size={18} />
              </button>
              <div>
                <p className="text-[.7rem] uppercase tracking-[.18em] text-mint/45">Yalambar Store</p>
                <p className="font-display text-[1.02rem] text-paper">Admin console</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-leaf-glow/25 bg-leaf-glow/10 px-3 py-1.5 text-[.74rem] font-medium text-leaf-glow sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf-glow" /> API live
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-leaf-glow to-leaf-bright text-[.75rem] font-bold text-forest">
                {initials(user?.name)}
              </span>
            </div>
          </header>

          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
