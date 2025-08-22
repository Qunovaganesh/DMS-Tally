import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@bizzplus/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: UserRole[]
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = 
      user.role === 'admin' ? '/admin' :
      user.role === 'manufacturer' ? '/manufacturer' :
      user.role === 'distributor' ? '/distributor' :
      '/login'
    
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}