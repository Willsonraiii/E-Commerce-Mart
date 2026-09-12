import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../components/Logo'
import {
  ChartIcon, BoxIcon, BagIcon, UsersIcon, GridIcon, TagIcon,
  SettingsIcon, LogoutIcon, MenuIcon, ArrowRight, TruckIcon, SearchIcon, CloseIcon,
} from '../components/Icons'
import { cn, initials } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

/* TailAdmin groups its sidebar into labelled sections. */
const GROUPS = [
  {
    label: 'Menu',
    items: [
      { to: '/admin', label: 'Dashboard', Icon: ChartIcon, end: true },
      { to: '/admin/orders', label: 'Orders', Icon: BagIcon },
      { to: '/admin/products', label: 'Products', Icon: BoxIcon },
      { to: '/admin/inventory', label: 'Inventory', Icon: TruckIcon, badge: 'NEW' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/categories', label: 'Categories', Icon: GridIcon },
      { to: '/admin/offers', label: 'Offers', Icon: TagIcon },
    ],
  },
  {
    label: 'Others',
    items: [
      { to: '/admin/customers', label: 'Customers', Icon: UsersIcon },
      { to: '/admin/settings', label: 'Settings', Icon: SettingsIcon },
    ],
  },
]

export default function AdminLayout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)      // mobile drawer
  const [userMenu, setUserMenu] = useState(false)

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const Sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 px-5">
        <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center">
          <Logo className="h-[42px]" />
        </Link>
        <button onClick={() => setOpen(false)} aria-label="Close menu"
          className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 lg:hidden">
          <CloseIcon size={16} />
        </button>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-4 py-5">
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-2 text-[.68rem] font-semibold uppercase tracking-[.12em] text-gray-400">
              {g.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {g.items.map(({ to, label, Icon, end, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to} end={end} onClick={() => setOpen(false)}
                    className={({ isActive }) => cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[.88rem] font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-500'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800',
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={19} className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600'} />
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="rounded-full bg-success-50 px-2 py-0.5 text-[.62rem] font-bold uppercase tracking-wide text-success-600">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 p-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-[.82rem] font-semibold text-gray-800">Yalambar Store</p>
          <p className="mt-0.5 text-[.75rem] leading-relaxed text-gray-500">
            View the live storefront your customers see.
          </p>
          <Link to="/" className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2 text-[.78rem] font-medium text-white transition-colors hover:bg-brand-600">
            Open storefront <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="flex">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-gray-200 lg:block">
          {Sidebar}
        </aside>

        {/* mobile drawer */}
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[90] lg:hidden">
              <motion.div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              <motion.aside
                className="absolute left-0 top-0 h-full w-[280px] shadow-2xl"
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              >
                {Sidebar}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* topbar */}
          <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
            <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6">
              <button
                onClick={() => setOpen(true)} aria-label="Open menu"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 lg:hidden"
              >
                <MenuIcon size={18} />
              </button>

              {/* search */}
              <label className="relative hidden min-w-0 flex-1 items-center md:flex md:max-w-[430px]">
                <SearchIcon size={17} className="pointer-events-none absolute left-3.5 text-gray-400" />
                <input
                  placeholder="Search or type command…"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-16 text-[.86rem] text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                />
                <kbd className="pointer-events-none absolute right-3 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[.68rem] font-medium text-gray-400">
                  ⌘K
                </kbd>
              </label>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <span className="hidden items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-[.74rem] font-medium text-success-600 sm:flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-500" /> API live
                </span>

                <button
                  aria-label="Notifications"
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-warning-500 ring-2 ring-white" />
                </button>

                {/* avatar + menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenu((v) => !v)}
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-50"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-[.78rem] font-bold text-white">
                      {initials(user?.name)}
                    </span>
                    <span className="hidden text-[.85rem] font-medium text-gray-700 sm:block">
                      {(user?.name || '').split(' ')[0]}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                      className={cn('hidden text-gray-400 transition-transform sm:block', userMenu && 'rotate-180')}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {userMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-ta-lg"
                        >
                          <div className="border-b border-gray-100 px-4 py-3">
                            <p className="truncate text-[.86rem] font-semibold text-gray-800">{user?.name}</p>
                            <p className="truncate text-[.76rem] text-gray-500">{user?.email}</p>
                          </div>
                          <Link to="/admin/settings" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-[.85rem] text-gray-600 transition-colors hover:bg-gray-50">
                            <SettingsIcon size={16} className="text-gray-400" /> Settings
                          </Link>
                          <Link to="/" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-[.85rem] text-gray-600 transition-colors hover:bg-gray-50">
                            <ArrowRight size={16} className="text-gray-400" /> Storefront
                          </Link>
                          <button
                            onClick={async () => { await signOut(); navigate('/') }}
                            className="flex w-full items-center gap-2.5 border-t border-gray-100 px-4 py-2.5 text-left text-[.85rem] text-errorc-600 transition-colors hover:bg-errorc-50"
                          >
                            <LogoutIcon size={16} /> Sign out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1536px] p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
