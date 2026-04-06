import api from "@/api/api"
import type { NotificationResponse } from "@/types/dto"

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationResponse[]> => {
    const res = await api.get<NotificationResponse[]>("/notifications")
    return res.result || []
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<number>("/notifications/unread-count")
    return res.result ?? 0
  },

  getUnreadOrderCount: async (): Promise<number> => {
    const res = await api.get<number>("/notifications/unread-order-count")
    return res.result ?? 0
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put<void>(`/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put<void>("/notifications/read-all")
  },
}

