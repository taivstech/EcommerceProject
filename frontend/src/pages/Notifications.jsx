import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from "@/utils/compat"
import { useAuth } from '@/hooks/useAuth'
import { notificationService } from '@/services'
import RequireAuth from '@/components/RequireAuth'

export default function NotificationsPage() {
    return (
        <RequireAuth>
            <NotificationsContent />
        </RequireAuth>
    )
}

function NotificationsContent() {
    const router = useRouter()
    const { isAuthenticated } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all | unread | read

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const data = await notificationService.getMyNotifications()
            // Filter out message-related notifications — only order & system notifications
            const orderOnly = (data || []).filter(n => {
                const t = (n.type || '').toUpperCase()
                // Exclude message-related types
                if (t.includes('MESSAGE') || t.includes('CHAT')) return false
                return true
            })
            setNotifications(orderOnly)
        } catch (e) {
            console.error('Failed to load notifications', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isAuthenticated) loadNotifications()
    }, [isAuthenticated, loadNotifications])

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'READ' } : n)
            )
        } catch (e) {
            console.error('Failed to mark as read', e)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead()
            setNotifications(prev =>
                prev.map(n => ({ ...n, status: 'READ' }))
            )
        } catch (e) {
            console.error('Failed to mark all as read', e)
        }
    }

    const handleClick = (n) => {
        if (n.status === 'UNREAD') handleMarkAsRead(n.id)

        // Navigate based on referenceType
        if (n.referenceType === 'ORDER' && n.referenceId) {
            router.push(`/orders`)
        } else if (n.referenceType === 'WAREHOUSE' && n.referenceId) {
            router.push(`/warehouse`)
        }
    }

    const filtered = notifications.filter(n => {
        if (filter === 'unread') return n.status === 'UNREAD'
        if (filter === 'read') return n.status === 'READ'
        return true
    })

    const unreadCount = notifications.filter(n => n.status === 'UNREAD').length

    const formatTime = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        const now = new Date()
        const diff = now - d
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
        if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago'
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getTypeColor = (type) => {
        switch (type) {
            case 'NEW_ORDER': return 'bg-blue-50 border-blue-200'
            case 'ORDER_STATUS': return 'bg-green-50 border-green-200'
            case 'ORDER_CANCELLED': return 'bg-red-50 border-red-200'
            case 'ORDER_COMPLETED': return 'bg-emerald-50 border-emerald-200'
            case 'WAREHOUSE_ASSIGNED': return 'bg-purple-50 border-purple-200'
            case 'WAREHOUSE_ACCOUNT_CREATED': return 'bg-purple-50 border-purple-200'
            default: return 'bg-slate-50 border-slate-200'
        }
    }

    return (
        <div className="mx-6 my-10 min-h-[70vh]">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl text-slate-800 font-semibold">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-slate-500 mt-1">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-4">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'unread', label: 'Unread' },
                        { key: 'read', label: 'Read' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-1.5 text-sm rounded-full transition ${filter === f.key
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Notifications list */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p className="text-lg">No notifications</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(n => (
                            <button
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`w-full text-left p-4 rounded-xl border transition hover:shadow-sm ${n.status === 'UNREAD'
                                    ? getTypeColor(n.type) + ' font-medium'
                                    : 'bg-white border-slate-100 opacity-75'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {n.status === 'UNREAD' && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                                            )}
                                            <p className="text-sm text-slate-800 truncate">{n.title}</p>
                                        </div>
                                        {n.message && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                                        {formatTime(n.created_at || n.createdAt)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
