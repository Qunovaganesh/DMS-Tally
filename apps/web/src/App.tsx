import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import { Toaster } from './components/ui/toaster'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import SessionsPage from './pages/auth/SessionsPage'

// Distributor pages
import DistributorDashboard from './pages/distributor/Dashboard'
import NewOrderPage from './pages/distributor/NewOrderPage'
import OrderConfirmPage from './pages/distributor/OrderConfirmPage'

// Manufacturer pages
import ManufacturerDashboard from './pages/manufacturer/Dashboard'
import ManufacturerOrdersPage from './pages/manufacturer/OrdersPage'
import ManufacturerOrderDetailPage from './pages/manufacturer/OrderDetailPage'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsersPage from './pages/admin/UsersPage'
import AdminCRMPage from './pages/admin/CRMPage'
import AdminTDLPage from './pages/admin/TDLPage'
import AdminLogsPage from './pages/admin/LogsPage'

// Layout components
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { user } = useAuthStore()

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          {/* Default redirect based on role */}
          <Route index element={
            <Navigate to={
              user?.role === 'admin' ? '/admin' :
              user?.role === 'manufacturer' ? '/manufacturer' :
              user?.role === 'distributor' ? '/distributor' :
              '/login'
            } replace />
          } />

          {/* Sessions management */}
          <Route path="/sessions" element={<SessionsPage />} />

          {/* Distributor routes */}
          <Route path="/distributor" element={
            <ProtectedRoute roles={['distributor']}>
              <DistributorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/distributor/order/new" element={
            <ProtectedRoute roles={['distributor']}>
              <NewOrderPage />
            </ProtectedRoute>
          } />
          <Route path="/distributor/order/:id/confirm" element={
            <ProtectedRoute roles={['distributor']}>
              <OrderConfirmPage />
            </ProtectedRoute>
          } />

          {/* Manufacturer routes */}
          <Route path="/manufacturer" element={
            <ProtectedRoute roles={['manufacturer']}>
              <ManufacturerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manufacturer/orders" element={
            <ProtectedRoute roles={['manufacturer']}>
              <ManufacturerOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/manufacturer/orders/:id" element={
            <ProtectedRoute roles={['manufacturer']}>
              <ManufacturerOrderDetailPage />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/crm" element={
            <ProtectedRoute roles={['admin']}>
              <AdminCRMPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/tdl" element={
            <ProtectedRoute roles={['admin']}>
              <AdminTDLPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute roles={['admin']}>
              <AdminLogsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </>
  )
}

export default App