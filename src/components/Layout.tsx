import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  Package, 
  TrendingUp, 
  Users, 
  PlusCircle, 
  LogOut, 
  BarChart3,
  ShoppingCart
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['super_admin', 'admin', 'sales_staff'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['super_admin', 'admin'] },
    { name: 'Stock Entries', href: '/stock', icon: PlusCircle, roles: ['super_admin', 'admin'] },
    { name: 'Sales', href: '/sales', icon: ShoppingCart, roles: ['super_admin', 'admin', 'sales_staff'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['super_admin', 'admin'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['super_admin'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Gents by Elegante</h1>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-600 ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="rounded-lg bg-gray-100 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout