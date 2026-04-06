import { useState, useEffect } from 'react'
import { warehouseService } from '@/services/warehouseService'
import { orderService } from '@/services'
import { Package, Truck, CheckCircle, MapPin, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import NumberBadge from '@/components/ui/NumberBadge'

export default function SellerWarehouseDashboard() {
  const [warehouses, setWarehouses] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [whData, ordersRes] = await Promise.all([
        warehouseService.getMyWarehouses(),
        orderService.getSellerOrders().catch(() => []),
      ])
      setWarehouses(whData)
      // Filter to orders that need warehouse processing
      const relevantOrders = (ordersRes || []).filter(o =>
        ['CONFIRMED', 'SHIPPING', 'DELIVERED', 'PENDING'].includes(o.status)
      )
      setOrders(relevantOrders)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(o => o.status === filterStatus)

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const statusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      SHIPPING: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-green-200 text-green-800',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-slate-100 text-slate-600'
  }

  // Stock alerts: count warehouses and products
  const lowStockCount = 0 // Will be populated from inventory API later

  if (loading) {
    return <div className="py-12 text-center text-slate-400">Loading warehouse dashboard...</div>
  }

  return (
    <div className="text-black mb-28">
      <h1 className="text-2xl font-semibold text-black">Warehouse Dashboard</h1>
      <p className="text-sm text-slate-500 mt-1">
        View and manage warehouse operations from your seller panel
      </p>

      {/* Warehouse overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {warehouses.map(wh => (
          <div key={wh.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-green-600" />
              <h3 className="font-semibold text-black">{wh.name}</h3>
              {wh.isDefault && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Default</span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {wh.detailAddress && `${wh.detailAddress}, `}
              {wh.ward && `${wh.ward}, `}
              {wh.district && `${wh.district}, `}
              {wh.province || 'No address'}
            </p>
            {wh.ghnShopId && (
              <p className="text-xs text-blue-500 mt-1">GHN Shop #{wh.ghnShopId}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>{wh.employees?.length || 0} employees</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                wh.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
              }`}>{wh.status}</span>
            </div>
          </div>
        ))}
        {warehouses.length === 0 && (
          <div className="col-span-3 text-center py-8 bg-white rounded-lg border border-gray-200">
            <p className="text-slate-400">No warehouses found. Create one in Warehouse Management.</p>
          </div>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mt-8 mb-4 flex-wrap">
        {[
          { key: 'ALL', label: 'All', count: orders.length },
          { key: 'PENDING', label: 'Pending', count: statusCounts.PENDING || 0 },
          { key: 'CONFIRMED', label: 'Ready to Pack', count: statusCounts.CONFIRMED || 0 },
          { key: 'SHIPPING', label: 'Shipping', count: statusCounts.SHIPPING || 0 },
          { key: 'DELIVERED', label: 'Delivered', count: statusCounts.DELIVERED || 0 },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filterStatus === f.key
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label} <NumberBadge value={f.count} variant="inline" size="sm" className="ml-1" />
          </button>
        ))}
      </div>

      {/* Orders for warehouse processing */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No orders to process</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-black">Order #{order.id?.slice(0, 8)}</p>
                    <p className="text-xs text-slate-400">
                      {order.created_at ? new Date(order.created_at).toLocaleString('en-US') : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-black font-inter">
                      ${Number(order.total || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">{order.payment || 'COD'}</p>
                  </div>
                  {expandedOrder === order.id
                    ? <ChevronUp size={18} className="text-slate-400" />
                    : <ChevronDown size={18} className="text-slate-400" />
                  }
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Buyer</p>
                      <p className="text-black font-medium">{order.buyer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Shipping Fee</p>
                      <p className="text-black font-inter">${Number(order.shipping_fee || 0).toFixed(2)}</p>
                    </div>
                    {order.note && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-400 mb-1">Note</p>
                        <p className="text-black">{order.note}</p>
                      </div>
                    )}
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-slate-400">Items:</p>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-2 border border-slate-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">{item.product_name || item.productName}</p>
                            <p className="text-xs text-slate-400">
                              {(item.variant_name || item.variantName) && `${item.variant_name || item.variantName} · `}
                              x{item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-black font-inter">
                            ${Number(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
