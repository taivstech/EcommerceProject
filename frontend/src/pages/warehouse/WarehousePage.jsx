import { useState, useEffect, useCallback } from 'react'
import { warehouseService } from '@/services/warehouseService'
import api from '@/api/api'
import {
    Package, Truck, CheckCircle, Clock, AlertTriangle,
    ChevronDown, ChevronUp, MapPin, ArrowRight, BarChart3,
    RefreshCw, Search, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from "@/utils/compat"

const STATUS_COLORS = {
    PENDING:         'bg-yellow-100 text-yellow-700 border-yellow-200',
    CONFIRMED:       'bg-blue-100 text-blue-700 border-blue-200',
    PACKING:         'bg-indigo-100 text-indigo-700 border-indigo-200',
    SHIPPING:        'bg-purple-100 text-purple-700 border-purple-200',
    DELIVERED:       'bg-green-100 text-green-700 border-green-200',
    COMPLETED:       'bg-green-200 text-green-800 border-green-300',
    CANCELLED:       'bg-red-100 text-red-700 border-red-200',
    AWAITING_PAYMENT:'bg-amber-100 text-amber-700 border-amber-200',
}

function StatCard({ icon: Icon, title, value, subtitle, color, accent }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} className={accent} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800 font-num mt-0.5">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    )
}

export default function WarehouseDashboard() {
    const [warehouses, setWarehouses] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [search, setSearch] = useState('')

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        try {
            const [whData, ordersRes] = await Promise.all([
                warehouseService.getAssignedWarehouses(),
                api.get('/warehouse/orders'),
            ])
            setWarehouses(whData || [])
            setOrders(ordersRes.result || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const handleAction = async (orderId, action) => {
        try {
            await api.put(`/warehouse/orders/${orderId}/${action}`)
            toast.success(action === 'pack' ? 'Order packed successfully' : 'Order marked as shipped')
            loadData(true)
        } catch (err) {
            toast.error(err?.message || `Failed to ${action} order`)
        }
    }

    // Stats
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayOrders = orders.filter(o => new Date(o.createdAt || o.created_at || 0) >= today)
    const pending   = orders.filter(o => o.status === 'CONFIRMED').length
    const packing   = orders.filter(o => o.status === 'PACKING').length
    const shipping  = orders.filter(o => o.status === 'SHIPPING').length
    const completed = orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length
    const revenue   = orders
        .filter(o => !['CANCELLED'].includes(o.status))
        .reduce((s, o) => s + (o.total || 0), 0)

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'

    // Filter & search
    const filtered = orders.filter(o => {
        const matchStatus = filterStatus === 'ALL' || o.status === filterStatus
        const q = search.toLowerCase()
        const matchSearch = !q || o.id?.toLowerCase().includes(q)
            || o.shippingAddress?.receiverName?.toLowerCase().includes(q)
        return matchStatus && matchSearch
    })

    const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1
        return acc
    }, {})

    const FILTER_TABS = [
        { key: 'ALL',       label: 'All',       count: orders.length },
        { key: 'CONFIRMED', label: 'To Pack',   count: statusCounts.CONFIRMED || 0 },
        { key: 'PACKING',   label: 'Packing',   count: statusCounts.PACKING || 0 },
        { key: 'SHIPPING',  label: 'Shipping',  count: statusCounts.SHIPPING || 0 },
        { key: 'DELIVERED', label: 'Delivered', count: statusCounts.DELIVERED || 0 },
        { key: 'CANCELLED', label: 'Cancelled', count: statusCounts.CANCELLED || 0 },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <RefreshCw size={24} className="animate-spin" />
                    <p className="text-sm">Loading warehouse data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Warehouse Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Managing <span className="font-medium text-green-600">{warehouses.length}</span> warehouse{warehouses.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Warehouse cards */}
            {warehouses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {warehouses.map(wh => (
                        <div key={wh.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                        <MapPin size={14} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 text-sm">{wh.name}</h3>
                                        {wh.isDefault && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Default</span>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wh.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {wh.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 ml-10">{wh.fullAddress || wh.province || 'No address'}</p>
                            {wh.ghnShopId && (
                                <p className="text-xs text-blue-500 mt-1 ml-10 font-num">GHN Shop #{wh.ghnShopId}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <StatCard icon={Clock}        title="To Pack"    value={pending}   subtitle="Awaiting packing" color="bg-blue-50"   accent="text-blue-500" />
                <StatCard icon={Package}      title="Packing"    value={packing}   subtitle="In progress"      color="bg-indigo-50" accent="text-indigo-500" />
                <StatCard icon={Truck}        title="In Transit" value={shipping}  subtitle="Out for delivery"  color="bg-purple-50" accent="text-purple-500" />
                <StatCard icon={CheckCircle}  title="Completed"  value={completed} subtitle="All time"         color="bg-green-50"  accent="text-green-600" />
                <StatCard icon={BarChart3}    title="Revenue"    value={`${currency}${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} subtitle="All active orders" color="bg-emerald-50" accent="text-emerald-600" />
            </div>

            {/* Orders section */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="font-semibold text-slate-800">Order Queue</h2>
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search order ID or customer..."
                            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 w-64"
                        />
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex-wrap">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterStatus(tab.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                filterStatus === tab.key
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-white hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1.5 font-num ${filterStatus === tab.key ? 'opacity-80' : 'text-slate-400'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Orders list */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Package size={40} className="mb-2 opacity-30" />
                        <p className="text-sm">No orders found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map(order => (
                            <div key={order.id}>
                                {/* Order row */}
                                <div
                                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-green-50/30 transition"
                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 font-num">
                                                #{order.id?.slice(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-xs text-slate-400 font-num">
                                                {order.createdAt || order.created_at
                                                    ? new Date(order.createdAt || order.created_at).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })
                                                    : '—'}
                                            </p>
                                        </div>

                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {order.status}
                                        </span>

                                        {order.shippingAddress?.receiverName && (
                                            <p className="text-sm text-slate-600 hidden sm:block truncate max-w-40">
                                                {order.shippingAddress.receiverName}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-800 font-num">
                                                {currency}{Number(order.total || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                            </p>
                                            <p className="text-xs text-slate-400">{order.payment || 'COD'}</p>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            {order.status === 'CONFIRMED' && (
                                                <button
                                                    onClick={() => handleAction(order.id, 'pack')}
                                                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium"
                                                >
                                                    <Package size={13} /> Pack
                                                </button>
                                            )}
                                            {order.status === 'PACKING' && (
                                                <button
                                                    onClick={() => handleAction(order.id, 'ship')}
                                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium"
                                                >
                                                    <Truck size={13} /> Ship
                                                </button>
                                            )}
                                        </div>

                                        {expandedOrder === order.id
                                            ? <ChevronUp size={16} className="text-slate-400" />
                                            : <ChevronDown size={16} className="text-slate-400" />
                                        }
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {expandedOrder === order.id && (
                                    <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 space-y-3">
                                        {/* Shipping address */}
                                        {order.shippingAddress && (
                                            <div className="bg-white rounded-lg p-3 border border-slate-100 flex items-start gap-3">
                                                <MapPin size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-700">
                                                        {order.shippingAddress.receiverName}
                                                        {order.shippingAddress.phoneNumber && (
                                                            <span className="font-normal text-slate-500 ml-2 font-num">
                                                                {order.shippingAddress.phoneNumber}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {[order.shippingAddress.detailAddress, order.shippingAddress.fullAddress]
                                                            .filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Items by shop group */}
                                        {order.shopGroups?.map(group => (
                                            <div key={group.id}>
                                                {group.warehouseName && (
                                                    <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                                                        <MapPin size={11} /> Fulfilled from: {group.warehouseName}
                                                    </p>
                                                )}
                                                <div className="space-y-2">
                                                    {group.items?.map(item => (
                                                        <div key={item.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-100">
                                                            {item.productImage && (
                                                                <img src={item.productImage} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                                                                <p className="text-xs text-slate-400">
                                                                    {item.variantName && `${item.variantName} · `}qty: {item.quantity}
                                                                </p>
                                                            </div>
                                                            <p className="text-sm font-semibold text-slate-800 font-num shrink-0">
                                                                {currency}{Number(item.price || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-end gap-4 text-xs text-slate-500 mt-2 font-num">
                                                    <span>Subtotal: {currency}{Number(group.subtotal || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                    <span>Shipping: {currency}{Number(group.shippingFee || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                </div>
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
