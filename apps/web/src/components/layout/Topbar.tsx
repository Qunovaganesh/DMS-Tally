import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function Topbar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
      clearAuth()
      navigate('/login')
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account.',
      })
    } catch (error) {
      // Even if logout fails, clear local auth
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <div className="h-12 frosted-glass border-b border-mac-border flex items-center justify-between px-4">
      {/* Traffic Lights */}
      <div className="traffic-lights">
        <div className="traffic-light red"></div>
        <div className="traffic-light yellow"></div>
        <div className="traffic-light green"></div>
      </div>

      {/* App Title */}
      <div className="flex-1 text-center">
        <h1 className="text-sm font-semibold text-mac-text-primary">
          BizzPlus DMS
        </h1>
      </div>

      {/* User Menu */}
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/sessions')}>
              <Settings className="mr-2 h-4 w-4" />
              Active Sessions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}