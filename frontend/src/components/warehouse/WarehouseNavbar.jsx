import { Link } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import { LogOut, Bell, Package, X, Edit3 } from "lucide-react"
import { useRouter } from "@/utils/compat"
import { useState, useRef, useEffect } from "react"

const WarehouseNavbar = ({ warehouses = [] }) => {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [showNotif, setShowNotif] = useState(false)
    const panelRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setShowNotif(false)
            }
        }
        if (showNotif) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showNotif])

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout()
            router.push('/login')
        }
    }

    return (
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white z-30 relative">
            <div className="flex items-center gap-3">
                <Link href="/" className="relative text-3xl font-semibold text-slate-700">
                    <span className="text-green-600">go</span>cart<span className="text-green-600 text-4xl leading-0">.</span>
                </Link>
                <span className="text-xs font-semibold bg-green-600 text-white px-2.5 py-0.5 rounded-full">Warehouse</span>
            </div>
            <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500">
                    Hi, <span className="font-semibold text-slate-800">{user?.fullName || user?.username || 'Staff'}</span>
                </p>
                {warehouses.length > 0 && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {warehouses.length} warehouse{warehouses.length > 1 ? 's' : ''}
                    </span>
                )}

                {/* Notification */}
                <div className="relative" ref={panelRef}>
                    <button
                        onClick={() => setShowNotif(!showNotif)}
                        className={`relative p-2 rounded-full transition ${showNotif ? 'bg-green-100 text-green-700' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                        <Bell size={18} />
                    </button>
                    {showNotif && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                                <button onClick={() => setShowNotif(false)} className="p-1 hover:bg-slate-100 rounded">
                                    <X size={14} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="py-8 text-center text-slate-400">
                                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-full transition" title="Logout">
                    <LogOut size={18} className="text-slate-600" />
                </button>
            </div>
        </div>
    )
}

export default WarehouseNavbar
