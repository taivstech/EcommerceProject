import { api } from './api';

export interface ChatContactResponse {
  id: string;
  name: string;
  avatar?: string;
  type: 'USER' | 'SHOP';
}

export interface PrivateChatResponse {
  room_id: string;
  other_user_id: string;
  other_user_name: string;
  other_shop_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface MessageResponse {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  type: 'TEXT' | 'IMAGE';
  sent_at: string;
  is_read: boolean;
}

export const messageService = {
  // Lấy danh sách các cuộc hội thoại của tôi
  getMyPrivateChats: async (): Promise<PrivateChatResponse[]> => {
    try {
      const res = await api.get<PrivateChatResponse[]>('/messages/private-chats');
      return res.result || [];
    } catch (err) {
      console.error('Lỗi lấy danh sách cuộc hội thoại:', err);
      return [];
    }
  },

  // Lấy danh sách tin nhắn của một phòng chat cụ thể
  getRoomMessages: async (roomId: string): Promise<MessageResponse[]> => {
    try {
      const res = await api.get<MessageResponse[]>(`/messages/rooms/${roomId}/messages`);
      return res.result || [];
    } catch (err) {
      console.error(`Lỗi lấy tin nhắn phòng ${roomId}:`, err);
      return [];
    }
  },

  // Gửi tin nhắn văn bản vào phòng chat
  sendRoomMessage: async (roomId: string, content: string): Promise<MessageResponse | null> => {
    try {
      const res = await api.post<MessageResponse>(`/messages/rooms/${roomId}/messages`, { content });
      return res.result || null;
    } catch (err) {
      console.error(`Lỗi gửi tin nhắn tới phòng ${roomId}:`, err);
      return null;
    }
  },

  // Tạo mới hoặc lấy phòng chat riêng tư có sẵn với một người dùng/shop khác
  createOrGetPrivateChat: async (otherUserId: string): Promise<PrivateChatResponse | null> => {
    try {
      const res = await api.post<PrivateChatResponse>('/messages/private-chats', { other_user_id: otherUserId });
      return res.result || null;
    } catch (err) {
      console.error(`Lỗi tạo/lấy phòng chat với user ${otherUserId}:`, err);
      return null;
    }
  },

  // Đánh dấu toàn bộ tin nhắn trong phòng là đã đọc
  markAsRead: async (roomId: string): Promise<void> => {
    try {
      await api.post<void>(`/messages/rooms/${roomId}/read`);
    } catch (err) {
      console.error(`Lỗi đánh dấu đã đọc phòng ${roomId}:`, err);
    }
  },

  // Tìm kiếm liên hệ để chat mới
  searchContacts: async (query: string): Promise<ChatContactResponse[]> => {
    try {
      const res = await api.get<ChatContactResponse[]>(`/messages/contacts/search?q=${encodeURIComponent(query)}`);
      return res.result || [];
    } catch (err) {
      console.error('Lỗi tìm kiếm liên hệ:', err);
      return [];
    }
  }
};
