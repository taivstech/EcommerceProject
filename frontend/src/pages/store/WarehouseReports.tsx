import { useState, useEffect } from 'react'
import { useParams, useRouter } from "@/utils/compat"
import { warehouseService } from '@/services/warehouseService'
import type { InventorySummary, ProductAging } from '@/services/inventoryService'
import { ArrowLeft, BarChart3, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '@/components/ui/Loading'

export default function WarehouseReportsPage() {
    const params = useParams()
    const router = useRouter()
    const warehouseId = params.id as string

    const [warehouse, setWarehouse] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<InventorySummary | null>(null)
    const [aging, setAging] = useState<ProductAging[]>([])

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [wh, inv, agingData] = await Promise.all([
                    warehouseService.getById(warehouseId),
                    warehouseService.getInventorySummary(),
                    warehouseService.getProductAging(),
                ])
                setWarehouse(wh)
                setSummary(inv)
                setAging(agingData)
            } catch {
                toast.error('Failed to load reports')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [warehouseId])

    if (loading) return <Loading />

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'

    const agingColor = (cat: string) => {
        if (cat === 'DEAD_STOCK') return 'bg-red-100 text-red-700'
        if (cat === 'SLOW_MOVING') return 'bg-amber-100 text-amber-700'
        if (cat === 'NORMAL') return 'bg-blue-100 text-blue-700'
        return 'bg-green-100 text-green-700'
    }

    const agingLabel = (cat: string) => {
        if (cat === 'DEAD_STOCK') return 'Dead Stock'
        if (cat === 'SLOW_MOVING') return 'Slow Moving'
        if (cat === 'NORMAL') return 'Normal'
        return 'Fast Moving'
    }

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
                    <h1 className="text-2xl font-bold text-slate-800">Warehouse Reports</h1>
                    <p className="text-sm text-slate-500">{warehouse?.name}</p>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500">Products</p>
                            <Package size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800 font-num">{summary.totalProducts}</p>
                        <p className="text-xs text-slate-400 mt-1">{summary.totalVariants} variants</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500">Stock Units</p>
                            <BarChart3 size={16} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800 font-num">{summary.totalStockUnits.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">{summary.totalSoldUnits.toLocaleString()} sold</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500">Low Stock</p>
                            <AlertTriangle size={16} className="text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-amber-600 font-num">{summary.lowStockItems + summary.criticalStockItems}</p>
                        <p className="text-xs text-slate-400 mt-1">{summary.outOfStockItems} out of stock</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500">Turnover Rate</p>
                            <TrendingUp size={16} className="text-purple-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800 font-num">{summary.averageTurnoverRate}x</p>
                        <p className="text-xs text-slate-400 mt-1">{summary.deadStockItems} dead stock items</p>
                    </div>
                </div>
            )}

            {/* Product Aging Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">Product Aging Analysis</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Products categorized by sales velocity and stock age</p>
                </div>
                {aging.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <BarChart3 size={48} className="mb-3 opacity-30" />
                        <p className="text-sm">No product data available</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <div className="col-span-4">Product</div>
                            <div className="col-span-1 text-right">Stock</div>
                            <div className="col-span-1 text-right">Sold</div>
                            <div className="col-span-2 text-right">Price Range</div>
                            <div className="col-span-1 text-right">Days</div>
                            <div className="col-span-1 text-right">Turn.</div>
                            <div className="col-span-2 text-center">Category</div>
                        </div>
                        {aging.map(p => (
                            <div key={p.productId} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-slate-50 transition">
                                <div className="col-span-4 flex items-center gap-3 min-w-0">
                                    {p.mainImageUrl ? (
                                        <img src={p.mainImageUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0 border border-slate-200" />
                                    ) : (
                                        <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                            <Package size={14} className="text-slate-400" />
                                        </div>
                                    )}
                                    <p className="text-sm font-medium text-slate-800 truncate">{p.productName}</p>
                                </div>
                                <div className="col-span-1 text-right text-sm font-num text-slate-700">{p.totalStock.toLocaleString()}</div>
                                <div className="col-span-1 text-right text-sm font-num text-slate-700">{p.totalSold.toLocaleString()}</div>
                                <div className="col-span-2 text-right text-xs font-num text-slate-600">
                                    {currency}{Number(p.minPrice || 0).toLocaleString()} — {currency}{Number(p.maxPrice || 0).toLocaleString()}
                                </div>
                                <div className="col-span-1 text-right text-sm font-num text-slate-600">{p.daysInInventory}</div>
                                <div className="col-span-1 text-right text-sm font-num text-slate-700">{p.turnoverRate}x</div>
                                <div className="col-span-2 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${agingColor(p.agingCategory)}`}>
                                        {agingLabel(p.agingCategory)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
