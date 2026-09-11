import { Suspense, lazy, useEffect } from 'react'
import { LayoutGroup } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import SearchOverlay from './components/SearchOverlay'
import Toast from './components/Toast'
import { ScrollProgress } from './components/ui/Aceternity'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'

const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminApp = lazy(() => import('./admin/AdminApp'))

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 90); return }
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

function PageFallback() {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-line border-t-leaf-bright" />
    </div>
  )
}

function StoreShell() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-mint">
        Skip to content
      </a>
      <ScrollProgress />
      <Header />
      <main id="main" className="relative z-[2]">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:id" element={<ConfirmationPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <Toast />
    </>
  )
}

/**
 * Auth area. Both routes render the same `layoutId`s, so Framer Motion
 * tweens the brand panel and glass card between them rather than
 * hard-cutting — but only if the incoming chunk is already loaded.
 * A Suspense fallback mid-navigation would unmount the shared elements
 * and kill the animation, so we warm both chunks on entry.
 */
function AuthArea() {
  const { pathname } = useLocation()

  // Warm both chunks so a Suspense fallback never unmounts the shared
  // elements mid-navigation (which would kill the layout animation).
  useEffect(() => {
    import('./pages/LoginPage').catch(() => {})
    import('./pages/RegisterPage').catch(() => {})
  }, [])

  const isRegister = pathname.startsWith('/register')

  return (
    <LayoutGroup>
      <Suspense fallback={<PageFallback />}>
        {isRegister ? <RegisterPage /> : <LoginPage />}
      </Suspense>
    </LayoutGroup>
  )
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route
          path="/admin/*"
          element={<Suspense fallback={<PageFallback />}><AdminApp /></Suspense>}
        />
        {/* Auth screens render their own full-viewport chrome — no
            Header/Footer, and the body scroll is locked. */}
        <Route path="/login" element={<AuthArea />} />
        <Route path="/register" element={<AuthArea />} />
        <Route path="*" element={<StoreShell />} />
      </Routes>
    </>
  )
}
