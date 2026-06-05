import { useEffect, useState } from "react"
import { adminService } from "@/services"
import api from "@/api/api"
const Card = ({ children, className }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className || ""}`}>
        {children}
    </div>
);

import { format } from "date-fns"
import Loading from "@/components/ui/Loading"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { WalletIcon, ArrowUpRightIcon, CircleDollarSignIcon } from "lucide-react"
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    return (
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 rounded disabled:opacity-50 text-sm bg-white hover:bg-slate-50 transition"
            >
                Prev
            </button>
            <span className="text-sm text-slate-600 font-medium px-2">Page {currentPage} of {totalPages}</span>
            <button 
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-200 rounded disabled:opacity-50 text-sm bg-white hover:bg-slate-50 transition"
            >
                Next
            </button>
        </div>
    )
};

export default function AdminCashFlow() {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "$"
    const [loading, setLoading] = useState(true)
    const [history, setHistory] = useState({ content: [], totalPages: 0, totalElements: 0 })
    const [page, setPage] = useState(1)
    const [size] = useState(10)
    const [revenueChart, setRevenueChart] = useState([])
    const [summary, setSummary] = useState({ totalRevenue: 0, totalGmv: 0 })

    const formatDate = (dateInput) => {
        if (!dateInput) return '-';
        if (Array.isArray(dateInput)) {
            const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
            return format(new Date(year, month - 1, day, hour, minute, second), "MMM dd, yyyy HH:mm");
        }
        try {
            return format(new Date(dateInput), "MMM dd, yyyy HH:mm");
        } catch {
            return '-';
        }
    };

    useEffect(() => {
        fetchData()
    }, [page])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [historyData, commRevRes] = await Promise.all([
                adminService.getCommissionHistory(page - 1, size),
                api.get('/admin/commission/revenue?days=30').catch(() => null)
            ])
            setHistory(historyData)
            if (commRevRes && commRevRes.result) {
                const comm = commRevRes.result;
                setRevenueChart(comm.daily_breakdown || []);
                setSummary({
                    totalRevenue: comm.total_revenue || 0,
                    totalGmv: comm.total_gmv || 0
                })
            }
        } catch (err) {
            console.error("Failed to fetch cash flow data:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading && history.content.length === 0) return <Loading />

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <WalletIcon className="w-6 h-6 text-indigo-600" />
                        Platform Cash Flow
                    </h1>
                    <p className="text-slate-500 mt-1">Manage and track platform commission revenue</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-l-4 border-l-indigo-600">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Platform Revenue</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">
                                {currency}{summary.totalRevenue.toFixed(2)}
                            </h3>
                            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                                <ArrowUpRightIcon className="w-4 h-4" /> Lifetime Earnings
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                            <CircleDollarSignIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-emerald-600">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total GMV (Gross Merchandise Value)</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">
                                {currency}{summary.totalGmv.toFixed(2)}
                            </h3>
                            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                                <ArrowUpRightIcon className="w-4 h-4" /> Lifetime Traded Volume
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                            <WalletIcon className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Overview (Last 30 Days)</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={val => val ? String(val).slice(5) : ''} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={val => `${currency}${val}`} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`${currency}${Number(value).toFixed(2)}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Commission History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-y border-slate-100">
                                <th className="p-4 font-semibold text-slate-600 text-sm">Date</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Order ID</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Shop Name</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Gross Amount</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Rate</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Platform Commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.content.map((item) => {
                                const orderId = item.orderId || item.order_id || '';
                                const shopName = item.shopName || item.shop_name || '';
                                const grossAmount = item.grossAmount ?? item.gross_amount ?? 0;
                                const commissionRate = item.commissionRate ?? item.commission_rate ?? 0;
                                const commissionAmount = item.commissionAmount ?? item.commission_amount ?? 0;
                                const createdAt = item.createdAt || item.created_at;

                                return (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-sm text-slate-600">
                                        {formatDate(createdAt)}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 font-mono">
                                        {orderId ? orderId.substring(0, 8) : ''}...
                                    </td>
                                    <td className="p-4 text-sm text-slate-800 font-medium">
                                        {shopName}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {currency}{grossAmount.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {(commissionRate * 100).toFixed(1)}%
                                    </td>
                                    <td className="p-4 text-sm font-bold text-emerald-600 bg-emerald-50/50">
                                        +{currency}{commissionAmount.toFixed(2)}
                                    </td>
                                </tr>
                                )
                            })}
                            {history.content.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No commission history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {history.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex justify-end">
                        <Pagination
                            currentPage={page}
                            totalPages={history.totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}
