import { MapPin, Calendar } from "lucide-react"

const StoreInfo = ({ store }) => {
    return (
        <div className="flex-1 space-y-2 text-sm">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {store.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-slate-800">{store.name}</h3>
                        <span
                            className={`text-xs font-semibold px-3 py-0.5 rounded-full ${
                                store.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : store.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-800'
                                    : store.status === 'SUSPENDED'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-green-100 text-green-800'
                            }`}
                        >
                            {store.status}
                        </span>
                    </div>
                    {store.user_name && (
                        <p className="text-slate-500 text-xs mt-0.5">Owner: {store.user_name}</p>
                    )}
                </div>
            </div>

            {store.description && (
                <p className="text-slate-600 max-w-2xl">{store.description}</p>
            )}
            {store.address && (
                <p className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} /> {store.address}
                </p>
            )}
            {store.created_at && (
                <p className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} /> Applied on {new Date(store.created_at).toLocaleDateString('vi-VN')}
                </p>
            )}
            {store.rejection_reason && (
                <p className="text-red-500 text-xs mt-1">Rejection reason: {store.rejection_reason}</p>
            )}
        </div>
    )
}

export default StoreInfo
