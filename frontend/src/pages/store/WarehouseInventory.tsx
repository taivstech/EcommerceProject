import { useState, useEffect } from 'react'
import { useParams, useRouter } from "@/utils/compat"
import { warehouseService } from '@/services/warehouseService'
import type { StockAlert } from '@/services/inventoryService'
import { ArrowLeft, Package, Search, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '@/components/ui/Loading'

export default function WarehouseInventoryPage() {
    const params = useParams()
    const router = useRouter()
    const warehouseId = params.id as string

    const [warehouse, setWarehouse] = useState(null)
    const [inventory, setInventory] = useState<StockAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [wh, alerts] = await Promise.all([
                    warehouseService.getById(warehouseId),
                    warehouseService.getStockAlerts(9999),
                ])
                setWarehouse(wh)
                setInventory(alerts)
            } catch {
                toast.error('Failed to load inventory')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [warehouseId])

    if (loading) return <Loading />

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'
    const filtered = inventory.filter(item => {
        const q = search.toLowerCase()
        return !q || item.productName?.toLowerCase().includes(q) || item.variantName?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)
    })

    const alertColor = (level: string) => {
        if (level === 'OUT_OF_STOCK') return 'bg-red-100 text-red-700'
        if (level === 'CRITICAL') return 'bg-amber-100 text-amber-700'
        if (level === 'LOW') return 'bg-yellow-100 text-yellow-700'
        return 'bg-green-100 text-green-700'
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
                    <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
                    <p className="text-sm text-slate-500">{warehouse?.name}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products, variants, or SKU..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                />
            </div>

            {/* Inventory List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Package size={48} className="mb-3 opacity-30" />
                        <p className="text-sm">{search ? 'No matching products' : 'No inventory data'}</p>
                        <p className="text-xs mt-1">{search ? 'Try a different search term' : 'Inventory will appear here once products are added'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <div className="col-span-5">Product / Variant</div>
                            <div className="col-span-2 text-right">Stock</div>
                            <div className="col-span-2 text-right">Sold</div>
                            <div className="col-span-1 text-right">Price</div>
                            <div className="col-span-2 text-center">Status</div>
                        </div>
                        {filtered.map(item => (
                            <div key={item.variantId} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition">
                                <div className="col-span-5 flex items-center gap-3 min-w-0">
                                    {item.mainImageUrl ? (
                                        <img src={item.mainImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                            <Package size={16} className="text-slate-400" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {item.variantName}{item.sku ? ` · ${item.sku}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="col-span-2 text-right">
                                    <p className={`text-sm font-semibold font-num ${item.currentStock === 0 ? 'text-red-600' : item.currentStock <= 5 ? 'text-amber-600' : 'text-slate-800'}`}>
                                        {item.currentStock.toLocaleString()}
                                    </p>
                                </div>
                                <div className="col-span-2 text-right">
                                    <p className="text-sm text-slate-600 font-num">{(item.soldCount || 0).toLocaleString()}</p>
                                </div>
                                <div className="col-span-1 text-right">
                                    <p className="text-sm text-slate-700 font-num">{currency}{Number(item.price || 0).toLocaleString()}</p>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${alertColor(item.alertLevel)}`}>
                                        {item.alertLevel === 'OUT_OF_STOCK' ? <AlertTriangle size={11} /> : item.currentStock > 20 ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                                        {item.alertLevel.replace('_', ' ')}
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
