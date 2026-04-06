import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface Notification {
  id: string
  type: "order" | "promo" | "report" | "warehouse" | "admin"
  title: string
  message: string
  time: string
  read: boolean
  link?: string
  data?: any
}

interface NotificationState {
  list: Notification[]
  unreadCount: number
  sellerUnreadCount: number
  adminUnreadCount: number
  warehouseUnreadCount: number
  isLoading: boolean
}

const initialState: NotificationState = {
  list: [],
  unreadCount: 0,
  sellerUnreadCount: 0,
  adminUnreadCount: 0,
  warehouseUnreadCount: 0,
  isLoading: false,
}

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // Load all notifications (from API)
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.list = action.payload
      state.unreadCount = action.payload.filter(n => !n.read).length
    },

    // Add new notification (from WebSocket)
    addNotification: (state, action: PayloadAction<Notification>) => {
      const exists = state.list.some(n => n.id === action.payload.id)
      if (!exists) {
        state.list.unshift(action.payload)
        if (!action.payload.read) {
          state.unreadCount += 1
        }
      }
    },

    // Mark single notification as read
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.list.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },

    // Mark all as read
    markAllAsRead: (state) => {
      state.list.forEach(n => {
        n.read = true
      })
      state.unreadCount = 0
    },

    // Clear all notifications
    clearNotifications: (state) => {
      state.list = []
      state.unreadCount = 0
    },

    // Update unread counts by role
    updateSellerUnreadCount: (state, action: PayloadAction<number>) => {
      state.sellerUnreadCount = action.payload
    },

    updateAdminUnreadCount: (state, action: PayloadAction<number>) => {
      state.adminUnreadCount = action.payload
    },

    updateWarehouseUnreadCount: (state, action: PayloadAction<number>) => {
      state.warehouseUnreadCount = action.payload
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  updateSellerUnreadCount,
  updateAdminUnreadCount,
  updateWarehouseUnreadCount,
  setLoading,
} = notificationSlice.actions

export default notificationSlice.reducer
