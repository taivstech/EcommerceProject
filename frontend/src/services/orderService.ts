import api from "@/api/api"
import type { OrderResponse, CheckoutRequest, UserResponse } from "@/types/dto"

export const orderService = {

  getMyOrders: async (): Promise<OrderResponse[]> => {
    const res = await api.get<OrderResponse[]>("/orders/me")
    return res.result || []
  },

  getOrderById: async (id: string): Promise<OrderResponse | null> => {
    const res = await api.get<OrderResponse>(`/orders/me/${id}`)
    return res.result || null
  },

  checkout: async (data: CheckoutRequest): Promise<OrderResponse> => {
    const res = await api.post<OrderResponse>("/orders/checkout", data)
    if (!res.result) throw new Error("Failed to checkout")
    return res.result
  },

  confirmReceipt: async (id: string): Promise<void> => {
    await api.put<void>(`/orders/${id}/confirm-receipt`)
  },

  cancelOrder: async (id: string, reason?: string): Promise<void> => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : ""
    await api.put<void>(`/orders/${id}/cancel${query}`)
  },

  getSellerOrders: async (): Promise<OrderResponse[]> => {
    const res = await api.get<OrderResponse[]>("/seller/orders")
    return res.result || []
  },

  getSellerOrderById: async (id: string): Promise<OrderResponse | null> => {
    const res = await api.get<OrderResponse>(`/seller/orders/${id}`)
    return res.result || null
  },

  confirmOrder: async (id: string): Promise<void> => {
    await api.put<void>(`/seller/orders/${id}/confirm`)
  },

  shipOrder: async (id: string): Promise<void> => {
    await api.put<void>(`/seller/orders/${id}/ship`)
  },

  deliverOrder: async (id: string): Promise<void> => {
    await api.put<void>(`/seller/orders/${id}/deliver`)
  },

  existsOrderForVariants: async (variantIds: string[]): Promise<boolean> => {
    const query = variantIds.map((id) => `variantIds=${encodeURIComponent(id)}`).join("&")
    const res = await api.get<boolean>(`/orderItems/exists?${query}`)
    return res.result ?? false
  },

  getOrderCountForVariants: async (variantIds: string[]): Promise<number> => {
    const query = variantIds.map((id) => `variantIds=${encodeURIComponent(id)}`).join("&")
    const res = await api.get<number>(`/orderItems/count?${query}`)
    return res.result ?? 0
  },

  getOrderItemOwner: async (orderItemId: string): Promise<UserResponse | null> => {
    const res = await api.get<UserResponse>(`/orderItems/owner?orderItemId=${encodeURIComponent(orderItemId)}`)
    return res.result || null
  },

  // Seller: cancel an order on behalf of shop
  cancelOrderBySeller: async (id: string, reason?: string): Promise<void> => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : ""
    await api.put<void>(`/seller/orders/${id}/cancel${query}`)
  },

  // Customer: request return/refund after delivery
  requestReturn: async (id: string, reason: string): Promise<void> => {
    await api.post<void>(`/orders/${id}/return`, { reason })
  },

  // Admin: get all orders across all shops
  getAllOrders: async (page = 0, size = 50): Promise<any> => {
    const res = await api.get<any>(`/admin/orders?page=${page}&size=${size}`)
    return res.result || []
  },

  // Seller: get order statistics summary for dashboard
  getSellerOrderStats: async (): Promise<any> => {
    const res = await api.get<any>("/seller/orders/stats").catch(() => ({ result: null }))
    return res.result || {}
  },
}
