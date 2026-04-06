import { Link } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import { LogOut, Bell, Package, Tag, BarChart3, X, Edit3 } from "lucide-react"
import { useRouter } from "@/utils/compat"
import { useState, useEffect, useRef } from "react"
import { useDispatch } from "react-redux"
import { markAsRead } from "@/redux/features/notification/notificationSlice"

const StoreNavbar = () => {
    const { user, logout } = useAuth()
    const router = useRouter()
    const dispatch = useDispatch()
    
    // Use unified notification system
    const { notifications, unreadCount } = useNotifications()
    
    const [showNotif, setShowNotif] = useState(false)
    const [notifTab, setNotifTab] = useState('orders')
    const panelRef = useRef(null)

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setShowNotif(false)
            }
        }
        if (showNotif) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showNotif])

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout()
            router.push('/login')
        }
    }

    const NOTIF_TABS = [
        { key: 'orders', label: 'Orders' },
        { key: 'promo', label: 'Promotions' },
        { key: 'reports', label: 'Reports' },
    ]

    return (
        <div className="flex items-center justify-between px-6 lg:px-12 py-3 border-b border-slate-200 bg-white transition-all relative z-30">
            <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-11 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-600">
                    Store
                </p>
            </Link>
            <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600">Hi, <span className="font-semibold text-slate-800">{user?.fullName || user?.username || 'Seller'}</span></p>
                <Link href="/" className="text-sm text-slate-500 hover:text-green-600 transition px-3 py-1 border border-slate-200 rounded-lg hover:border-green-200">
                    Back to shop
                </Link>

                {/* Notification Bell */}
                <div className="relative" ref={panelRef}>
                    <button
                        onClick={() => setShowNotif(!showNotif)}
                        className={`relative p-2 rounded-full transition ${showNotif ? 'bg-green-100 text-green-700' : 'hover:bg-green-50 text-slate-600'}`}
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* ── GHTK-style Notification Dropdown Panel ── */}
                    {showNotif && (
                        <div className="absolute top-full right-0 mt-2 w-[420px] bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-[calc(100vh-80px)] z-50">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowNotif(false)} className="p-1 hover:bg-slate-100 rounded transition">
                                        <X size={16} className="text-slate-400" />
                                    </button>
                                    <h3 className="font-bold text-slate-800">Notifications</h3>
                                </div>
                                <button className="p-1 hover:bg-slate-100 rounded transition" title="Mark all as read">
                                    <Edit3 size={14} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-200">
                                {NOTIF_TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setNotifTab(tab.key)}
                                        className={`flex-1 py-2.5 text-xs font-semibold text-center transition border-b-2 ${
                                            notifTab === tab.key
                                                ? 'text-green-700 border-green-600 bg-green-50/50'
                                                : 'text-slate-500 border-transparent hover:text-slate-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto max-h-96">
                                {notifTab === 'orders' && notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map(n => (
                                            <button
                                                key={n.id}
                                                onClick={() => {
                                                    if (!n.read) {
                                                        dispatch(markAsRead(n.id))
                                                    }
                                                    router.push('/store/orders')
                                                    setShowNotif(false)
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-green-50/50 transition flex items-start gap-3 ${
                                                    !n.read ? 'bg-green-50/20' : ''
                                                }`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Package size={14} className="text-green-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 font-num">
                                                        {n.time ? new Date(n.time).toLocaleString('en-US', {
                                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                                        }) : ''}
                                                    </p>
                                                </div>
                                                {!n.read && <span className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Package size={36} className="mb-2 opacity-30" />
                                        <p className="text-sm">No data</p>
                                    </div>
                                )}
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

export default StoreNavbar
