import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { Plus, Package, TrendingUp, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Product {
  id: string
  name: string
  sku: string
  quantity: number
}

interface StockEntry {
  id: string
  product_id: string
  quantity: number
  date: string
  created_at: string
  products: {
    name: string
    sku: string
  }
}

interface StockEntryForm {
  product_id: string
  quantity: number
  date: string
}

const StockEntries: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StockEntryForm>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd')
    }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsResponse, stockEntriesResponse] = await Promise.all([
        supabase.from('products').select('id, name, sku, quantity').order('name'),
        supabase
          .from('stock_entries')
          .select(`
            *,
            products(name, sku)
          `)
          .order('created_at', { ascending: false })
      ])

      if (productsResponse.error) throw productsResponse.error
      if (stockEntriesResponse.error) throw stockEntriesResponse.error

      setProducts(productsResponse.data || [])
      setStockEntries(stockEntriesResponse.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: StockEntryForm) => {
    try {
      const { error } = await supabase
        .from('stock_entries')
        .insert([{
          product_id: data.product_id,
          quantity: Number(data.quantity),
          date: data.date
        }])

      if (error) throw error

      await fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error adding stock entry:', error)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    reset({
      product_id: '',
      quantity: 0,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Entries</h1>
          <p className="text-gray-600">Track inventory additions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Stock
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">{products.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stock Entries</p>
              <p className="text-2xl font-bold text-green-600">{stockEntries.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items in Stock</p>
              <p className="text-2xl font-bold text-purple-600">
                {products.reduce((sum, product) => sum + product.quantity, 0)}
              </p>
            </div>
            <Package className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Stock Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Stock Entries</h2>
        </div>

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
                  Quantity Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stockEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.products.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.products.sku}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      +{entry.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stockEntries.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock entries yet</h3>
            <p className="text-gray-600">Start by adding your first stock entry</p>
          </div>
        )}
      </div>

      {/* Add Stock Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Stock Entry
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
                      {product.name} ({product.sku}) - Current: {product.quantity}
                    </option>
                  ))}
                </select>
                {errors.product_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.product_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Add
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
                  placeholder="Enter quantity"
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>
                )}
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
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Stock
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

export default StockEntries