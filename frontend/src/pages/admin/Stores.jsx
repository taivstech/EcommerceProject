import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/ui/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { adminService } from "@/services"

export default function AdminStores() {

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('') // '' = all

    const fetchStores = async () => {
        try {
            const data = await adminService.getAllShops(filter || undefined)
            setStores(data)
        } catch (err) {
            console.error('Failed to load stores:', err)
            toast.error('Failed to load stores')
        } finally {
            setLoading(false)
        }
    }

    const handleSuspend = async (storeId) => {
        const reason = prompt('Suspension reason (optional):')
        await adminService.suspendShop(storeId, reason ? { rejection_reason: reason } : undefined)
        toast.success('Shop suspended')
        fetchStores()
    }

    const handleApprove = async (storeId) => {
        await adminService.approveShop(storeId)
        toast.success('Shop approved')
        fetchStores()
    }

    useEffect(() => {
        setLoading(true)
        fetchStores()
    }, [filter])

    const statusFilters = ['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">All <span className="text-slate-800 font-medium">Stores</span></h1>
                <div className="flex items-center gap-2">
                    {statusFilters.map(s => (
                        <button
                            key={s || 'all'}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1 text-xs rounded-full border transition ${
                                filter === s
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {s || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl">
                            <StoreInfo store={store} />
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                {store.status === 'APPROVED' && (
                                    <button
                                        onClick={() => toast.promise(handleSuspend(store.id), { loading: "Suspending..." })}
                                        className="px-3 py-1.5 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                                    >
                                        Suspend
                                    </button>
                                )}
                                {(store.status === 'SUSPENDED' || store.status === 'REJECTED') && (
                                    <button
                                        onClick={() => toast.promise(handleApprove(store.id), { loading: "Approving..." })}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                    >
                                        Re-Approve
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No stores found</h1>
                </div>
            )}
        </div>
    ) : <Loading />
}
