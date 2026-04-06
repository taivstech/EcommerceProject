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
import { notificationService } from '@/services'

interface StompFrame {
  command: string
  headers: Record<string, string>
  body?: string
}

export const useNotifications = () => {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const notifications = useAppSelector(state => state.notification.list)
  const unreadCount = useAppSelector(state => state.notification.unreadCount)
  const stompClientRef = useRef<any>(null)
  const connectionRef = useRef<WebSocket | null>(null)

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

  // Setup STOMP WebSocket listeners for real-time notifications
  useEffect(() => {
    if (!user?.id) return

    try {
      const wsUrl = new URL(window.location.href)
      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl.pathname = '/api/ws'

      connectionRef.current = new WebSocket(wsUrl.toString())

      connectionRef.current.onopen = () => {
        console.log('[STOMP WebSocket] Connected')
        if (connectionRef.current) {
          // Send STOMP CONNECT frame
          sendStompCommand('CONNECT', {
            'accept-version': '1.0,1.1,1.2',
            'heart-beat': '10000,10000',
            'login': user.id,
          })
        }
      }

      connectionRef.current.onmessage = (event) => {
        try {
          const frame = parseStompFrame(event.data)
          console.log('[STOMP] Frame received:', frame.command)

          // Handle CONNECTED
          if (frame.command === 'CONNECTED') {
            console.log('[STOMP] Connected, subscribing to notifications...')
            sendStompCommand('SUBSCRIBE', {
              'id': `sub-${Date.now()}`,
              'destination': `/user/${user.id}/queue/notifications`,
            })
            return
          }

          // Handle MESSAGE
          if (frame.command === 'MESSAGE') {
            try {
              const notification = JSON.parse(frame.body || '{}')
              console.log('[STOMP] Notification received:', notification)

              dispatch(addNotification({
                id: notification.id || `notif_${Date.now()}`,
                type: notification.type || 'order',
                title: notification.title || 'New Notification',
                message: notification.message || '',
                time: notification.createdAt || new Date().toISOString(),
                read: notification.status === 'READ',
                data: notification,
              }))

              playNotificationSound()
            } catch (parseErr) {
              console.error('[STOMP] Parse notification error:', parseErr)
            }
            return
          }

          // Handle ERROR
          if (frame.command === 'ERROR') {
            console.error('[STOMP] Error frame:', frame.body)
            return
          }

          // Handle RECEIPT
          if (frame.command === 'RECEIPT') {
            console.log('[STOMP] Receipt received:', frame.headers['receipt-id'])
            return
          }
        } catch (err) {
          console.error('[STOMP] Frame parse error:', err)
        }
      }

      connectionRef.current.onerror = (err) => {
        console.error('[STOMP WebSocket] Error:', err)
      }

      connectionRef.current.onclose = () => {
        console.log('[STOMP WebSocket] Disconnected')
      }

      return () => {
        if (connectionRef.current?.readyState === WebSocket.OPEN) {
          try {
            sendStompCommand('DISCONNECT', { 'receipt': `disc-${Date.now()}` })
          } catch (e) {
            // Silent fail
          }
          connectionRef.current.close()
        }
      }
    } catch (err) {
      console.error('[STOMP WebSocket] Setup error:', err)
    }
  }, [user?.id, dispatch])

  // Helper function to send STOMP commands
  const sendStompCommand = (command: string, headers: Record<string, string>, body?: string) => {
    if (!connectionRef.current || connectionRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[STOMP] WebSocket not connected, cannot send:', command)
      return
    }

    let frame = command + '\n'
    Object.entries(headers).forEach(([key, value]) => {
      frame += `${key}:${value}\n`
    })
    frame += '\n'
    if (body) frame += body
    frame += '\x00' // Null terminator

    connectionRef.current.send(frame)
    console.log('[STOMP] Sent:', command)
  }

  // Load role-specific unread counts
  useEffect(() => {
    if (!user?.id) return

    const loadUnreadCounts = async () => {
      try {
        const unreadOrderCount = await notificationService.getUnreadOrderCount?.()
        if (unreadOrderCount) {
          dispatch(updateSellerUnreadCount(unreadOrderCount))
        }
      } catch (err) {
        console.error('[Notifications] Failed to load unread counts:', err)
      }
    }

    loadUnreadCounts()
    const interval = setInterval(loadUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [user?.id, user?.role, dispatch])

  return {
    notifications,
    unreadCount,
    stompClient: stompClientRef.current,
  }
}

// Parse STOMP frame format
const parseStompFrame = (data: string): StompFrame => {
  const lines = data.split('\n')
  const command = lines[0]
  const headers: Record<string, string> = {}

  let i = 1
  for (; i < lines.length && lines[i]; i++) {
    const [key, value] = lines[i].split(':')
    if (key && value) headers[key] = value
  }

  const body = lines.slice(i + 1).join('\n').replace(/\x00$/, '')

  return { command, headers, body }
}

// Helper to play notification sound
const playNotificationSound = () => {
  try {
    const audio = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBg=='
    )
    audio.volume = 0.3
    audio.play().catch(() => {})
  } catch (err) {
    // Silent fail
  }
}
