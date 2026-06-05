import api from "@/api/api"
import type {
  DashboardStats,
  ShopResponse,
  OrderResponse,
  UpdateOrderStatusRequest,
  ShopModerationRequest,
  CouponResponse,
  CreateCouponRequest,
  UserResponse,
  CategoryResponse,
  CategoryRequest,
} from "@/types/dto"
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { API_BASE_URL } from "@/api/config"
import { authService } from "@/utils/auth"

export const adminService = {

  getDashboardStats: async (): Promise<DashboardStats | null> => {
    const res = await api.get<DashboardStats>("/admin/stats/dashboard")
    return res.result || null
  },

  getDashboardStream: (onMessage: (data: DashboardStats) => void, onError: (err: any) => void): AbortController => {
    const token = authService.getAccessToken();
    const controller = new AbortController();
    fetchEventSource(`${API_BASE_URL}/dashboard/stream/admin`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      onmessage(msg) {
        if (msg.event === 'STATS_UPDATE') {
          onMessage(JSON.parse(msg.data));
        }
      },
      onerror(err) {
        onError(err);
      }
    });
    return controller;
  },

  getAllShops: async (status?: string): Promise<ShopResponse[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ""
    const res = await api.get<any>(`/admin/shops${query}`)
    const data = res.result
    if (data && data.content && Array.isArray(data.content)) {
      return data.content
    }
    return Array.isArray(data) ? data : []
  },

  approveShop: async (id: string): Promise<void> => {
    await api.patch<void>(`/admin/shops/${id}/approve`)
  },

  rejectShop: async (id: string, body?: ShopModerationRequest): Promise<void> => {
    await api.patch<void>(`/admin/shops/${id}/reject`, body)
  },

  suspendShop: async (id: string, body?: ShopModerationRequest): Promise<void> => {
    await api.patch<void>(`/admin/shops/${id}/suspend`, body)
  },

  getAllOrders: async (status?: string): Promise<OrderResponse[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ""
    const res = await api.get<OrderResponse[]>(`/admin/orders${query}`)
    return res.result || []
  },

  updateOrderStatus: async (id: string, body: UpdateOrderStatusRequest): Promise<void> => {
    await api.put<void>(`/admin/orders/${id}/status`, body)
  },

  deliverOrder: async (id: string): Promise<void> => {
    await api.put<void>(`/admin/orders/${id}/deliver`)
  },


  createCoupon: async (body: CreateCouponRequest): Promise<CouponResponse> => {
    const res = await api.post<CouponResponse>("/coupons", body)
    if (!res.result) throw new Error("Failed to create coupon")
    return res.result
  },

  getUsers: async (): Promise<UserResponse[]> => {
    const res = await api.get<UserResponse[]>("/users")
    return res.result || []
  },

  getUserById: async (id: string): Promise<UserResponse | null> => {
    const res = await api.get<UserResponse>(`/users/${id}`)
    return res.result || null
  },

  // User management
  getAllUsers: async (page = 0, size = 50): Promise<any> => {
    const res = await api.get<any>(`/admin/users?page=${page}&size=${size}`)
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  activateUser: async (id: string): Promise<void> => {
    await api.patch<void>(`/admin/users/${id}/activate`)
  },

  deactivateUser: async (id: string): Promise<void> => {
    await api.patch<void>(`/admin/users/${id}/deactivate`)
  },

  updateUserRoles: async (id: string, roles: string[]): Promise<void> => {
    await api.put<void>(`/admin/users/${id}/roles`, { roles })
  },

  // Category management
  getAllCategoriesAdmin: async (): Promise<CategoryResponse[]> => {
    const res = await api.get<CategoryResponse[]>("/categories")
    return res.result || []
  },

  createCategoryAdmin: async (data: CategoryRequest): Promise<CategoryResponse> => {
    const res = await api.post<CategoryResponse>("/categories", data)
    if (!res.result) throw new Error("Failed to create category")
    return res.result
  },

  updateCategoryAdmin: async (id: string, data: CategoryRequest): Promise<CategoryResponse> => {
    const res = await api.put<CategoryResponse>(`/categories/${id}`, data)
    if (!res.result) throw new Error("Failed to update category")
    return res.result
  },

  deleteCategoryAdmin: async (id: string): Promise<void> => {
    await api.del<void>(`/categories/${id}`)
  },

  // Statistics
  getCategoryStats: async (): Promise<any> => {
    const res = await api.get<any>("/admin/stats/categories").catch(() => ({ result: null }))
    return res.result || {}
  },

  getUserStats: async (): Promise<any> => {
    const res = await api.get<any>("/admin/stats/users").catch(() => ({ result: null }))
    return res.result || {}
  },

  // Advanced analytics
  getRevenueChart: async (days = 30): Promise<any[]> => {
    const res = await api.get<any[]>(`/admin/stats/revenue-chart?days=${days}`)
    return res.result || []
  },

  getMonthlyRevenueChart: async (months = 12): Promise<any[]> => {
    const res = await api.get<any[]>(`/admin/stats/revenue-chart/monthly?months=${months}`)
    return res.result || []
  },

  getTopProducts: async (days = 30, limit = 10): Promise<any[]> => {
    const res = await api.get<any[]>(`/admin/stats/top-products?days=${days}&limit=${limit}`)
    return res.result || []
  },

  getUserGrowth: async (days = 30): Promise<any[]> => {
    const res = await api.get<any[]>(`/admin/stats/user-growth?days=${days}`)
    return res.result || []
  },

  getOrderStatusDistribution: async (): Promise<Record<string, number>> => {
    const res = await api.get<Record<string, number>>("/admin/stats/order-status")
    return res.result || {}
  },

  getCategoryRevenue: async (days = 30): Promise<any[]> => {
    const res = await api.get<any[]>(`/admin/stats/category-revenue?days=${days}`)
    return res.result || []
  },

  getCommissionHistory: async (page = 0, size = 10): Promise<any> => {
    const res = await api.get<any>(`/admin/commission/history?page=${page}&size=${size}`)
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },
}

