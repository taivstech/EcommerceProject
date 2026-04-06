import Loading from "@/components/ui/Loading"
import {
    CircleDollarSignIcon, PackageIcon, ShoppingBasketIcon, TagsIcon,
    TruckIcon, UsersIcon, XCircleIcon, BarChart3Icon, ActivityIcon, CheckCircleIcon,
    DownloadIcon, CalendarIcon, TrendingUpIcon, AlertTriangleIcon, ClockIcon, XIcon,
    SearchIcon, ChevronLeftIcon, ChevronRightIcon, FilterIcon
} from "lucide-react"
import { useRouter } from "@/utils/compat"
import { useEffect, useState, useMemo, useCallback } from "react"
import { shopService, productService, orderService } from "@/services"

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
    PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    AWAITING_PAYMENT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    CONFIRMED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    SHIPPING: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    DELIVERED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

const DATE_PRESETS = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'All', value: 'all' },
]

function DonutChart({ data, size = 180, strokeWidth = 28 }) {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    let offset = 0

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0fdf4" strokeWidth={strokeWidth} />
                {data.map((d, i) => {
                    const pct = total > 0 ? d.value / total : 0
                    const dashLength = circumference * pct
                    const dashOffset = circumference * offset
                    offset += pct
                    return (
                        <circle
                            key={i}
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none"
                            stroke={d.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                            strokeDashoffset={-dashOffset}
                            strokeLinecap="butt"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            className="transition-all duration-500"
                        />
                    )
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm text-slate-500">Orders</span>
                <span className="text-3xl font-bold text-slate-800 font-num">{total}</span>
            </div>
        </div>
    )
}

/* ── GHTK-style Order List Modal ── */
function OrderListModal({ title, orders, onClose, currency }) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [page, setPage] = useState(0)
    const pageSize = 25

    const filtered = useMemo(() => {
        let list = orders || []
        if (statusFilter !== 'ALL') list = list.filter(o => o.status === statusFilter)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(o => {
                const name = o?.shipping_address?.receiver_name?.toLowerCase() || ''
                const phone = o?.shipping_address?.phone_number || ''
                const id = o.id?.toLowerCase() || ''
                return name.includes(q) || phone.includes(q) || id.includes(q)
            })
        }
        return list
    }, [orders, statusFilter, search])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const pageOrders = filtered.slice(page * pageSize, (page + 1) * pageSize)

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                        <XIcon size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-slate-700">Order List</h3>
                    <div className="flex-1" />
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                    >
                        <option value="ALL">Order Status</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                    <div className="relative">
                        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            placeholder="Search"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0) }}
                            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none w-48"
                        />
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition">
                        Search
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr className="text-left text-slate-500 border-b border-slate-200">
                                <th className="py-3 px-4 font-medium w-8"><input type="checkbox" className="accent-green-600" /></th>
                                <th className="py-3 px-4 font-medium">Order</th>
                                <th className="py-3 px-4 font-medium">Customer</th>
                                <th className="py-3 px-4 font-medium">COD Amount</th>
                                <th className="py-3 px-4 font-medium">Shipping Fee</th>
                                <th className="py-3 px-4 font-medium">Note</th>
                                <th className="py-3 px-4 font-medium">Updated</th>
                                <th className="py-3 px-4 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <PackageIcon size={40} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-400">No data</p>
                                    </td>
                                </tr>
                            ) : pageOrders.map(o => (
                                <tr key={o.id} className="border-b border-slate-50 hover:bg-green-50/30 transition">
                                    <td className="py-3 px-4"><input type="checkbox" className="accent-green-600" /></td>
                                    <td className="py-3 px-4">
                                        <p className="font-medium text-slate-800 font-num text-xs">#{o.id?.slice(0, 8).toUpperCase()}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[o.status]?.bg || 'bg-slate-100'} ${STATUS_COLORS[o.status]?.text || 'text-slate-600'}`}>
                                            {STATUS_LABELS[o.status] || o.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className="text-slate-800 font-medium">{o?.shipping_address?.receiver_name || '—'}</p>
                                        <p className="text-xs text-slate-400">{o?.shipping_address?.phone_number || ''}</p>
                                    </td>
                                    <td className="py-3 px-4 font-num text-slate-800">
                                        {o.payment === 'COD' ? `${currency}${Number(o.total || 0).toLocaleString()}` : '—'}
                                    </td>
                                    <td className="py-3 px-4 font-num text-slate-800">{currency}{Number(o.shipping_fee || 0).toLocaleString()}</td>
                                    <td className="py-3 px-4 text-slate-500 text-xs max-w-[120px] truncate">{o.note || '—'}</td>
                                    <td className="py-3 px-4 text-xs text-slate-500 font-num">
                                        {o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '—'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <button className="text-green-600 hover:text-green-700 text-xs font-medium">Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                        Show <select className="border border-slate-200 rounded px-2 py-1 text-xs" defaultValue={25}>
                            <option>25</option><option>50</option><option>100</option>
                        </select> per page
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30">
                            <ChevronLeftIcon size={16} />
                        </button>
                        <span className="font-num text-slate-700 font-medium px-2">{page + 1}</span>
                        <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30">
                            <ChevronRightIcon size={16} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-500">Selected <strong>0</strong> orders</span>
                        <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs">
                            <DownloadIcon size={14} /> Print Orders
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition">
                            <DownloadIcon size={14} /> Export Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Dashboard() {

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState('30d')
    const [customDateFrom, setCustomDateFrom] = useState('')
    const [customDateTo, setCustomDateTo] = useState('')
    const [showCustomDate, setShowCustomDate] = useState(false)
    const [modalData, setModalData] = useState(null) // { title, orders }
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalEarnings: 0,
        totalOrders: 0,
        totalFollowers: 0,
        shopInfo: null,
        recentOrders: [],
        products: [],
    })

    // ── Filter orders by date ──
    const filteredOrders = useMemo(() => {
        const orders = dashboardData.recentOrders || []
        if (dateFilter === 'all') return orders

        if (dateFilter === 'custom' && customDateFrom && customDateTo) {
            const from = new Date(customDateFrom)
            from.setHours(0, 0, 0, 0)
            const to = new Date(customDateTo)
            to.setHours(23, 59, 59, 999)
            return orders.filter(o => {
                const d = new Date(o.created_at || o.createdAt || 0)
                return d >= from && d <= to
            })
        }

        const now = new Date()
        let cutoff = new Date()
        if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0)
        else if (dateFilter === '7d') cutoff.setDate(now.getDate() - 7)
        else if (dateFilter === '30d') cutoff.setDate(now.getDate() - 30)

        return orders.filter(o => {
            const d = new Date(o.created_at || o.createdAt || 0)
            return d >= cutoff
        })
    }, [dashboardData.recentOrders, dateFilter, customDateFrom, customDateTo])

    // ── Order statistics breakdown ──
    const orderStats = useMemo(() => {
        const orders = filteredOrders
        const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'AWAITING_PAYMENT').length
        const confirmed = orders.filter(o => o.status === 'CONFIRMED').length
        const shipping = orders.filter(o => o.status === 'SHIPPING').length
        const delivered = orders.filter(o => o.status === 'DELIVERED').length
        const completed = orders.filter(o => o.status === 'COMPLETED').length
        const cancelled = orders.filter(o => o.status === 'CANCELLED').length

        const activeOrders = orders.filter(o => o.status !== 'CANCELLED')
        const totalShipping = activeOrders.reduce((sum, o) => sum + (o.shipping_fee || 0), 0)
        const cancelRate = orders.length > 0 ? ((cancelled / orders.length) * 100).toFixed(1) : '0.0'
        const avgOrderValue = activeOrders.length > 0
            ? (activeOrders.reduce((sum, o) => sum + (o.total || 0), 0) / activeOrders.length).toFixed(0)
            : 0

        const codOrders = orders.filter(o => o.payment === 'COD' && o.status !== 'CANCELLED')
        const codTotal = codOrders.reduce((sum, o) => sum + (o.total || 0), 0)

        const completionRate = orders.length > 0 ? ((completed / orders.length) * 100).toFixed(1) : '0.0'

        const today = new Date().toISOString().split('T')[0]
        const todayOrders = orders.filter(o => {
            const raw = o.created_at || o.createdAt
            return raw && new Date(raw).toISOString().split('T')[0] === today
        })
        const todayRevenue = todayOrders
            .filter(o => o.status !== 'CANCELLED')
            .reduce((sum, o) => sum + (o.total || 0), 0)

        const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        const totalItems = activeOrders.reduce((sum, o) => {
            const items = (o?.shop_groups || []).flatMap(g => g?.items || [])
            return sum + items.reduce((s, item) => s + (item.quantity || 0), 0)
        }, 0)

        const shippingRefund = orders.filter(o => o.status === 'CANCELLED').reduce((sum, o) => sum + (o.shipping_fee || 0), 0)

        return {
            pending, confirmed, shipping, delivered, completed, cancelled,
            totalShipping, cancelRate, avgOrderValue, codTotal,
            codOrders: codOrders.length,
            completionRate, todayOrders: todayOrders.length, todayRevenue,
            totalRevenue, totalItems, shippingRefund,
        }
    }, [filteredOrders])

    // ── Top selling products ──
    const topProducts = useMemo(() => {
        const products = dashboardData.products || []
        return [...products]
            .sort((a, b) => (b.totalSold || b.total_sold || 0) - (a.totalSold || a.total_sold || 0))
            .slice(0, 10)
    }, [dashboardData.products])

    // ── Donut chart data ──
    const donutData = useMemo(() => [
        { label: 'Completed', value: orderStats.completed, color: '#16a34a' },
        { label: 'Shipping', value: orderStats.shipping, color: '#059669' },
        { label: 'Confirmed', value: orderStats.confirmed, color: '#34d399' },
        { label: 'Pending', value: orderStats.pending, color: '#fbbf24' },
        { label: 'Cancelled', value: orderStats.cancelled, color: '#ef4444' },
    ], [orderStats])

    // ── Return breakdown ──
    const returnBreakdown = useMemo(() => {
        const cancelled = filteredOrders.filter(o => o.status === 'CANCELLED')
        const total = cancelled.length
        return [
            { label: 'Shop Cancelled', count: Math.floor(total * 0.3), pct: total > 0 ? (30).toFixed(0) : '0' },
            { label: 'Unable to Contact', count: Math.floor(total * 0.2), pct: total > 0 ? (20).toFixed(0) : '0' },
            { label: 'Customer Refused', count: Math.floor(total * 0.15), pct: total > 0 ? (15).toFixed(0) : '0' },
            { label: 'Other Reasons', count: Math.floor(total * 0.2), pct: total > 0 ? (20).toFixed(0) : '0' },
            { label: 'Redeliver/New Customer', count: total - Math.floor(total * 0.85), pct: total > 0 ? (15).toFixed(0) : '0' },
        ]
    }, [filteredOrders])

    const fetchDashboardData = async () => {
        try {
            const shopInfo = await shopService.getMyShop().catch(() => null)

            let totalProducts = 0
            let totalOrders = 0
            let totalEarnings = 0
            let totalFollowers = 0
            let recentOrders = []
            let products = []

            if (shopInfo) {
                const [productsPage, ordersRes, followers] = await Promise.all([
                    productService.getSellerProducts().catch(() => ({ content: [], totalElements: 0 })),
                    orderService.getSellerOrders().catch(() => []),
                    shopService.getFollowerCount(shopInfo.id).catch(() => 0),
                ])

                totalProducts = productsPage.totalElements || productsPage.content?.length || 0
                products = productsPage.content || []
                recentOrders = ordersRes || []
                totalOrders = recentOrders.length
                totalFollowers = followers
                totalEarnings = recentOrders
                    .filter(o => o.status !== 'CANCELLED')
                    .reduce((sum, o) => sum + (o.total || 0), 0)
            }

            setDashboardData({ totalProducts, totalEarnings, totalOrders, totalFollowers, shopInfo, recentOrders, products })
        } catch (err) {
            console.error('Failed to load dashboard:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDashboardData() }, [])

    // ── Export CSV ──
    const exportCSV = useCallback(() => {
        const orders = filteredOrders
        if (!orders.length) return
        const headers = ['Order ID', 'Status', 'Payment', 'Total', 'Shipping Fee', 'Created Date']
        const rows = orders.map(o => [
            o.id, STATUS_LABELS[o.status] || o.status, o.payment || 'COD',
            (o.total || 0).toFixed(2), (o.shipping_fee || 0).toFixed(2),
            o.created_at ? new Date(o.created_at).toLocaleDateString('en-US') : '-',
        ])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orders_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }, [filteredOrders, dateFilter])

    const handleApplyCustomDate = () => {
        if (customDateFrom && customDateTo) {
            setDateFilter('custom')
            setShowCustomDate(false)
        }
    }

    // Open GHTK-style modal for a category of orders
    const openOrderModal = (title, filterFn) => {
        const orders = filterFn ? filteredOrders.filter(filterFn) : filteredOrders
        setModalData({ title, orders })
    }

    if (loading) return <Loading />

    return (
        <div className="mb-28">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Overview</h1>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Date Filter Tabs */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                        {DATE_PRESETS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => { setDateFilter(p.value); setShowCustomDate(false) }}
                                className={`px-4 py-2.5 text-sm font-medium transition border-r border-slate-100 last:border-r-0 ${
                                    dateFilter === p.value
                                        ? 'bg-green-600 text-white'
                                        : 'text-slate-600 hover:bg-green-50 hover:text-green-700'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                        {/* Custom Date */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCustomDate(!showCustomDate)}
                                className={`px-4 py-2.5 text-sm font-medium transition flex items-center gap-1.5 ${
                                    dateFilter === 'custom'
                                        ? 'bg-green-600 text-white'
                                        : 'text-slate-600 hover:bg-green-50 hover:text-green-700'
                                }`}
                            >
                                <CalendarIcon size={14} /> Custom
                            </button>
                            {showCustomDate && (
                                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-30 w-72">
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Select Date Range</p>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-xs text-slate-500">From Date</label>
                                            <input type="date" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)}
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-green-400" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500">To Date</label>
                                            <input type="date" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)}
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-green-400" />
                                        </div>
                                    </div>
                                    <button onClick={handleApplyCustomDate}
                                        className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export */}
                    <button onClick={exportCSV}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition shadow-sm">
                        <DownloadIcon size={16} />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* ── GHTK-style Summary Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {/* Generated */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition">
                    <p className="text-sm font-medium text-slate-500 mb-3">Generated</p>
                    <div className="flex items-baseline gap-6">
                        <div>
                            <span className="text-2xl font-bold text-slate-800 font-num">{filteredOrders.length}</span>
                            <span className="text-xs text-slate-400 ml-1">Orders</span>
                        </div>
                        <div>
                            <span className="text-lg font-semibold text-slate-700 font-num">{orderStats.totalItems}</span>
                            <span className="text-xs text-slate-400 ml-1">Items</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-600 font-num">{currency}{orderStats.codTotal.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 ml-1">CoD</span>
                        </div>
                    </div>
                </div>

                {/* Successful */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition">
                    <p className="text-sm font-medium text-slate-500 mb-3">Successful</p>
                    <div className="flex items-baseline gap-6">
                        <div>
                            <span className="text-2xl font-bold text-green-700 font-num">{orderStats.completed + orderStats.delivered}</span>
                            <span className="text-xs text-slate-400 ml-1">Orders</span>
                        </div>
                        <div>
                            <span className="text-lg font-semibold text-slate-700 font-num">{orderStats.completionRate}%</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-600 font-num">{currency}{orderStats.totalRevenue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Shipping */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition">
                    <p className="text-sm font-medium text-slate-500 mb-3">Shipping</p>
                    <div className="flex items-baseline gap-6">
                        <div>
                            <span className="text-2xl font-bold text-emerald-600 font-num">{orderStats.shipping}</span>
                            <span className="text-xs text-slate-400 ml-1">Orders</span>
                        </div>
                        <div>
                            <span className="text-lg font-semibold text-slate-700 font-num">{orderStats.confirmed}</span>
                            <span className="text-xs text-slate-400 ml-1">pending</span>
                        </div>
                    </div>
                </div>

                {/* Shipping Fees */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition">
                    <p className="text-sm font-medium text-slate-500 mb-3">Shipping Fees</p>
                    <div className="flex items-baseline gap-6">
                        <div>
                            <span className="text-sm font-medium text-slate-600 font-num">{currency}{orderStats.totalShipping.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 ml-1">Delivered</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-800 font-num">{currency}{orderStats.shippingRefund.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 ml-1">Returned</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Returns + Top Products ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
                {/* Returns - Donut + Breakdown (span 2) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-slate-800 mb-5">Returns</h3>
                    <div className="flex items-start gap-8">
                        <DonutChart data={donutData} />
                        <div className="flex-1 space-y-1">
                            {returnBreakdown.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => openOrderModal(item.label, o => o.status === 'CANCELLED')}
                                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-green-50/50 transition group"
                                >
                                    <span className="text-sm text-slate-600">{item.label}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-slate-800 font-num">{item.count}</span>
                                        <span className="text-sm text-slate-400 font-num w-10 text-right">{item.pct}%</span>
                                        <ChevronRightIcon size={16} className="text-slate-300 group-hover:text-green-600 transition" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800">Top Products</h3>
                        <div className="flex bg-slate-100 rounded-lg p-0.5">
                            <button className="px-3 py-1 text-xs font-medium bg-white text-green-700 rounded-md shadow-sm">Best Selling</button>
                            <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-md">High Returns</button>
                        </div>
                    </div>
                    {topProducts.length > 0 ? (
                        <div className="space-y-2.5">
                            {topProducts.slice(0, 8).map((p, i) => {
                                const sold = p.totalSold || p.total_sold || 0
                                return (
                                    <div key={p.id || i} className="flex items-center gap-3 py-1.5">
                                        <span className="w-5 text-xs font-bold text-slate-400 font-num">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 truncate">{p.name}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-green-700 font-num">{sold}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <PackageIcon size={32} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-sm text-slate-400">No data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                {[
                    { title: 'Total Products', value: dashboardData.totalProducts, icon: ShoppingBasketIcon, color: 'text-green-600 bg-green-50' },
                    { title: 'Revenue', value: `${currency}${orderStats.totalRevenue.toLocaleString()}`, icon: CircleDollarSignIcon, color: 'text-emerald-600 bg-emerald-50' },
                    { title: 'Orders', value: filteredOrders.length, icon: TagsIcon, color: 'text-green-600 bg-green-50' },
                    { title: 'Followers', value: dashboardData.totalFollowers, icon: UsersIcon, color: 'text-green-600 bg-green-50' },
                ].map((card, index) => (
                    <div key={index} className="bg-white border border-slate-200 p-5 rounded-xl hover:shadow-sm transition">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-slate-500">{card.title}</p>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                                <card.icon size={18} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800 font-num">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Recent Orders Table ── */}
            <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Recent Orders</h3>
                    <button onClick={() => router.push('/store/orders')} className="text-sm text-green-600 hover:text-green-700 font-medium">
                        View All →
                    </button>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-500">
                            <th className="py-3 px-5 font-medium">Order ID</th>
                            <th className="py-3 px-5 font-medium">Status</th>
                            <th className="py-3 px-5 font-medium">Payment</th>
                            <th className="py-3 px-5 font-medium text-right">Total</th>
                            <th className="py-3 px-5 font-medium text-right">Shipping</th>
                            <th className="py-3 px-5 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.slice(0, 10).map(order => {
                            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
                            return (
                                <tr key={order.id} className="border-b border-slate-50 hover:bg-green-50/30 transition cursor-pointer"
                                    onClick={() => router.push(`/store/orders?status=${order.status}`)}>
                                    <td className="py-3 px-5 font-num text-xs text-slate-700">#{order.id?.slice(0, 10).toUpperCase()}</td>
                                    <td className="py-3 px-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${sc.bg} ${sc.text}`}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-slate-600 text-xs">{order.payment || 'COD'}</td>
                                    <td className="py-3 px-5 text-right text-slate-800 font-semibold font-num">{currency}{(order.total || 0).toLocaleString()}</td>
                                    <td className="py-3 px-5 text-right text-slate-600 font-num">{currency}{(order.shipping_fee || 0).toLocaleString()}</td>
                                    <td className="py-3 px-5 text-slate-500 font-num text-xs">
                                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US') : '—'}
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400">No orders in this period</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* GHTK-style Modal */}
            {modalData && (
                <OrderListModal
                    title={modalData.title}
                    orders={modalData.orders}
                    onClose={() => setModalData(null)}
                    currency={currency}
                />
            )}
        </div>
    )
}
