import api from "@/api/api"
import type {
  CreatePrivateChatRequest,
  MessageResponse,
  PrivateChatResponse,
  SendRoomMessageRequest,
  PageResponse,
} from "@/types/dto"

export const messageService = {
  createOrGetPrivateChat: async (data: CreatePrivateChatRequest): Promise<PrivateChatResponse> => {
    const res = await api.post<PrivateChatResponse>("/messages/private-chats", data)
    if (!res.result) throw new Error("Failed to create/get private chat")
    return res.result
  },

  getMyPrivateChats: async (): Promise<PrivateChatResponse[]> => {
    const res = await api.get<PrivateChatResponse[]>("/messages/private-chats")
    return res.result || []
  },

  getRoomMessages: async (roomId: string): Promise<MessageResponse[]> => {
    const res = await api.get<MessageResponse[]>(`/messages/rooms/${roomId}/messages`)
    return res.result || []
  },

  getPagedMessages: async (roomId: string, page = 0, size = 50): Promise<PageResponse<MessageResponse>> => {
    const res = await api.get<PageResponse<MessageResponse>>(`/messages/rooms/${roomId}/messages/paged?page=${page}&size=${size}`)
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  markAsRead: async (roomId: string): Promise<void> => {
    await api.post<void>(`/messages/rooms/${roomId}/read`)
  },

  getUnreadCounts: async (): Promise<Record<string, number>> => {
    const res = await api.get<Record<string, number>>("/messages/unread-counts")
    return res.result || {}
  },

  isUserOnline: async (userId: string): Promise<boolean> => {
    const res = await api.get<boolean>(`/messages/users/${userId}/online`)
    return res.result ?? false
  },

  sendRoomMessage: async (roomId: string, data: SendRoomMessageRequest): Promise<MessageResponse> => {
    const res = await api.post<MessageResponse>(`/messages/rooms/${roomId}/messages`, data)
    if (!res.result) throw new Error("Failed to send message")
    return res.result
  },

  sendImageMessage: async (roomId: string, file: File): Promise<MessageResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await api.post<MessageResponse>(`/messages/rooms/${roomId}/messages`, formData)
    if (!res.result) throw new Error("Failed to send image message")
    return res.result
  },

  searchContacts: async (query: string): Promise<any[]> => {
    const res = await api.get<any[]>(`/messages/contacts/search?q=${encodeURIComponent(query)}`)
    return res.result || []
  },
}

