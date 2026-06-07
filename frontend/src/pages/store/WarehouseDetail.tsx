import { useState, useEffect } from 'react'
import { useParams, useRouter } from "@/utils/compat"
import { warehouseService } from '@/services/warehouseService'
import type { WarehouseResponse } from '@/services/warehouseService'
import type { InventorySummary } from '@/services/inventoryService'
import {
    Package, Users, TrendingUp, ArrowLeft, MapPin, Phone,
    Star, Activity, BarChart3, AlertTriangle, ShoppingCart,
    Settings, Pencil, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '@/components/ui/Loading'

function StatCard({ title, value, subtitle, icon: Icon, iconColor, accent }: {
    title: string; value: string | number; subtitle: string
    icon: React.ElementType; iconColor: string; accent?: string
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500">{title}</p>
                <Icon size={20} className={iconColor} />
            </div>
            <p className={`text-2xl font-bold font-num ${accent || 'text-slate-800'}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
    )
}

function QuickAction({ icon: Icon, title, description, onClick, color }: {
    icon: React.ElementType; title: string; description: string
    onClick: () => void; color: string
}) {
    return (
        <button
            onClick={onClick}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition text-left group"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={20} />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-green-700 transition">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </button>
    )
}

export default function WarehouseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const warehouseId = params.id as string

    const [warehouse, setWarehouse] = useState<WarehouseResponse | null>(null)
    const [stats, setStats] = useState<InventorySummary>({
        totalProducts: 0, totalVariants: 0, totalStockUnits: 0, totalSoldUnits: 0,
        criticalStockItems: 0, lowStockItems: 0, outOfStockItems: 0,
        deadStockItems: 0, averageTurnoverRate: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const wh = await warehouseService.getById(warehouseId)
                setWarehouse(wh)
            } catch {
                toast.error('Failed to load warehouse data')
            }
            try {
                const summary = await warehouseService.getInventorySummary()
                if (summary) setStats(summary)
            } catch {
                // Inventory summary is optional — don't block the page
            }
            setLoading(false)
        }
        load()
    }, [warehouseId])

    if (loading) return <Loading />

    if (!warehouse) {
        return (
            <div className="p-6 text-center">
                <p className="text-slate-400">Warehouse not found.</p>
                <button onClick={() => router.push('/store/warehouses')} className="mt-4 text-sm text-green-600 hover:underline">
                    ← Back to warehouses
                </button>
            </div>
        )
    }

    const address = [warehouse.detailAddress, warehouse.ward, warehouse.district, warehouse.province]
        .filter(Boolean).join(', ')

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/store/warehouses')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition shrink-0"
                    >
                        <ArrowLeft size={18} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{warehouse.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {warehouse.isDefault && (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    <Star size={11} /> Default
                                </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${warehouse.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                {warehouse.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">

                    <button
                        onClick={() => toast('Edit warehouse coming soon')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                    >
                        <Pencil size={14} /> Edit
                    </button>
                </div>
            </div>

            {/* Warehouse Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-green-600" /> Warehouse Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Address</p>
                        <p className="text-slate-700">{address || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Contact</p>
                        <p className="text-slate-700">{warehouse.contactName || '—'}</p>
                        {warehouse.contactPhone && (
                            <p className="text-slate-500 text-xs font-num">{warehouse.contactPhone}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Products"    value={stats.totalProducts} subtitle="Products managed"  icon={Package}       iconColor="text-blue-500" />
                <StatCard title="Total Stock Units" value={stats.totalStockUnits.toLocaleString()} subtitle="Units on hand" icon={Activity} iconColor="text-green-500" />
                <StatCard title="Low Stock"         value={stats.lowStockItems + stats.criticalStockItems} subtitle="Need restocking"   icon={AlertTriangle} iconColor="text-amber-500" accent="text-amber-600" />
                <StatCard title="Out of Stock"      value={stats.outOfStockItems} subtitle="No units available" icon={BarChart3} iconColor="text-red-500" accent="text-red-600" />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="font-semibold text-slate-700 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <QuickAction
                        icon={Package} color="bg-blue-50 text-blue-500"
                        title="Inventory"
                        description="View & update stock levels"
                        onClick={() => router.push(`/store/warehouses/${warehouseId}/inventory`)}
                    />

                    <QuickAction
                        icon={ShoppingCart} color="bg-purple-50 text-purple-500"
                        title="Orders"
                        description="View orders for this warehouse"
                        onClick={() => router.push(`/store/warehouses/${warehouseId}/orders`)}
                    />
                    <QuickAction
                        icon={BarChart3} color="bg-orange-50 text-orange-500"
                        title="Reports"
                        description="Warehouse performance reports"
                        onClick={() => router.push(`/store/warehouses/${warehouseId}/reports`)}
                    />
                </div>
            </div>

            {/* Recent Activity placeholder */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-green-600" /> Recent Activity
                </h2>
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Activity size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Activity will appear here once orders are processed</p>
                </div>
            </div>
        </div>
    )
}
