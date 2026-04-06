import { useState, useEffect } from 'react'
import { useParams, useRouter } from "@/utils/compat"
import { warehouseService } from '@/services/warehouseService'
import { orderService } from '@/services'
import { ArrowLeft, ShoppingCart, Search, Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '@/components/ui/Loading'

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    SHIPPING: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-200 text-green-800',
    CANCELLED: 'bg-red-100 text-red-700',
    AWAITING_PAYMENT: 'bg-amber-100 text-amber-700',
}

export default function WarehouseOrdersPage() {
    const params = useParams()
    const router = useRouter()
    const warehouseId = params.id as string

    const [warehouse, setWarehouse] = useState<any>(null)
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [wh, allOrders] = await Promise.all([
                    warehouseService.getById(warehouseId),
                    orderService.getSellerOrders().catch(() => []),
                ])
                setWarehouse(wh)
                const whOrders = (allOrders || []).filter((o: any) =>
                    o.shopGroups?.some((g: any) => g.warehouseId === warehouseId)
                )
                setOrders(whOrders)
            } catch {
                toast.error('Failed to load orders')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [warehouseId])

    if (loading) return <Loading />

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'

    const FILTER_TABS = [
        { key: 'ALL', label: 'All' },
        { key: 'PENDING', label: 'Pending' },
        { key: 'CONFIRMED', label: 'Confirmed' },
        { key: 'SHIPPING', label: 'Shipping' },
        { key: 'DELIVERED', label: 'Delivered' },
        { key: 'CANCELLED', label: 'Cancelled' },
    ]

    const filtered = orders.filter(o => {
        const matchStatus = filter === 'ALL' || o.status === filter
        const q = search.toLowerCase()
        const matchSearch = !q || o.id?.toLowerCase().includes(q)
            || o.shippingAddress?.receiverName?.toLowerCase().includes(q)
        return matchStatus && matchSearch
    })

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push(`/store/warehouses/${warehouseId}`)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                    <ArrowLeft size={18} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Warehouse Orders</h1>
                    <p className="text-sm text-slate-500">{warehouse?.name}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search order ID or customer..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
                            filter === tab.key
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <ShoppingCart size={48} className="mb-3 opacity-30" />
                        <p className="text-sm">No orders found</p>
                        <p className="text-xs mt-1">{search || filter !== 'ALL' ? 'Try a different filter' : 'Orders for this warehouse will appear here'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map(order => (
                            <div key={order.id}>
                                <div
                                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 font-num">
                                                #{order.id?.slice(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-xs text-slate-400 font-num">
                                                {order.created_at ? new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <p className="text-sm font-semibold text-slate-800 font-num">
                                            {currency}{Number(order.total || 0).toLocaleString()}
                                        </p>
                                        {expanded === order.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                    </div>
                                </div>
                                {expanded === order.id && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 space-y-2">
                                        {order.shippingAddress && (
                                            <p className="text-xs text-slate-500">
                                                <span className="font-medium text-slate-700">{order.shippingAddress.receiverName}</span>
                                                {order.shippingAddress.phoneNumber && ` · ${order.shippingAddress.phoneNumber}`}
                                                {order.shippingAddress.fullAddress && ` · ${order.shippingAddress.fullAddress}`}
                                            </p>
                                        )}
                                        {order.shopGroups?.filter((g: any) => g.warehouseId === warehouseId).map((group: any) => (
                                            <div key={group.id} className="space-y-1">
                                                {group.items?.map((item: any) => (
                                                    <div key={item.id} className="flex items-center gap-3 bg-white rounded-lg p-2 border border-slate-100">
                                                        {item.productImage && <img src={item.productImage} alt="" className="w-9 h-9 rounded object-cover" />}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                                                            <p className="text-xs text-slate-400">{item.variantName && `${item.variantName} · `}x{item.quantity}</p>
                                                        </div>
                                                        <p className="text-sm font-num text-slate-700">{currency}{Number(item.price || 0).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
