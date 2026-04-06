import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/ui/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { adminService } from "@/services"

export default function AdminApprove() {

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchStores = async () => {
        try {
            const data = await adminService.getAllShops('PENDING')
            setStores(data)
        } catch (err) {
            console.error('Failed to load pending shops:', err)
            toast.error('Failed to load pending shops')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (storeId) => {
        await adminService.approveShop(storeId)
        setStores(prev => prev.filter(s => s.id !== storeId))
        toast.success('Shop approved!')
    }

    const handleReject = async (storeId) => {
        const reason = prompt('Rejection reason (optional):')
        await adminService.rejectShop(storeId, reason ? { rejection_reason: reason } : undefined)
        setStores(prev => prev.filter(s => s.id !== storeId))
        toast.success('Shop rejected')
    }

    useEffect(() => {
        fetchStores()
    }, [])

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Approve <span className="text-slate-800 font-medium">Stores</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl">
                            <StoreInfo store={store} />
                            <div className="flex gap-3 pt-2 flex-wrap">
                                <button
                                    onClick={() => toast.promise(handleApprove(store.id), { loading: "Approving..." })}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => toast.promise(handleReject(store.id), { loading: 'Rejecting...' })}
                                    className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 text-sm"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No Application Pending</h1>
                </div>
            )}
        </div>
    ) : <Loading />
}
