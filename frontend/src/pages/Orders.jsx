import RequireAuth from "@/components/RequireAuth"
import { useEffect, useState, useCallback, useMemo } from "react";
import { orderService, productService, paymentService } from "@/services";
import { Image, Link } from "@/utils/compat";
import toast from "react-hot-toast";
import { Package, Truck, CheckCircle, XCircle, Clock, CreditCard, Star, Search } from "lucide-react";

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
    AWAITING_PAYMENT: 'text-amber-600',
    PENDING: 'text-yellow-600',
    CONFIRMED: 'text-blue-600',
    SHIPPING: 'text-indigo-600',
    DELIVERED: 'text-green-600',
    COMPLETED: 'text-green-700',
    CANCELLED: 'text-red-500',
}

const STATUS_BG = {
    AWAITING_PAYMENT: 'bg-amber-50 border-amber-200',
    PENDING: 'bg-yellow-50 border-yellow-200',
    CONFIRMED: 'bg-blue-50 border-blue-200',
    SHIPPING: 'bg-indigo-50 border-indigo-200',
    DELIVERED: 'bg-green-50 border-green-200',
    COMPLETED: 'bg-green-50 border-green-300',
    CANCELLED: 'bg-red-50 border-red-200',
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
    { key: 'ALL', label: 'All' },
    { key: 'AWAITING_PAYMENT', label: 'To Pay' },
    { key: 'PENDING', label: 'To Confirm' },
    { key: 'SHIPPING', label: 'To Ship' },
    { key: 'DELIVERED', label: 'To Receive' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
]

export default function Orders() {
    return (
        <RequireAuth>
            <OrdersContent />
        </RequireAuth>
    )
}

function OrdersContent() {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    // Review state
    const [reviewingItemId, setReviewingItemId] = useState(null)
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewComment, setReviewComment] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)
    const [reviewedItems, setReviewedItems] = useState({})

    // Action states
    const [actionLoading, setActionLoading] = useState({})

    const fetchOrders = useCallback(async () => {
        try {
            const data = await orderService.getMyOrders()
            setOrders(data || [])
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load orders")
            setOrders([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    const filteredOrders = useMemo(() => {
        let result = orders
        if (activeFilter !== 'ALL') {
            result = result.filter(o => o.status === activeFilter)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(o => {
                const items = (o?.shop_groups || []).flatMap(g => g?.items || [])
                return o.id?.toLowerCase().includes(q) ||
                    items.some(i => i.product_name?.toLowerCase().includes(q))
            })
        }
        return result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }, [orders, activeFilter, searchQuery])

    const filterCounts = useMemo(() => {
        const counts = {}
        FILTER_TABS.forEach(t => {
            counts[t.key] = t.key === 'ALL' ? orders.length : orders.filter(o => o.status === t.key).length
        })
        return counts
    }, [orders])

    const setAction = (orderId, loading) => setActionLoading(prev => ({ ...prev, [orderId]: loading }))

    const handleConfirmReceipt = async (orderId) => {
        setAction(orderId, true)
        try {
            await orderService.confirmReceipt(orderId)
            toast.success("Order received confirmed!")
            fetchOrders()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed")
        } finally { setAction(orderId, false) }
    }

    const handleCancel = async (orderId) => {
        setAction(orderId, true)
        try {
            await orderService.cancelOrder(orderId)
            toast.success("Order cancelled")
            fetchOrders()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Cancel failed")
        } finally { setAction(orderId, false) }
    }

    const handlePayNow = async (order) => {
        setAction(order.id, true)
        try {
            const paymentUrl = await paymentService.createPaymentUrl(order.payment || 'VNPAY', order.id)
            if (paymentUrl) window.location.href = paymentUrl
            else toast.error("Could not create payment link")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Payment failed")
        } finally { setAction(order.id, false) }
    }

    const handleSubmitReview = async (orderItemId) => {
        if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
            toast.error('Please select a rating between 1 and 5')
            return
        }
        if (!orderItemId || orderItemId.startsWith('item-')) {
            toast.error('Invalid order item')
            return
        }
        setSubmittingReview(true)
        try {
            await productService.createReview({
                orderItemId: String(orderItemId).trim(),
                rating: reviewRating,
                comment: reviewComment?.trim() || undefined,
            })
            toast.success('Review submitted!')
            setReviewedItems(prev => ({ ...prev, [orderItemId]: true }))
            setReviewingItemId(null)
            setReviewRating(5)
            setReviewComment('')
            fetchOrders()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Review failed')
        } finally { setSubmittingReview(false) }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <Package size={48} className="text-slate-300" />
                    <p className="text-slate-400">Loading orders...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] bg-slate-50 py-6">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">My Orders</h1>

                {/* Filter Tabs */}
                <div className="bg-white rounded-t-lg border border-slate-200 border-b-0">
                    <div className="flex overflow-x-auto">
                        {FILTER_TABS.map(tab => {
                            const count = filterCounts[tab.key] || 0
                            const isActive = activeFilter === tab.key
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveFilter(tab.key)}
                                    className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium text-center whitespace-nowrap border-b-2 transition-colors ${
                                        isActive
                                            ? 'border-green-500 text-green-600 bg-green-50/50'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`ml-1.5 text-xs ${isActive ? 'text-green-500' : 'text-slate-400'}`}>
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white border border-slate-200 border-t-0 px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by order ID or product name..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                        />
                    </div>
                </div>

                {/* Orders List */}
                <div className="mt-4 space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-lg border border-slate-200 py-16 text-center">
                            <Package className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-500">No orders found</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                currency={currency}
                                isActionLoading={actionLoading[order.id]}
                                onConfirmReceipt={() => handleConfirmReceipt(order.id)}
                                onCancel={() => handleCancel(order.id)}
                                onPayNow={() => handlePayNow(order)}
                                reviewingItemId={reviewingItemId}
                                reviewRating={reviewRating}
                                reviewComment={reviewComment}
                                submittingReview={submittingReview}
                                reviewedItems={reviewedItems}
                                onStartReview={(itemId) => { setReviewingItemId(itemId); setReviewRating(5); setReviewComment('') }}
                                onCancelReview={() => setReviewingItemId(null)}
                                onSetRating={setReviewRating}
                                onSetComment={setReviewComment}
                                onSubmitReview={handleSubmitReview}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

function OrderCard({
    order, currency, isActionLoading,
    onConfirmReceipt, onCancel, onPayNow,
    reviewingItemId, reviewRating, reviewComment, submittingReview, reviewedItems,
    onStartReview, onCancelReview, onSetRating, onSetComment, onSubmitReview,
}) {
    const StatusIcon = STATUS_ICONS[order.status] || Package
    const allItems = (order?.shop_groups || []).flatMap(g => g?.items || [])
    const orderDate = order?.created_at ? new Date(order.created_at) : null

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Header — shop name + status */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 text-sm">
                    <Package size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-700">
                        {order?.shop_groups?.[0]?.shop_name || 'Shop'}
                    </span>
                    {orderDate && (
                        <span className="text-slate-400 text-xs font-num ml-2">
                            {orderDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    )}
                </div>
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${STATUS_COLORS[order.status]}`}>
                    <StatusIcon size={16} />
                    {STATUS_LABELS[order.status] || order.status}
                </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-50">
                {allItems.map((item, i) => {
                    const itemId = String(item.id || '').trim()
                    const canReview = order.status === 'COMPLETED' && !item.has_review && !reviewedItems[itemId] && itemId
                    const isReviewed = item.has_review || reviewedItems[itemId]

                    return (
                        <div key={itemId || i} className="px-4 py-3">
                            <div className="flex gap-3">
                                {/* Image */}
                                <Link href={item.product_id ? `/product/${item.product_id}` : '#'}
                                    className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 hover:opacity-80 transition">
                                    {item.product_image ? (
                                        <Image src={item.product_image} alt="" width={80} height={80} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No img</div>
                                    )}
                                </Link>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <Link href={item.product_id ? `/product/${item.product_id}` : '#'}
                                        className="text-sm text-slate-800 font-medium line-clamp-2 hover:text-green-600 transition">
                                        {item.product_name || 'Product'}
                                    </Link>
                                    {item.variant_name && (
                                        <p className="text-xs text-slate-400 mt-0.5">Variant: {item.variant_name}</p>
                                    )}
                                    <p className="text-xs text-slate-500 mt-1">x{item.quantity}</p>
                                </div>

                                {/* Price + Review */}
                                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                    <p className="text-sm font-semibold text-green-600 font-num">
                                        {currency}{Number(item.price).toLocaleString()}
                                    </p>
                                    {canReview && (
                                        <button
                                            onClick={() => onStartReview(itemId)}
                                            className="text-xs bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 transition mt-1"
                                        >
                                            Review
                                        </button>
                                    )}
                                    {isReviewed && (
                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle size={12} /> Reviewed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Inline review form */}
                            {reviewingItemId === itemId && (
                                <div className="mt-3 ml-23 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-sm font-medium text-slate-700 mb-2">Rate this product</p>
                                    <div className="flex gap-1 mb-3">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} type="button" onClick={() => onSetRating(star)}>
                                                <Star size={20} className="transition" fill={reviewRating >= star ? "#FACC15" : "#D1D5DB"} stroke={reviewRating >= star ? "#FACC15" : "#D1D5DB"} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={reviewComment}
                                        onChange={e => onSetComment(e.target.value)}
                                        placeholder="Share your experience (optional)..."
                                        rows={3}
                                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => onSubmitReview(itemId)}
                                            disabled={submittingReview}
                                            className="text-xs bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
                                        >
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                        <button
                                            onClick={onCancelReview}
                                            className="text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer — total + actions */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Order total */}
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500">{allItems.reduce((sum, i) => sum + (i.quantity || 0), 0)} item(s)</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600">
                        Order Total: <span className="text-lg font-bold text-green-600 font-num">{currency}{Number(order.total).toLocaleString()}</span>
                    </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {order.status === 'AWAITING_PAYMENT' && ['VNPAY', 'PAYPAL', 'MOMO'].includes(order.payment) && (
                        <button
                            onClick={onPayNow}
                            disabled={isActionLoading}
                            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1.5"
                        >
                            <CreditCard size={14} />
                            {isActionLoading ? 'Redirecting...' : 'Pay Now'}
                        </button>
                    )}

                    {order.status === 'DELIVERED' && (
                        <button
                            onClick={onConfirmReceipt}
                            disabled={isActionLoading}
                            className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                        >
                            {isActionLoading ? 'Processing...' : 'Order Received'}
                        </button>
                    )}

                    {(order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') && (
                        <button
                            onClick={onCancel}
                            disabled={isActionLoading}
                            className="px-5 py-2 text-sm font-medium border border-slate-300 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 disabled:opacity-50 transition"
                        >
                            {isActionLoading ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                    )}

                    {order.cancel_reason && order.status === 'CANCELLED' && (
                        <span className="text-xs text-red-500 italic">Reason: {order.cancel_reason}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
