import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { Plus, ShoppingCart, DollarSign, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Product {
  id: string
  name: string
  sku: string
  sell_price: number
  quantity: number
}

interface Sale {
  id: string
  product_id: string
  quantity: number
  price: number
  date: string
  created_at: string
  products: {
    name: string
    sku: string
  }
  users: {
    username: string
  }
}

interface SaleForm {
  product_id: string
  quantity: number
  price: number
  date: string
}

const Sales: React.FC = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SaleForm>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd')
    }
  })

  const selectedProductId = watch('product_id')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Auto-fill price when product is selected
    if (selectedProductId) {
      const selectedProduct = products.find(p => p.id === selectedProductId)
      if (selectedProduct) {
        setValue('price', selectedProduct.sell_price)
      }
    }
  }, [selectedProductId, products, setValue])

  const fetchData = async () => {
    try {
      const [productsResponse, salesResponse] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, sku, sell_price, quantity')
          .gt('quantity', 0)
          .order('name'),
        supabase
          .from('sales')
          .select(`
            *,
            products(name, sku),
            users(username)
          `)
          .order('created_at', { ascending: false })
      ])

      if (productsResponse.error) throw productsResponse.error
      if (salesResponse.error) throw salesResponse.error

      setProducts(productsResponse.data || [])
      setSales(salesResponse.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: SaleForm) => {
    try {
      const selectedProduct = products.find(p => p.id === data.product_id)
      
      if (!selectedProduct) {
        alert('Please select a product')
        return
      }

      if (data.quantity > selectedProduct.quantity) {
        alert(`Insufficient stock. Available: ${selectedProduct.quantity}`)
        return
      }

      const { error } = await supabase
        .from('sales')
        .insert([{
          product_id: data.product_id,
          quantity: Number(data.quantity),
          price: Number(data.price),
          date: data.date,
          recorded_by_user_id: user?.id
        }])

      if (error) throw error

      await fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error recording sale:', error)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    reset({
      product_id: '',
      quantity: 1,
      price: 0,
      date: format(new Date(), 'yyyy-MM-dd')
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalSales = sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0)
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Record and track sales transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Record Sale
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                KES {totalSales.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-blue-600">{sales.length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-2xl font-bold text-purple-600">{totalItemsSold}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Each
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <ShoppingCart className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sale.products.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.products.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {sale.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    KES {sale.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    KES {(sale.price * sale.quantity).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {format(new Date(sale.date), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {sale.users?.username || 'Unknown'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sales.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales recorded yet</h3>
            <p className="text-gray-600">Start by recording your first sale</p>
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Record Sale
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  {...register('product_id', { required: 'Please select a product' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - Stock: {product.quantity}
                    </option>
                  ))}
                </select>
                {errors.product_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.product_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    {...register('quantity', { 
                      required: 'Quantity is required',
                      valueAsNumber: true,
                      min: { value: 1, message: 'Quantity must be at least 1' }
                    })}
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Each (KES)
                  </label>
                  <input
                    {...register('price', { 
                      required: 'Price is required',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Price must be positive' }
                    })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.date && (
                  <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Record Sale
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales