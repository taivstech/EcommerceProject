import { Link } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import { LogOut, Bell, X, Package } from "lucide-react"
import { useRouter } from "@/utils/compat"
import { useState, useRef, useEffect } from "react"

const AdminNavbar = () => {
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
        <div className="flex items-center justify-between px-6 lg:px-12 py-3 border-b border-slate-200 bg-white z-30 relative">
            <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-12 px-3 py-0.5 rounded-full text-white bg-slate-800">
                    Admin
                </p>
            </Link>

            <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500">
                    Hi, <span className="font-semibold text-slate-800">{user?.fullName || user?.username || 'Admin'}</span>
                </p>

                {/* Notification dropdown */}
                <div className="relative" ref={panelRef}>
                    <button
                        onClick={() => setShowNotif(!showNotif)}
                        className={`relative p-2 rounded-full transition ${showNotif ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                        <Bell size={18} />
                    </button>
                    {showNotif && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-sm">System Notifications</h3>
                                <button onClick={() => setShowNotif(false)} className="p-1 hover:bg-slate-100 rounded">
                                    <X size={14} className="text-slate-400" />
                                </button>
                            </div>
                            {/* Quick links */}
                            <div className="p-3 space-y-1">
                                <button
                                    onClick={() => { router.push('/admin/approve'); setShowNotif(false) }}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg transition"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <Package size={14} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Pending approvals</p>
                                        <p className="text-xs text-slate-400">Review stores awaiting approval</p>
                                    </div>
                                </button>
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

export default AdminNavbar
