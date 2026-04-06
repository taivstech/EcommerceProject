import { Bell, LogOut, MapPin, Search, ShoppingCart, Store, User, Clock, X, Package, Tag, Edit3 } from "lucide-react";
import { Link } from "@/utils/compat";
import { useRouter } from "@/utils/compat";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { searchService, notificationService, orderService } from "@/services";
import NumberBadge from "@/components/ui/NumberBadge";

// Notification Panel Component (similar to StoreNavbar)
function NotificationPanel({ unreadCount, router }) {
    const [showNotif, setShowNotif] = useState(false)
    const [notifTab, setNotifTab] = useState('orders')
    const [notifications, setNotifications] = useState([])
    const panelRef = useRef(null)

    useEffect(() => {
        if (!showNotif) return
        // Load notifications from service
        notificationService.getMyNotifications().then(notifs => {
            if (!notifs || !Array.isArray(notifs)) {
                // Fallback: load from orders if notifications service returns empty
                return orderService.getMyOrders().then(orders => {
                    if (!orders || !Array.isArray(orders)) return
                    const orderNotifs = orders.slice(0, 10).map(o => ({
                        id: o.id,
                        type: 'order',
                        title: `Order #${o.id?.slice(0, 8).toUpperCase()}`,
                        message: `${o.status} - ${o.total ? `$${Number(o.total).toFixed(2)}` : ''}`,
                        time: o.created_at || o.createdAt,
                        read: false,
                    }))
                    setNotifications(orderNotifs)
                }).catch(() => {})
            }
            // Map notification response to display format
            const mapped = notifs.slice(0, 15).map(n => ({
                id: n.id,
                type: n.type || 'order',
                title: n.title || `Notification #${n.id?.slice(0, 8)}`,
                message: n.message || n.content || '',
                time: n.created_at || n.createdAt,
                read: n.read || false,
            }))
            setNotifications(mapped)
        }).catch(() => {
            // Fallback to orders on error
            orderService.getMyOrders().then(orders => {
                if (!orders || !Array.isArray(orders)) return
                const orderNotifs = orders.slice(0, 10).map(o => ({
                    id: o.id,
                    type: 'order',
                    title: `Order #${o.id?.slice(0, 8).toUpperCase()}`,
                    message: `${o.status} - ${o.total ? `$${Number(o.total).toFixed(2)}` : ''}`,
                    time: o.created_at || o.createdAt,
                    read: false,
                }))
                setNotifications(orderNotifs)
            }).catch(() => {})
        })
    }, [showNotif])

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

    const NOTIF_TABS = [
        { key: 'orders', label: 'Orders' },
        { key: 'promo', label: 'Promotions' },
        { key: 'updates', label: 'Updates' },
    ]

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setShowNotif(!showNotif)}
                className={`relative p-2 rounded-full transition ${showNotif ? 'bg-green-100 text-green-700' : 'hover:bg-slate-100 text-slate-600'}`}
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* GHTK-style Notification Dropdown Panel */}
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
                                            router.push('/orders')
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
                                <p className="text-sm">No notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const Navbar = () => {

    const router = useRouter();

    const [search, setSearch] = useState('')
    const [suggestData, setSuggestData] = useState({ keywords: [], shops: [], products: [] })
    const [recentSearches, setRecentSearches] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const suggestRef = useRef(null)
    const suggestTimerRef = useRef(null)

    const cartItems = useSelector(state => state.cart.items || [])
    const { user, isAuthenticated, logout } = useAuth()

    // Notification badge
    const [unreadCount, setUnreadCount] = useState(0)

    const cartCount = useMemo(() => {
        return (cartItems || []).reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
    }, [cartItems])

    const [profileOpen, setProfileOpen] = useState(false)
    const profileRef = useRef(null)

    // Load unread notification count (order-related only; chat unreads shown on chat widget)
    useEffect(() => {
        if (!isAuthenticated) return
        const loadUnread = async () => {
            try {
                const count = await notificationService.getUnreadOrderCount()
                setUnreadCount(count)
            } catch { /* ignore */ }
        }
        loadUnread()
        // Poll every 30 seconds
        const interval = setInterval(loadUnread, 30000)
        return () => clearInterval(interval)
    }, [isAuthenticated])

    // Load recent searches when input focused and empty
    const loadRecentSearches = useCallback(async () => {
        if (!isAuthenticated) return
        try {
            const recent = await searchService.getRecentSearches()
            setRecentSearches([...new Set(recent)])
        } catch { /* ignore */ }
    }, [isAuthenticated])

    // Debounced suggestion fetch
    const fetchSuggestions = useCallback((query) => {
        if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
        if (!query || query.trim().length < 2) {
            setSuggestData({ keywords: [], shops: [], products: [] })
            return
        }
        suggestTimerRef.current = setTimeout(async () => {
            try {
                const result = await searchService.suggest(query, 8)
                setSuggestData(result)
                setShowSuggestions(
                    result.keywords.length > 0 ||
                    result.shops.length > 0 ||
                    (result.products && result.products.length > 0)
                )
            } catch {
                setSuggestData({ keywords: [], shops: [], products: [] })
            }
        }, 300)
    }, [])

    const handleSearchChange = (e) => {
        const val = e.target.value
        setSearch(val)
        setHighlightIndex(-1)
        if (val.trim().length >= 2) {
            fetchSuggestions(val)
        } else {
            setSuggestData({ keywords: [], shops: [], products: [] })
            // Show recent searches when input is short
            if (isAuthenticated && val.trim().length === 0) {
                setShowSuggestions(recentSearches.length > 0)
            }
        }
    }

    // Keyboard navigation for search dropdown (Shopee-style)
    const handleSearchKeyDown = (e) => {
        // Build flat list of selectable items
        const allItems = []
        const hasShopAction = showSuggestList && suggestData.shops.length > 0
        if (showSuggestList) {
            if (hasShopAction) allItems.push({ type: 'shop-search', data: search.trim() })
            suggestData.keywords.forEach(kw => allItems.push({ type: 'keyword', data: kw }))
            ;(suggestData.products || []).forEach(p => allItems.push({ type: 'product', data: p }))
        } else if (showRecent) {
            recentSearches.forEach(s => allItems.push({ type: 'keyword', data: s }))
        }
        if (!allItems.length) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex(i => (i + 1) % allItems.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex(i => (i <= 0 ? allItems.length - 1 : i - 1))
        } else if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < allItems.length) {
            e.preventDefault()
            const item = allItems[highlightIndex]
            if (item.type === 'shop-search') handleShopSearchClick(item.data)
            else if (item.type === 'product') handleProductClick(item.data.id)
            else handleSuggestionClick(item.data)
            setHighlightIndex(-1)
        } else if (e.key === 'Escape') {
            setShowSuggestions(false)
            setHighlightIndex(-1)
        }
    }

    const handleProductClick = (productId) => {
        setShowSuggestions(false)
        router.push(`/product/${productId}`)
    }

    const handleSearchFocus = () => {
        if (search.trim().length >= 2 && (suggestData.keywords.length > 0 || suggestData.shops.length > 0 || (suggestData.products && suggestData.products.length > 0))) {
            setShowSuggestions(true)
        } else if (search.trim().length === 0) {
            loadRecentSearches().then(() => {
                setShowSuggestions(true)
            })
        }
    }

    const handleSuggestionClick = (suggestion) => {
        setSearch(suggestion)
        setShowSuggestions(false)
        if (isAuthenticated) searchService.saveSearchHistory(suggestion)
        router.push(`/shop?search=${encodeURIComponent(suggestion)}`)
    }

    const handleShopClick = (shopId) => {
        setShowSuggestions(false)
        router.push(`/shop/${shopId}`)
    }

    const handleShopSearchClick = (query) => {
        const keyword = (query || '').trim()
        if (!keyword) return
        setShowSuggestions(false)
        setSearch(keyword)
        // Use window.location to force full navigation (avoids React Router same-page optimization)
        window.location.href = `/shop?search=${encodeURIComponent(keyword)}&tab=stores`
    }

    const handleClearHistory = async () => {
        await searchService.clearSearchHistory()
        setRecentSearches([])
    }

    useEffect(() => {
        const onDocClick = (e) => {
            if (!profileRef.current) return
            if (!profileRef.current.contains(e.target)) setProfileOpen(false)
            if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false)
        }
        document.addEventListener('mousedown', onDocClick)
        return () => document.removeEventListener('mousedown', onDocClick)
    }, [])

    const isSeller = useMemo(() => {
        const roles = user?.roles || []
        return roles.some(r => (r?.name || '').toUpperCase() === 'SELLER')
    }, [user])

    const isAdmin = useMemo(() => {
        const roles = user?.roles || []
        return roles.some(r => (r?.name || '').toUpperCase() === 'ADMIN')
    }, [user])

    const isWarehouseEmployee = useMemo(() => {
        const roles = user?.roles || []
        return roles.some(r => (r?.name || '').toUpperCase() === 'WAREHOUSE_EMPLOYEE')
    }, [user])

    const handleMyStore = async () => {
        if (!isAuthenticated) return router.push('/login')

        // Warehouse Employee → warehouse dashboard
        if (isWarehouseEmployee) return router.push('/warehouse')

        // Admin → admin panel
        if (isAdmin) return router.push('/admin')

        // Seller → store dashboard directly
        if (isSeller) return router.push('/store')

        // Normal user → check if they have a shop registration
        try {
            const api = (await import('@/api/api')).default
            const res = await api.get('/shops')
            const shop = res.result
            if (shop) {
                const status = String(shop.status || '').toUpperCase()
                if (status === 'APPROVED') return router.push('/store')
                // Pending/Rejected → show create-store with existing info
                return router.push('/create-store')
            }
            return router.push('/create-store')
        } catch (err) {
            // No shop yet
            return router.push('/create-store')
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (search.trim()) {
            setShowSuggestions(false)
            if (isAuthenticated) searchService.saveSearchHistory(search.trim())
            router.push(`/shop?search=${search}`)
        }
    }

    // Show recent or suggestions
    const showRecent = search.trim().length === 0 && recentSearches.length > 0
    const showSuggestList = search.trim().length >= 2 && (suggestData.keywords.length > 0 || suggestData.shops.length > 0 || (suggestData.products && suggestData.products.length > 0))

    return (
        <nav className="relative bg-white">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4 gap-4 transition-all">

                    {/* Logo */}
                    <Link href="/" className="relative text-4xl font-semibold text-slate-700 shrink-0">
                        <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                            plus
                        </p>
                    </Link>

                    {/* Search Bar - Center, prominent position */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-4 relative" ref={suggestRef}>
                        <form onSubmit={handleSearch} className="flex items-center w-full gap-2 bg-slate-100 px-4 py-2.5 rounded-full border border-slate-200 focus-within:border-green-400 focus-within:bg-white transition-all">
                            <Search size={20} className="text-slate-500 shrink-0" />
                            <input
                                className="flex-1 bg-transparent outline-none placeholder-slate-500 text-sm"
                                type="text"
                                placeholder="Search products, brands..."
                                value={search}
                                onChange={handleSearchChange}
                                onFocus={handleSearchFocus}
                                onKeyDown={handleSearchKeyDown}
                                aria-label="Search products"
                                aria-autocomplete="list"
                                aria-expanded={showSuggestions && (showRecent || showSuggestList)}
                                required
                            />
                        </form>

                        {/* Dropdown: recent searches or suggestions */}
                        {showSuggestions && (showRecent || showSuggestList) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto" role="listbox">
                                {/* Recent searches header */}
                                {showRecent && (
                                    <>
                                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                                            <span className="text-xs text-slate-600 font-medium">Recent searches</span>
                                            <button
                                                onClick={handleClearHistory}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                        {recentSearches.map((s, i) => (
                                            <button
                                                key={`recent-${i}`}
                                                type="button"
                                                onClick={() => handleSuggestionClick(s)}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-green-50 text-left transition"
                                            >
                                                <Clock size={16} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{s}</span>
                                            </button>
                                        ))}
                                    </>
                                )}

                                {/* Suggestions from Elasticsearch — Shopee style */}
                                {showSuggestList && (
                                    <>
                                        {/* Shop search action at top */}
                                        {suggestData.shops.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleShopSearchClick(search)}
                                                role="option"
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 text-left transition border-b border-slate-100 ${highlightIndex === 0 ? 'bg-green-50' : ''}`}
                                            >
                                                <Store size={16} className="text-green-600 shrink-0" />
                                                <span className="flex-1 truncate">Tìm Shop "{search.trim()}"</span>
                                                <Store size={14} className="text-green-500 shrink-0" />
                                            </button>
                                        )}

                                        {/* Keyword suggestions */}
                                        {suggestData.keywords.map((s, i) => {
                                            const idx = (suggestData.shops.length > 0 ? 1 : 0) + i
                                            return (
                                                <button
                                                    key={`kw-${i}`}
                                                    type="button"
                                                    onClick={() => handleSuggestionClick(s)}
                                                    role="option"
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 text-left transition ${highlightIndex === idx ? 'bg-green-50' : ''}`}
                                                >
                                                    <Search size={16} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{s}</span>
                                                </button>
                                            )
                                        })}

                                        {/* Product results from Elasticsearch */}
                                        {(suggestData.products || []).length > 0 && (
                                            <>
                                                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                                                    <span className="text-xs text-slate-500 font-medium">Sản phẩm gợi ý</span>
                                                </div>
                                                {suggestData.products.map((p, i) => {
                                                    const idx = (suggestData.shops.length > 0 ? 1 : 0) + suggestData.keywords.length + i
                                                    const price = p.min_price != null ? Number(p.min_price).toLocaleString('vi-VN') + 'đ' : ''
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => handleProductClick(p.id)}
                                                            role="option"
                                                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-green-50 text-left transition ${highlightIndex === idx ? 'bg-green-50' : ''}`}
                                                        >
                                                            {p.main_image_url ? (
                                                                <img src={p.main_image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0 border border-slate-200" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                                                    <Package size={16} className="text-slate-400" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <span className="truncate block text-sm">{p.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {price && <span className="text-xs font-semibold text-red-500">{price}</span>}
                                                                    {p.total_sold > 0 && <span className="text-xs text-slate-400">Đã bán {p.total_sold}</span>}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-6 text-slate-600 shrink-0 font-medium">
                        <Link href="/" className="hover:text-slate-800 transition">Home</Link>
                        <Link href="/shop" className="hover:text-slate-800 transition">Products</Link>
                        <button onClick={handleMyStore} className="flex items-center gap-2 hover:text-slate-800 transition">
                            <Store size={18} />
                            <span className="hidden lg:inline">My Store</span>
                        </button>

                        {/* Warehouse Employee link */}
                        {isWarehouseEmployee && (
                            <Link href="/warehouse" className="flex items-center gap-2 hover:text-slate-800 transition">
                                <span className="hidden lg:inline">Warehouse</span>
                            </Link>
                        )}

                        {/* Notification Bell with Dropdown */}
                        <NotificationPanel unreadCount={unreadCount} router={router} />

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600 font-medium hover:text-slate-800 transition">
                            <ShoppingCart size={18} />
                            Cart
                            {cartCount > 0 && (
                                <span className="absolute -top-1 left-3">
                                    <NumberBadge value={cartCount} variant="badge" size="sm" color="default" max={99} />
                                </span>
                            )}
                        </Link>

                        {!isAuthenticated ? (
                            <button
                                onClick={() => router.push('/login')}
                                className="px-8 py-2 bg-slate-800 hover:bg-slate-900 transition text-white rounded-full"
                            >
                            Login
                        </button>
                        ) : (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(v => !v)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 transition rounded-full"
                                >
                                    <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold">
                                        {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-slate-700 font-medium max-w-32 truncate">
                                        {user?.fullName || user?.username}
                                    </span>
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50">
                                        <div className="p-4 border-b border-slate-100">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName || user?.username}</p>
                                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                onClick={() => { setProfileOpen(false); router.push('/profile') }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700"
                                            >
                                                <User size={18} className="text-slate-500" />
                                                <span className="text-sm">My Profile</span>
                                            </button>

                                            <button
                                                onClick={() => { setProfileOpen(false); router.push('/orders') }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700"
                                            >
                                                <ShoppingCart size={18} className="text-slate-500" />
                                                <span className="text-sm">My Orders</span>
                                            </button>

                                            <button
                                                onClick={() => { setProfileOpen(false); router.push('/profile/addresses') }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700"
                                            >
                                                <MapPin size={18} className="text-slate-500" />
                                                <span className="text-sm">My Addresses</span>
                                            </button>

                                            <button
                                                onClick={() => { setProfileOpen(false); router.push('/notifications') }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700"
                                            >
                                                <Bell size={18} className="text-slate-500" />
                                                <span className="text-sm">Notifications</span>
                                                {unreadCount > 0 && (
                                                    <span className="ml-auto">
                                                        <NumberBadge value={unreadCount} variant="badge" size="sm" color="red" max={99} />
                                                    </span>
                                                )}
                                            </button>

                                            {/* Warehouse Employee */}
                                            {isWarehouseEmployee && (
                                                <button
                                                    onClick={() => { setProfileOpen(false); router.push('/warehouse') }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700"
                                                >
                                                    <Store size={18} className="text-slate-500" />
                                                    <span className="text-sm">Warehouse Management</span>
                                                </button>
                                            )}

                                            {/* Only show My Store for non-admin users */}
                                            {!isAdmin && (
                                                <button
                                                    onClick={() => { setProfileOpen(false); handleMyStore() }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700"
                                                >
                                                    <Store size={18} className="text-slate-500" />
                                                    <span className="text-sm">{isSeller ? 'Seller Dashboard' : 'Register My Store'}</span>
                                                </button>
                                            )}

                                            {isAdmin && (
                                                <button
                                                    onClick={() => { setProfileOpen(false); router.push('/admin') }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 border-t border-slate-100 mt-1 pt-3"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    <span className="text-sm font-medium">Admin Panel</span>
                                                </button>
                                            )}

                                            <button
                                                onClick={async () => {
                                                    setProfileOpen(false);
                                                    if (window.confirm('Are you sure you want to logout?')) {
                                                        await logout();
                                                        router.push('/login');
                                                    }
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-red-600"
                                            >
                                                <LogOut size={18} className="text-red-500" />
                                                <span className="text-sm">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Mobile Search & User */}
                    <div className="sm:hidden flex items-center gap-2">
                        {/* Mobile Search Button */}
                        <button
                            onClick={() => router.push('/shop')}
                            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition"
                            aria-label="Search"
                        >
                            <Search size={18} className="text-slate-600" />
                        </button>
                        
                        {!isAuthenticated ? (
                            <button
                                onClick={() => router.push('/login')}
                                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-sm transition text-white rounded-full"
                            >
                                Login
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/profile')}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-sm transition text-slate-700 rounded-full flex items-center gap-2"
                            >
                                <User size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar
