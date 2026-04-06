import { useEffect, useState, useMemo } from "react"
import { Image } from "@/utils/compat"
import Loading from "@/components/ui/Loading"
import { orderService } from "@/services"
import toast from "react-hot-toast"
import { Search, Package, Truck, CheckCircle, XCircle, Clock, CreditCard, MapPin, Phone, User, FileDown, Ban } from "lucide-react"

const STATUS_LABELS = {
    AWAITING_PAYMENT: 'Awaiting Payment',
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    SHIPPING: 'Shipping',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
}

const STATUS_COLORS = {
    AWAITING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
    SHIPPING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DELIVERED: 'bg-green-100 text-green-700 border-green-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_ICONS = {
    AWAITING_PAYMENT: CreditCard,
    PENDING: Clock,
    CONFIRMED: CheckCircle,
    SHIPPING: Truck,
    DELIVERED: Package,
    COMPLETED: CheckCircle,
    CANCELLED: XCircle,
}

const FILTER_TABS = [
    { key: 'ALL', label: 'All', count: null },
    { key: 'PENDING', label: 'Pending', count: null },
    { key: 'CONFIRMED', label: 'Confirmed', count: null },
    { key: 'SHIPPING', label: 'Shipping', count: null },
    { key: 'DELIVERED', label: 'Delivered', count: null },
    { key: 'CANCELLED', label: 'Cancelled', count: null },
]

export default function StoreOrders() {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeFilter, setActiveFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [cancelModal, setCancelModal] = useState({ open: false, orderId: null })
    const [cancelReason, setCancelReason] = useState('')
    const [cancelling, setCancelling] = useState(false)

    const fetchOrders = async () => {
       try {
           const list = await orderService.getSellerOrders()
           setOrders(list || [])
       } catch (e) {
           toast.error(e instanceof Error ? e.message : "Failed to load orders")
           setOrders([])
       } finally {
           setLoading(false)
       }
    }

    const updateOrderStatus = async (orderId, action) => {
        try {
            if (action === "CONFIRM") {
                await orderService.confirmOrder(orderId)
            } else if (action === "SHIP") {
                await orderService.shipOrder(orderId)
            } else if (action === "DELIVER") {
                await orderService.deliverOrder(orderId)
            }
            await fetchOrders()
            toast.success("Updated successfully")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Update failed")
        }
    }

    const getNextAction = (status) => {
        switch (status) {
            case 'PENDING': return { label: 'Confirm Order', value: 'CONFIRM', color: 'bg-green-600 hover:bg-green-700' }
            case 'CONFIRMED': return { label: 'Ship Order', value: 'SHIP', color: 'bg-emerald-600 hover:bg-emerald-700' }
            case 'SHIPPING': return { label: 'Mark Delivered', value: 'DELIVER', color: 'bg-green-600 hover:bg-green-700' }
            default: return null
        }
    }

    const canCancel = (status) => status === 'PENDING' || status === 'CONFIRMED'

    const handleCancelOrder = async () => {
        if (!cancelModal.orderId) return
        setCancelling(true)
        try {
            await orderService.cancelOrderBySeller(cancelModal.orderId, cancelReason || undefined)
            toast.success("Order cancelled")
            setCancelModal({ open: false, orderId: null })
            setCancelReason('')
            await fetchOrders()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Cancel failed")
        } finally { setCancelling(false) }
    }

    const openModal = (order) => {
        setSelectedOrder(order)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setSelectedOrder(null)
        setIsModalOpen(false)
    }

    // Filter and search orders
    const filteredOrders = useMemo(() => {
        let filtered = orders

        // Filter by status
        if (activeFilter !== 'ALL') {
            filtered = filtered.filter(order => order.status === activeFilter)
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(order => {
                const customerName = order?.shipping_address?.receiver_name?.toLowerCase() || ''
                const phone = order?.shipping_address?.phone_number?.toLowerCase() || ''
                const orderId = order.id?.toLowerCase() || ''
                const productNames = (order?.shop_groups || []).flatMap(g => g?.items || [])
                    .map(item => item.product_name?.toLowerCase() || '').join(' ')
                
                return customerName.includes(query) || 
                       phone.includes(query) || 
                       orderId.includes(query) ||
                       productNames.includes(query)
            })
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => {
            const dateA = new Date(a.created_at || 0)
            const dateB = new Date(b.created_at || 0)
            return dateB - dateA
        })
    }, [orders, activeFilter, searchQuery])

    // Calculate counts for filter tabs
    const filterCounts = useMemo(() => {
        const counts = {}
        FILTER_TABS.forEach(tab => {
            if (tab.key === 'ALL') {
                counts[tab.key] = orders.length
            } else {
                counts[tab.key] = orders.filter(o => o.status === tab.key).length
            }
        })
        return counts
    }, [orders])

    useEffect(() => {
        fetchOrders()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
                <div className="text-sm text-slate-500">
                    Total: <span className="font-bold text-slate-800 font-num">{filteredOrders.length}</span> orders
                </div>
            </div>

            {/* Filter Tabs - Green theme */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {FILTER_TABS.map(tab => {
                    const count = filterCounts[tab.key] || 0
                    const isActive = activeFilter === tab.key
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                isActive
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'bg-slate-50 text-slate-600 hover:bg-green-50 hover:text-green-700'
                            }`}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                                    isActive ? 'bg-white/20' : 'bg-slate-200'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Search Box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by customer name, phone, order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                />
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                    <Package className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-500">No orders found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const allItems = (order?.shop_groups || []).flatMap(g => g?.items || [])
                        const nextAction = getNextAction(order.status)
                        const statusColor = STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'
                        const StatusIcon = STATUS_ICONS[order.status] || Package
                        const orderDate = order?.created_at ? new Date(order.created_at) : null

                        return (
                            <div
                                key={order.id}
                                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => openModal(order)}
                            >
                                {/* Order Header */}
                                <div className="p-4 border-b border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${statusColor.split(' ')[0]}`}>
                                                <StatusIcon size={20} className={statusColor.split(' ')[1]} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="text-xs text-slate-500 font-num">
                                                    {orderDate ? orderDate.toLocaleString('en-US', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    }) : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${statusColor.split(' ')[1]}`}>
                                                {STATUS_LABELS[order.status] || order.status}
                                            </p>
                                            <p className="text-2xl font-bold text-slate-800 mt-1 font-num">
                                                {currency}{Number(order.total).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <User size={16} className="text-green-600" />
                                            <span className="font-medium">{order?.shipping_address?.receiver_name || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={16} className="text-green-600" />
                                            <span>{order?.shipping_address?.phone_number || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin size={16} className="text-green-600" />
                                            <span className="truncate max-w-[200px]">{order?.shipping_address?.full_address || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Products Preview */}
                                <div className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        {allItems.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 flex-1 min-w-0">
                                                {item.product_image && (
                                                    <Image 
                                                        src={item.product_image} 
                                                        alt="" 
                                                        width={48} 
                                                        height={48} 
                                                        className="w-12 h-12 rounded object-cover shrink-0" 
                                                    />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{item.product_name || 'N/A'}</p>
                                                    <p className="text-xs text-slate-500">SL: {item.quantity} × <span className="text-slate-800 font-medium font-num">{currency}{Number(item.price).toLocaleString()}</span></p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {allItems.length > 3 && (
                                        <p className="text-xs text-slate-500 text-center">+{allItems.length - 3} more items</p>
                                    )}
                                </div>

                                {/* Footer with Action */}
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-xl">
                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                        <span>Payment: <span className="font-medium">{order.payment}</span></span>
                                        <span>•</span>
                                        <span>{allItems.length} items</span>
                                        {order.cancel_reason && (
                                            <>
                                                <span>•</span>
                                                <span className="text-red-500 italic text-xs">Reason: {order.cancel_reason}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canCancel(order.status) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setCancelModal({ open: true, orderId: order.id })
                                                    setCancelReason('')
                                                }}
                                                className="px-4 py-2.5 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {nextAction && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    updateOrderStatus(order.id, nextAction.value)
                                                }}
                                                className={`px-5 py-2.5 text-white rounded-lg text-sm font-semibold ${nextAction.color} transition shadow-sm hover:shadow`}
                                            >
                                                {nextAction.label}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Order Detail Modal */}
            {isModalOpen && selectedOrder && (
                <div onClick={closeModal} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
                                <p className="text-sm text-slate-500 mt-1 font-num">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition">
                                <XCircle size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status & Payment */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-xs text-slate-500 mb-1">Status</p>
                                    <p className={`text-sm font-semibold ${STATUS_COLORS[selectedOrder.status]?.split(' ')[1] || 'text-slate-700'}`}>
                                        {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-xs text-slate-500 mb-1">Payment</p>
                                    <p className="text-sm font-semibold text-slate-700">{selectedOrder.payment}</p>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="border border-slate-200 rounded-lg p-4">
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <User size={18} className="text-green-600" /> Customer Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-800">{selectedOrder?.shipping_address?.receiver_name || '—'}</span></p>
                                    <p><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-800">{selectedOrder?.shipping_address?.phone_number || '—'}</span></p>
                                    <p><span className="text-slate-500">Address:</span> <span className="font-medium text-slate-800">{selectedOrder?.shipping_address?.full_address || '—'}</span></p>
                                    {selectedOrder?.shipping_address?.detail_address && (
                                        <p><span className="text-slate-500">Detail:</span> <span className="font-medium text-slate-800">{selectedOrder.shipping_address.detail_address}</span></p>
                                    )}
                                </div>
                            </div>

                            {/* Products */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <Package size={18} className="text-green-600" /> Products
                                </h3>
                                <div className="space-y-3">
                                    {(selectedOrder?.shop_groups || []).flatMap(g => g?.items || []).map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
                                            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                                                {item.product_image ? (
                                                    <Image src={item.product_image} alt="" width={80} height={80} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="text-xs text-slate-400">No img</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-800 font-semibold mb-1">{item.product_name || 'Product'}</p>
                                                {item.variant_name && <p className="text-xs text-slate-500 mb-1">Variant: {item.variant_name}</p>}
                                                {item.variant_sku && <p className="text-xs text-slate-500 mb-1">SKU: {item.variant_sku}</p>}
                                                <p className="text-sm text-slate-600">
                                                    Quantity: <span className="font-medium font-num">{item.quantity}</span> × 
                                                    <span className="text-slate-800 font-semibold ml-1 font-num">{currency}{Number(item.price).toLocaleString()}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-800 font-num">
                                                    {currency}{(item.quantity * Number(item.price)).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Timeline */}
                            <div className="border border-slate-200 rounded-lg p-4">
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <Clock size={18} className="text-green-600" /> Order Timeline
                                </h3>
                                <div className="flex items-center gap-0">
                                    {['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED'].map((step, i, arr) => {
                                        const statusOrder = { AWAITING_PAYMENT: -1, PENDING: 0, CONFIRMED: 1, SHIPPING: 2, DELIVERED: 3, COMPLETED: 4, CANCELLED: -2 }
                                        const currentIdx = statusOrder[selectedOrder.status] ?? -1
                                        const stepIdx = statusOrder[step]
                                        const isCompleted = currentIdx >= stepIdx
                                        const isCurrent = currentIdx === stepIdx
                                        const isCancelled = selectedOrder.status === 'CANCELLED'

                                        return (
                                            <div key={step} className="flex items-center flex-1">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        isCancelled ? 'bg-red-100 text-red-500' :
                                                        isCompleted ? 'bg-green-500 text-white' :
                                                        isCurrent ? 'bg-green-500 text-white ring-4 ring-green-100' :
                                                        'bg-slate-200 text-slate-400'
                                                    }`}>
                                                        {isCompleted && !isCancelled ? <CheckCircle size={16} /> : i + 1}
                                                    </div>
                                                    <p className={`text-[10px] mt-1 text-center ${
                                                        isCompleted && !isCancelled ? 'text-green-600 font-medium' : 'text-slate-400'
                                                    }`}>
                                                        {STATUS_LABELS[step]}
                                                    </p>
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <div className={`flex-1 h-0.5 mx-1 ${
                                                        !isCancelled && currentIdx > stepIdx ? 'bg-green-400' : 'bg-slate-200'
                                                    }`} />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                {selectedOrder.status === 'CANCELLED' && (
                                    <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200 text-sm text-red-600">
                                        <span className="font-medium">Cancelled</span>
                                        {selectedOrder.cancel_reason && <span className="ml-1">— {selectedOrder.cancel_reason}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="border-t border-slate-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal:</span><span className="text-slate-800 font-semibold font-num">{currency}{Number(selectedOrder.subtotal).toLocaleString()}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-600">Shipping Fee:</span><span className="text-slate-800 font-semibold font-num">{currency}{Number(selectedOrder.shipping_fee).toLocaleString()}</span></div>
                                {selectedOrder.total_discount > 0 && (
                                    <div className="flex justify-between text-sm text-slate-800"><span>Discount:</span><span className="font-num">-{currency}{Number(selectedOrder.total_discount).toLocaleString()}</span></div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                                    <span className="text-slate-800">Total:</span><span className="text-green-700 font-num">{currency}{Number(selectedOrder.total).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                {canCancel(selectedOrder.status) && (
                                    <button 
                                        onClick={() => { closeModal(); setCancelModal({ open: true, orderId: selectedOrder.id }); setCancelReason('') }}
                                        className="px-6 py-2.5 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                                {(() => {
                                    const action = getNextAction(selectedOrder.status)
                                    return action ? (
                                        <button 
                                            onClick={() => { updateOrderStatus(selectedOrder.id, action.value); closeModal() }}
                                            className={`px-6 py-2.5 text-white rounded-lg font-semibold ${action.color} transition shadow-sm hover:shadow`}
                                        >
                                            {action.label}
                                        </button>
                                    ) : null
                                })()}
                                <button 
                                    onClick={closeModal} 
                                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Reason Modal */}
            {cancelModal.open && (
                <div onClick={() => setCancelModal({ open: false, orderId: null })} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Ban size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Cancel Order</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason for cancellation</label>
                            <select
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 mb-2"
                            >
                                <option value="">Select a reason...</option>
                                <option value="Out of stock">Out of stock</option>
                                <option value="Customer request">Customer request</option>
                                <option value="Pricing error">Pricing error</option>
                                <option value="Unable to ship">Unable to ship to this address</option>
                                <option value="Duplicate order">Duplicate order</option>
                                <option value="Other">Other</option>
                            </select>
                            {cancelReason === 'Other' && (
                                <textarea
                                    placeholder="Please specify the reason..."
                                    rows={3}
                                    onChange={e => setCancelReason(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-red-200"
                                />
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setCancelModal({ open: false, orderId: null })}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700 transition text-sm"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling || !cancelReason}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-50"
                            >
                                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
