import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/store'
import { useAuth } from './useAuth'
import {
  setNotifications,
  addNotification,
  updateSellerUnreadCount,
  updateAdminUnreadCount,
  updateWarehouseUnreadCount,
  Notification,
} from '@/redux/features/notification/notificationSlice'
import { notificationService, orderService } from '@/services'

export const useNotifications = () => {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const notifications = useAppSelector(state => state.notification.list)
  const unreadCount = useAppSelector(state => state.notification.unreadCount)
  const webSocketRef = useRef(null)

  // Load notifications from API on mount
  useEffect(() => {
    if (!user?.id) return

    const loadNotifications = async () => {
      try {
        const data = await notificationService.getMyNotifications()
        const mapped: Notification[] = (data || []).map(n => {
          const item: Notification = {
            id: n.id,
            type: (n.type as Notification['type']) || 'order',
            title: n.title,
            message: n.message || '',
            time: n.created_at,
            read: n.status === 'READ' || n.read_at != null,
          }
          if (n.referenceId && n.referenceType) {
            item.link = '/' + n.referenceType.toLowerCase() + '/' + n.referenceId
          }
          return item
        })
        dispatch(setNotifications(mapped))
      } catch (err) {
        console.error('[Notifications] Failed to load:', err)
      }
    }

    loadNotifications()
    // Refresh every 60 seconds as backup (WebSocket handles real-time updates)
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [user?.id, dispatch])

  // Setup WebSocket listeners for real-time notifications
  useEffect(() => {
    if (!user?.id) return

    try {
      const socketUrl = new URL(window.location.href)
      socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
      socketUrl.pathname = '/api/ws'

      webSocketRef.current = new WebSocket(socketUrl.toString())

      webSocketRef.current.onopen = () => {
        console.log('[WebSocket] Connected')
        // Subscribe to user's notification channel
        if (webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({
            action: 'subscribe',
            userId: user.id,
          }))
        }
      }

      webSocketRef.current.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          console.log('[WebSocket] Received notification:', notification)

          // Add to Redux store
          dispatch(addNotification({
            id: notification.id || `notif_${Date.now()}`,
            type: notification.type || 'order',
            title: notification.title || 'New Notification',
            message: notification.message || '',
            time: notification.time || new Date().toISOString(),
            read: false,
            data: notification.data,
          }))

          // Play sound (optional)
          playNotificationSound()
        } catch (err) {
          console.error('[WebSocket] Parse error:', err)
        }
      }

      webSocketRef.current.onerror = (err) => {
        console.error('[WebSocket] Error:', err)
      }

      webSocketRef.current.onclose = () => {
        console.log('[WebSocket] Disconnected')
      }

      return () => {
        if (webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.close()
        }
      }
    } catch (err) {
      console.error('[WebSocket] Setup error:', err)
    }
  }, [user?.id, dispatch])

  // Load role-specific unread counts
  useEffect(() => {
    if (!user?.id) return

    const loadUnreadCounts = async () => {
      try {
        // Get seller/admin/warehouse unread counts based on user roles
        const hasRole = (name: string) => user.roles?.some(r => r.name === name)
        if (hasRole('SELLER') || hasRole('ADMIN')) {
          const sellerOrderCount = await notificationService.getUnreadOrderCount?.()
          if (sellerOrderCount) {
            dispatch(updateSellerUnreadCount(sellerOrderCount))
          }
        }

        if (hasRole('ADMIN')) {
          const adminCount = await notificationService.getUnreadCount?.()
          if (adminCount) {
            dispatch(updateAdminUnreadCount(adminCount))
          }
        }

        if (hasRole('WAREHOUSE_MANAGER')) {
          const warehouseCount = await notificationService.getUnreadCount?.()
          if (warehouseCount) {
            dispatch(updateWarehouseUnreadCount(warehouseCount))
          }
        }
      } catch (err) {
        console.error('[Notifications] Failed to load unread counts:', err)
      }
    }

    loadUnreadCounts()
    const interval = setInterval(loadUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [user?.id, dispatch])

  return {
    notifications,
    unreadCount,
    webSocket: webSocketRef.current,
  }
}

// Helper to play notification sound
const playNotificationSound = () => {
  try {
    const audio = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj=='
    )
    audio.volume = 0.3
    audio.play().catch(() => {})
  } catch (err) {
    // Silent fail
  }
}
