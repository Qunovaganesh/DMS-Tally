import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  BarChart3,
  FileText,
  Activity,
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  roles: string[]
}

const navItems: NavItem[] = [
  // Distributor
  {
    to: '/distributor',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['distributor'],
  },
  {
    to: '/distributor/order/new',
    icon: ShoppingCart,
    label: 'New Order',
    roles: ['distributor'],
  },

  // Manufacturer
  {
    to: '/manufacturer',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['manufacturer'],
  },
  {
    to: '/manufacturer/orders',
    icon: Package,
    label: 'Orders',
    roles: ['manufacturer'],
  },

  // Admin
  {
    to: '/admin',
    icon: LayoutDashboard,
    label: 'Overview',
    roles: ['admin'],
  },
  {
    to: '/admin/users',
    icon: Users,
    label: 'Users',
    roles: ['admin'],
  },
  {
    to: '/admin/logs',
    icon: FileText,
    label: 'Audit Logs',
    roles: ['admin'],
  },
]

export default function Sidebar() {
  const { user } = useAuthStore()

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role || '')
  )

  return (
    <div className="w-64 frosted-glass border-r border-mac-border">
      <nav className="p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-mac-accent text-white shadow-sm'
                    : 'text-mac-text-secondary hover:bg-white/50 hover:text-mac-text-primary'
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}