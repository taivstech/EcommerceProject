import Loading from "@/components/ui/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
    CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon, UsersIcon,
    ClockIcon, CheckCircleIcon, XCircleIcon, TruckIcon, PackageIcon, ShieldCheckIcon,
    BarChart3Icon, ActivityIcon, DownloadIcon, TrendingUpIcon, AlertTriangleIcon
} from "lucide-react"
import { useRouter } from "@/utils/compat"
import { useEffect, useState, useMemo, useCallback } from "react"
import { adminService } from "@/services"

const STATUS_LABELS = {
    AWAITING_PAYMENT: 'Awaiting Payment',
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    SHIPPING: 'Shipping',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
}

const DATE_PRESETS = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'All Time', value: 'all' },
]

function DonutChart({ data, size = 160, strokeWidth = 24, centerLabel = 'Orders' }) {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    let offset = 0

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
                {data.map((d, i) => {
                    const pct = total > 0 ? d.value / total : 0
                    const dashLength = circumference * pct
                    const dashOffset = circumference * offset
                    offset += pct
                    return (
                        <circle
                            key={i}
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none" stroke={d.color} strokeWidth={strokeWidth}
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
                <span className="text-2xl font-semibold text-slate-800 font-num">{total}</span>
                <span className="text-xs text-slate-400">{centerLabel}</span>
            </div>
        </div>
    )
}

export default function AdminDashboard() {

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState('30d')
    const [dashboardData, setDashboardData] = useState({
        total_products: 0, total_revenue: 0, total_orders: 0,
        total_shops: 0, total_users: 0, active_users: 0,
        pending_shops: 0, approved_shops: 0, approved_products: 0,
        pending_orders: 0, allOrders: [],
    })
    const [revenueChart, setRevenueChart] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [userGrowth, setUserGrowth] = useState([])
    const [categoryRevenue, setCategoryRevenue] = useState([])

    // Date filter on orders
    const filteredOrders = useMemo(() => {
        const orders = dashboardData.allOrders || []
        if (dateFilter === 'all') return orders
        const now = new Date()
        let cutoff = new Date()
        if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0)
        else if (dateFilter === '7d') cutoff.setDate(now.getDate() - 7)
        else if (dateFilter === '30d') cutoff.setDate(now.getDate() - 30)
        return orders.filter(o => new Date(o.created_at || o.createdAt || 0) >= cutoff)
    }, [dashboardData.allOrders, dateFilter])

    const orderStats = useMemo(() => {
        const orders = filteredOrders
        const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'AWAITING_PAYMENT').length
        const confirmed = orders.filter(o => o.status === 'CONFIRMED').length
        const shipping = orders.filter(o => o.status === 'SHIPPING').length
        const delivered = orders.filter(o => o.status === 'DELIVERED').length
        const completed = orders.filter(o => o.status === 'COMPLETED').length
        const cancelled = orders.filter(o => o.status === 'CANCELLED').length

        const active = orders.filter(o => o.status !== 'CANCELLED')
        const totalRevenue = active.reduce((sum, o) => sum + (o.total || 0), 0)
        const totalShipping = active.reduce((sum, o) => sum + (o.shipping_fee || 0), 0)
        const cancelRate = orders.length > 0 ? ((cancelled / orders.length) * 100).toFixed(1) : '0.0'
        const avgOrderValue = active.length > 0 ? (totalRevenue / active.length).toFixed(0) : 0

        const codOrders = orders.filter(o => (o.payment === 'COD') && o.status !== 'CANCELLED')
        const vnpayOrders = orders.filter(o => (o.payment === 'VNPAY') && o.status !== 'CANCELLED')
        const codTotal = codOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        const vnpayTotal = vnpayOrders.reduce((sum, o) => sum + (o.total || 0), 0)

        return { pending, confirmed, shipping, delivered, completed, cancelled, totalRevenue, totalShipping, cancelRate, avgOrderValue, codTotal, vnpayTotal, codOrders: codOrders.length, vnpayOrders: vnpayOrders.length }
    }, [filteredOrders])

    const donutData = useMemo(() => [
        { label: 'Completed', value: orderStats.completed, color: '#16a34a' },
        { label: 'Shipping', value: orderStats.shipping, color: '#4f46e5' },
        { label: 'Confirmed', value: orderStats.confirmed, color: '#2563eb' },
        { label: 'Pending', value: orderStats.pending, color: '#eab308' },
        { label: 'Cancelled', value: orderStats.cancelled, color: '#ef4444' },
    ], [orderStats])

    const fetchDashboardData = async () => {
        try {
            const [stats, orders] = await Promise.all([
                adminService.getDashboardStats().catch(() => null),
                adminService.getAllOrders().catch(() => []),
            ])
            setDashboardData({
                total_products: stats?.total_products || 0,
                total_revenue: stats?.total_revenue || 0,
                total_orders: stats?.total_orders || 0,
                total_shops: stats?.total_shops || 0,
                total_users: stats?.total_users || 0,
                active_users: stats?.active_users || 0,
                pending_shops: stats?.pending_shops || 0,
                approved_shops: stats?.approved_shops || 0,
                approved_products: stats?.approved_products || 0,
                pending_orders: stats?.pending_orders || 0,
                allOrders: orders || [],
            })
        } catch (err) {
            console.error('Failed to load dashboard:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDashboardData() }, [])

    // Fetch advanced analytics
    useEffect(() => {
        const days = dateFilter === 'today' ? 1 : dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 365
        Promise.all([
            adminService.getRevenueChart(days).catch(() => []),
            adminService.getTopProducts(days, 10).catch(() => []),
            adminService.getUserGrowth(days).catch(() => []),
            adminService.getCategoryRevenue(days).catch(() => []),
        ]).then(([rev, top, growth, catRev]) => {
            setRevenueChart(rev)
            setTopProducts(top)
            setUserGrowth(growth)
            setCategoryRevenue(catRev)
        })
    }, [dateFilter])

    const exportCSV = useCallback(() => {
        const orders = filteredOrders
        if (!orders.length) return
        const headers = ['Order ID', 'Status', 'Payment', 'Total', 'Shipping Fee', 'Date']
        const rows = orders.map(o => [o.id, o.status, o.payment || 'COD', (o.total || 0).toFixed(2), (o.shipping_fee || 0).toFixed(2), o.created_at ? new Date(o.created_at).toLocaleDateString('en-US') : '-'])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `admin_orders_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }, [filteredOrders, dateFilter])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                        {DATE_PRESETS.map(p => (
                            <button key={p.value} onClick={() => setDateFilter(p.value)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${dateFilter === p.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >{p.label}</button>
                        ))}
                    </div>
                    <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition">
                        <DownloadIcon size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                {[
                    { title: 'Total Revenue', value: `${currency}${orderStats.totalRevenue.toFixed(2)}`, icon: CircleDollarSignIcon, color: 'bg-green-50 text-green-600' },
                    { title: 'Total Orders', value: filteredOrders.length, icon: TagsIcon, color: 'bg-blue-50 text-blue-600' },
                    { title: 'Total Products', value: dashboardData.total_products, icon: ShoppingBasketIcon, color: 'bg-purple-50 text-purple-600' },
                    { title: 'Total Stores', value: dashboardData.total_shops, icon: StoreIcon, color: 'bg-orange-50 text-orange-600' },
                    { title: 'Total Users', value: dashboardData.total_users, icon: UsersIcon, color: 'bg-cyan-50 text-cyan-600' },
                ].map((card, index) => (
                    <div key={index} className="flex items-center gap-4 border border-slate-200 p-4 rounded-xl hover:shadow-sm transition bg-white">
                        <div className={`w-11 h-11 p-2.5 rounded-full flex items-center justify-center ${card.color} bg-opacity-20`}>
                            <card.icon size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">{card.title}</p>
                            <b className="text-xl font-semibold text-slate-700 font-num">{card.value}</b>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main grid: Donut + Users/Shops + Payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                {/* Donut Chart */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3Icon size={18} className="text-blue-500" /> Order Breakdown
                    </h3>
                    <div className="flex flex-col items-center gap-4">
                        <DonutChart data={donutData} />
                        <div className="w-full space-y-1.5">
                            {donutData.map((d, i) => (
                                <button key={i} onClick={() => router.push(`/admin/stores?orderStatus=${d.label.toUpperCase()}`)}
                                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition group">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-sm text-slate-600">{d.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-800 font-num">{d.value}</span>
                                        <span className="text-slate-300 group-hover:text-slate-500">›</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Users & Shops */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <UsersIcon size={18} className="text-cyan-500" /> Users & Shops
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Active Users', value: dashboardData.active_users },
                            { label: 'Approved Shops', value: dashboardData.approved_shops, color: 'text-green-600' },
                            { label: 'Pending Shops', value: dashboardData.pending_shops, color: 'text-yellow-600', link: '/admin/approve' },
                            { label: 'Active Products', value: dashboardData.approved_products },
                        ].map((item, i) => (
                            <button key={i} onClick={() => item.link && router.push(item.link)}
                                className="w-full flex justify-between items-center py-2 border-b border-slate-50 hover:bg-slate-50 px-2 rounded-lg transition">
                                <span className="text-sm text-slate-500">{item.label}</span>
                                <span className={`font-semibold font-num ${item.color || 'text-slate-700'}`}>{item.value}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment & Shipping */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <ActivityIcon size={18} className="text-green-500" /> Payment & Shipping
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: 'COD Orders', value: `${orderStats.codOrders} (${currency}${orderStats.codTotal.toFixed(2)})` },
                            { label: 'VNPay Orders', value: `${orderStats.vnpayOrders} (${currency}${orderStats.vnpayTotal.toFixed(2)})` },
                            { label: 'Total Shipping', value: `${currency}${orderStats.totalShipping.toFixed(2)}` },
                            { label: 'Avg Order Value', value: `${currency}${Number(orderStats.avgOrderValue).toFixed(2)}` },
                            { label: 'Cancel Rate', value: `${orderStats.cancelRate}% (${orderStats.cancelled})`, color: 'text-red-600' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-sm text-slate-500">{item.label}</span>
                                <span className={`font-semibold font-num ${item.color || 'text-slate-700'}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Area Chart */}
            <div className="mt-8">
                <OrdersAreaChart allOrders={filteredOrders} />
            </div>

            {/* Revenue & User Growth Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                {/* Revenue Chart */}
                {revenueChart.length > 0 && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-white">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <CircleDollarSignIcon size={18} className="text-green-500" /> Revenue Trend
                        </h3>
                        <div className="h-[250px] text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChart}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" />
                                    <YAxis />
                                    <Tooltip formatter={(v) => [`${currency}${Number(v).toFixed(2)}`, 'Revenue']} />
                                    <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#bbf7d0" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* User Growth Chart */}
                {userGrowth.length > 0 && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-white">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <UsersIcon size={18} className="text-cyan-500" /> New User Registrations
                        </h3>
                        <div className="h-[250px] text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Top Products & Category Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                {/* Top Products */}
                {topProducts.length > 0 && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-white">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUpIcon size={18} className="text-purple-500" /> Top Products by Revenue
                        </h3>
                        <div className="space-y-3">
                            {topProducts.slice(0, 8).map((p, i) => (
                                <div key={p.productId || i} className="flex items-center gap-3 py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-400 w-5 font-num">#{i + 1}</span>
                                    {p.imageUrl && (
                                        <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-700 truncate">{p.productName}</p>
                                        <p className="text-xs text-slate-400 font-num">{p.totalSold} sold</p>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600 font-num">{currency}{Number(p.revenue || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category Revenue */}
                {categoryRevenue.length > 0 && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-white">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <ShoppingBasketIcon size={18} className="text-orange-500" /> Revenue by Category
                        </h3>
                        <div className="h-[300px] text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryRevenue} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="categoryName" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v) => [`${currency}${Number(v).toFixed(2)}`, 'Revenue']} />
                                    <Bar dataKey="revenue" fill="#f97316" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Orders */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-slate-800">Recent Orders</h2>
                    <button onClick={() => router.push('/admin/stores')} className="text-sm text-green-600 hover:underline">View all →</button>
                </div>
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
                    <table className="w-full max-w-5xl text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50">
                                <th className="py-3 px-4 font-medium">Order ID</th>
                                <th className="py-3 px-4 font-medium">Status</th>
                                <th className="py-3 px-4 font-medium">Payment</th>
                                <th className="py-3 px-4 font-medium">Total</th>
                                <th className="py-3 px-4 font-medium">Shipping</th>
                                <th className="py-3 px-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.slice(0, 15).map((order) => (
                                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="py-3 px-4 text-slate-700 font-mono text-xs font-num">{order.id?.slice(0, 12)}...</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            order.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                            order.status === 'SHIPPING' ? 'bg-indigo-100 text-indigo-700' :
                                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'AWAITING_PAYMENT' ? 'bg-amber-100 text-amber-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 text-xs">{order.payment || 'COD'}</td>
                                    <td className="py-3 px-4 text-slate-800 font-num">{currency}{(order.total || 0).toFixed(2)}</td>
                                    <td className="py-3 px-4 text-slate-800 font-num">{currency}{(order.shipping_fee || 0).toFixed(2)}</td>
                                    <td className="py-3 px-4 text-slate-500 font-num">
                                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US') : '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No orders in this period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
