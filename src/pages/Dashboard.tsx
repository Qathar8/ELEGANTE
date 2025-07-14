import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users,
  ShoppingCart,
  Calendar
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface DashboardStats {
  totalProducts: number
  totalStockValue: number
  monthlyRevenue: number
  monthlyCost: number
  monthlyProfit: number
  totalUsers: number
  todaysSales: number
  weekSales: number
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStockValue: 0,
    monthlyRevenue: 0,
    monthlyCost: 0,
    monthlyProfit: 0,
    totalUsers: 0,
    todaysSales: 0,
    weekSales: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [user])

  const fetchDashboardStats = async () => {
    try {
      const currentMonth = new Date()
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')
      const weekAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

      // Get total products and stock value
      const { data: products } = await supabase
        .from('products')
        .select('*')

      const totalProducts = products?.length || 0
      const totalStockValue = products?.reduce((sum, product) => 
        sum + (product.buy_price * product.quantity), 0) || 0

      // Get monthly sales for revenue calculation
      const { data: monthlySales } = await supabase
        .from('sales')
        .select(`
          quantity,
          price,
          product_id,
          products!inner(buy_price)
        `)
        .gte('date', monthStart)
        .lte('date', monthEnd)

      const monthlyRevenue = monthlySales?.reduce((sum, sale) => 
        sum + (sale.price * sale.quantity), 0) || 0

      const monthlyCost = monthlySales?.reduce((sum, sale) => 
        sum + (sale.products.buy_price * sale.quantity), 0) || 0

      const monthlyProfit = monthlyRevenue - monthlyCost

      // Get user count (for super admin)
      let totalUsers = 0
      if (user?.role === 'super_admin') {
        const { data: users } = await supabase
          .from('users')
          .select('id')
        totalUsers = users?.length || 0
      }

      // Get today's and week's sales count
      const { data: todaysSalesData } = await supabase
        .from('sales')
        .select('quantity')
        .eq('date', today)

      const { data: weekSalesData } = await supabase
        .from('sales')
        .select('quantity')
        .gte('date', weekAgo)

      const todaysSales = todaysSalesData?.reduce((sum, sale) => sum + sale.quantity, 0) || 0
      const weekSales = weekSalesData?.reduce((sum, sale) => sum + sale.quantity, 0) || 0

      setStats({
        totalProducts,
        totalStockValue,
        monthlyRevenue,
        monthlyCost,
        monthlyProfit,
        totalUsers,
        todaysSales,
        weekSales,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    color: string
    description?: string
  }> = ({ title, value, icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`${color} opacity-20 p-3 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.username}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Month</p>
          <p className="text-lg font-semibold text-gray-900">
            {format(new Date(), 'MMMM yyyy')}
          </p>
        </div>
      </div>

      {user?.role === 'sales_staff' ? (
        // Sales Staff Dashboard
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Today's Sales"
            value={stats.todaysSales}
            icon={<ShoppingCart className="h-6 w-6" />}
            color="text-blue-600"
            description="Items sold today"
          />
          <StatCard
            title="This Week's Sales"
            value={stats.weekSales}
            icon={<Calendar className="h-6 w-6" />}
            color="text-green-600"
            description="Items sold this week"
          />
          <StatCard
            title="Available Products"
            value={stats.totalProducts}
            icon={<Package className="h-6 w-6" />}
            color="text-purple-600"
            description="Total products in inventory"
          />
        </div>
      ) : (
        // Admin and Super Admin Dashboard
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Package className="h-6 w-6" />}
            color="text-blue-600"
          />
          <StatCard
            title="Stock Value"
            value={`KES ${stats.totalStockValue.toLocaleString()}`}
            icon={<DollarSign className="h-6 w-6" />}
            color="text-green-600"
            description="Total inventory value"
          />
          <StatCard
            title="Monthly Revenue"
            value={`KES ${stats.monthlyRevenue.toLocaleString()}`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="text-purple-600"
          />
          <StatCard
            title="Monthly Cost"
            value={`KES ${stats.monthlyCost.toLocaleString()}`}
            icon={<DollarSign className="h-6 w-6" />}
            color="text-orange-600"
            description="Cost of goods sold"
          />
          <StatCard
            title="Monthly Profit"
            value={`KES ${stats.monthlyProfit.toLocaleString()}`}
            icon={<TrendingUp className="h-6 w-6" />}
            color={stats.monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}
          />
          {user?.role === 'super_admin' && (
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users className="h-6 w-6" />}
              color="text-indigo-600"
            />
          )}
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role !== 'sales_staff' && (
            <button
              onClick={() => window.location.href = '/products'}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Products</h3>
              <p className="text-sm text-gray-600">Add or edit product information</p>
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/sales'}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Record Sale</h3>
            <p className="text-sm text-gray-600">Add new sales transaction</p>
          </button>

          {user?.role !== 'sales_staff' && (
            <button
              onClick={() => window.location.href = '/stock'}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Add Stock</h3>
              <p className="text-sm text-gray-600">Record new inventory</p>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard