import { useEffect, useState, useMemo, useCallback } from 'react'
import Loading from '@/components/ui/Loading'
import { orderService, shopService } from '@/services'
import {
    WalletIcon, TrendingUpIcon, TrendingDownIcon, ArrowUpRightIcon, ArrowDownLeftIcon,
    DownloadIcon, CalendarIcon, BanknoteIcon, TruckIcon, ReceiptIcon, AlertCircleIcon
} from 'lucide-react'

const DATE_PRESETS = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'All Time', value: 'all' },
]

const TX_TYPES = {
    ORDER_REVENUE: { label: 'Order Revenue', icon: ArrowUpRightIcon, color: 'text-green-600', bg: 'bg-green-50' },
    SHIPPING_FEE: { label: 'Shipping Fee', icon: TruckIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    PLATFORM_FEE: { label: 'Platform Fee', icon: ReceiptIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    REFUND: { label: 'Refund', icon: ArrowDownLeftIcon, color: 'text-red-600', bg: 'bg-red-50' },
    CANCELLED: { label: 'Cancelled Order', icon: AlertCircleIcon, color: 'text-red-500', bg: 'bg-red-50' },
}

export default function CashFlowPage() {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState([])
    const [dateFilter, setDateFilter] = useState('30d')
    const [txTypeFilter, setTxTypeFilter] = useState('all')

    useEffect(() => {
        const load = async () => {
            try {
                const res = await orderService.getSellerOrders()
                setOrders(res || [])
            } catch (err) {
                console.error('Failed to load orders:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // Filter orders by date
    const filteredOrders = useMemo(() => {
        if (dateFilter === 'all') return orders
        const now = new Date()
        let cutoff = new Date()
        if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0)
        else if (dateFilter === '7d') cutoff.setDate(now.getDate() - 7)
        else if (dateFilter === '30d') cutoff.setDate(now.getDate() - 30)
        return orders.filter(o => new Date(o.created_at || o.createdAt || 0) >= cutoff)
    }, [orders, dateFilter])

    // Build transactions from orders
    const transactions = useMemo(() => {
        const txs = []
        filteredOrders.forEach(order => {
            const date = order.created_at || order.createdAt
            if (order.status === 'CANCELLED') {
                txs.push({
                    id: `${order.id}-cancel`,
                    type: 'CANCELLED',
                    amount: 0,
                    description: `Order #${(order.id || '').slice(0, 8)}... cancelled`,
                    date,
                    orderId: order.id,
                })
            } else {
                // Revenue from completed/delivered orders
                if (['COMPLETED', 'DELIVERED'].includes(order.status)) {
                    const total = order.total || 0
                    const shippingFee = order.shipping_fee || 0
                    const platformFee = total * 0.05 // 5% platform commission estimate

                    txs.push({
                        id: `${order.id}-rev`,
                        type: 'ORDER_REVENUE',
                        amount: total,
                        description: `Order #${(order.id || '').slice(0, 8)}... — ${order.payment || 'COD'}`,
                        date,
                        orderId: order.id,
                    })

                    if (shippingFee > 0) {
                        txs.push({
                            id: `${order.id}-ship`,
                            type: 'SHIPPING_FEE',
                            amount: -shippingFee,
                            description: `Shipping for #${(order.id || '').slice(0, 8)}...`,
                            date,
                            orderId: order.id,
                        })
                    }

                    txs.push({
                        id: `${order.id}-fee`,
                        type: 'PLATFORM_FEE',
                        amount: -platformFee,
                        description: `Platform fee (5%) for #${(order.id || '').slice(0, 8)}...`,
                        date,
                        orderId: order.id,
                    })
                }
            }
        })
        txs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        return txs
    }, [filteredOrders])

    // Filtered by tx type
    const displayedTxs = txTypeFilter === 'all' ? transactions : transactions.filter(t => t.type === txTypeFilter)

    // Summary
    const summary = useMemo(() => {
        const completedOrders = filteredOrders.filter(o => ['COMPLETED', 'DELIVERED'].includes(o.status))
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        const totalShipping = completedOrders.reduce((sum, o) => sum + (o.shipping_fee || 0), 0)
        const totalPlatformFee = totalRevenue * 0.05
        const netIncome = totalRevenue - totalShipping - totalPlatformFee
        const pendingOrders = filteredOrders.filter(o => ['PENDING', 'CONFIRMED', 'SHIPPING', 'AWAITING_PAYMENT'].includes(o.status))
        const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0)

        return { totalRevenue, totalShipping, totalPlatformFee, netIncome, pendingAmount, pendingCount: pendingOrders.length }
    }, [filteredOrders])

    // Export CSV
    const exportCSV = useCallback(() => {
        if (!displayedTxs.length) return
        const headers = ['Type', 'Amount', 'Description', 'Date']
        const rows = displayedTxs.map(t => [
            TX_TYPES[t.type]?.label || t.type,
            t.amount.toFixed(2),
            `"${t.description}"`,
            t.date ? new Date(t.date).toLocaleDateString('en-US') : '-'
        ])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cash_flow_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }, [displayedTxs, dateFilter])

    if (loading) return <Loading />

    return (
        <div className="text-black mb-28">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Cash Flow</h1>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <p className="text-xs text-green-700 font-medium mb-1">Net Balance</p>
                    <p className="text-2xl font-bold text-green-800 font-num">{currency}{summary.netIncome.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-800 font-num">{currency}{summary.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Pending Amount</p>
                    <p className="text-2xl font-bold text-yellow-600 font-num">{currency}{summary.pendingAmount.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-num">{summary.pendingCount} pending orders</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Total Fees</p>
                    <p className="text-2xl font-bold text-red-600 font-num">-{currency}{(summary.totalShipping + summary.totalPlatformFee).toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Shipping + Platform</p>
                </div>
            </div>

            {/* Fee Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <TruckIcon size={18} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Shipping Costs</p>
                        <p className="font-semibold text-slate-800 font-num">{currency}{summary.totalShipping.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <ReceiptIcon size={18} className="text-orange-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Platform Commission (5%)</p>
                        <p className="font-semibold text-slate-800 font-num">{currency}{summary.totalPlatformFee.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <BanknoteIcon size={18} className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Payout (after fees)</p>
                        <p className="font-semibold text-green-700 font-num">{currency}{summary.netIncome.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Transaction Type Filter */}
            <div className="flex items-center gap-2 mt-8 mb-4 overflow-x-auto">
                <button onClick={() => setTxTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${txTypeFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    All
                </button>
                {Object.entries(TX_TYPES).map(([key, val]) => (
                    <button key={key} onClick={() => setTxTypeFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${txTypeFilter === key ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {val.label}
                    </button>
                ))}
            </div>

            {/* Transaction List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-left border-b border-slate-200">
                            <th className="py-3 px-4 font-medium text-slate-500">Type</th>
                            <th className="py-3 px-4 font-medium text-slate-500">Description</th>
                            <th className="py-3 px-4 font-medium text-slate-500 text-right">Amount</th>
                            <th className="py-3 px-4 font-medium text-slate-500">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTxs.length === 0 ? (
                            <tr><td colSpan={4} className="py-12 text-center text-slate-400">No transactions found</td></tr>
                        ) : displayedTxs.map(tx => {
                            const meta = TX_TYPES[tx.type] || TX_TYPES.ORDER_REVENUE
                            const Icon = meta.icon
                            return (
                                <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.bg}`}>
                                                <Icon size={15} className={meta.color} />
                                            </div>
                                            <span className="text-xs font-medium text-slate-600">{meta.label}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-700 text-xs">{tx.description}</td>
                                    <td className={`py-3 px-4 text-right font-semibold font-num ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.amount >= 0 ? '+' : ''}{currency}{Math.abs(tx.amount).toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 text-xs font-num">
                                        {tx.date ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
