import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { useAuth } from '../context/AuthContext'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const CustomersPage = lazy(() => import('./pages/CustomersPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const OffersPage = lazy(() => import('./pages/OffersPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function Loader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/15 border-t-leaf-glow" />
    </div>
  )
}

export default function AdminApp() {
  const { user, ready, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!ready) return
    if (!user) navigate('/login', { replace: true, state: { from: '/admin' } })
    else if (!isAdmin) navigate('/', { replace: true })
  }, [ready, user, isAdmin, navigate])

  if (!ready || !isAdmin) return <div className="min-h-screen bg-forest-deep"><Loader /></div>

  return (
    <AdminLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<DashboardPage />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  )
}
