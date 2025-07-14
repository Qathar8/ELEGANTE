import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

interface MonthlyData {
  month: string
  revenue: number
  cost: number
  profit: number
  sales: number
}

interface TopProduct {
  name: string
  sku: string
  totalSold: number
  revenue: number
}

const Analytics: React.FC = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    profitMargin: 0
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      // Get last 6 months of data
      const months = []
      for (let i = 5; i >= 0; i--) {
        const date = subDays(new Date(), i * 30)
        const monthStart = format(startOfMonth(date), 'yyyy-MM-dd')
        const monthEnd = format(endOfMonth(date), 'yyyy-MM-dd')
        const monthName = format(date, 'MMM yyyy')

        const { data: sales } = await supabase
          .from('sales')
          .select(`
            quantity,
            price,
            products!inner(buy_price)
          `)
          .gte('date', monthStart)
          .lte('date', monthEnd)

        const revenue = sales?.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0) || 0
        const cost = sales?.reduce((sum, sale) => sum + (sale.products.buy_price * sale.quantity), 0) || 0
        const profit = revenue - cost

        months.push({
          month: monthName,
          revenue,
          cost,
          profit,
          sales: sales?.length || 0
        })
      }

      setMonthlyData(months)

      // Get top products
      const { data: topProductsData } = await supabase
        .from('sales')
        .select(`
          quantity,
          price,
          products!inner(name, sku)
        `)

      const productMap = new Map()
      topProductsData?.forEach(sale => {
        const key = `${sale.products.name}-${sale.products.sku}`
        if (productMap.has(key)) {
          const existing = productMap.get(key)
          existing.totalSold += sale.quantity
          existing.revenue += sale.price * sale.quantity
        } else {
          productMap.set(key, {
            name: sale.products.name,
            sku: sale.products.sku,
            totalSold: sale.quantity,
            revenue: sale.price * sale.quantity
          })
        }
      })

      const topProductsArray = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setTopProducts(topProductsArray)

      // Calculate overall stats
      const totalRevenue = months.reduce((sum, month) => sum + month.revenue, 0)
      const totalCost = months.reduce((sum, month) => sum + month.cost, 0)
      const totalProfit = totalRevenue - totalCost
      const totalSales = months.reduce((sum, month) => sum + month.sales, 0)
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

      setStats({
        totalRevenue,
        totalProfit,
        totalSales,
        profitMargin
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Business performance insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                KES {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KES {stats.totalProfit.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalSales}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.profitMargin.toFixed(1)}%
              </p>
            </div>
            <Package className="h-8 w-8 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Profit Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Profit Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`KES ${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#059669" name="Revenue" />
              <Bar dataKey="profit" fill="#2563EB" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Sales Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.totalSold}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    KES {product.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topProducts.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales data yet</h3>
            <p className="text-gray-600">Start recording sales to see analytics</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics