import api from "@/api/api"
import type { InventorySummary, StockAlert, ProductAging } from "./inventoryService"

export interface WarehouseResponse {
  id: string
  name: string
  contactName?: string
  contactPhone?: string
  detailAddress?: string
  fullAddress?: string
  ward?: string
  wardCode?: string
  district?: string
  districtId?: number
  province?: string
  provinceId?: string
  ghnShopId?: number
  status: string
  isDefault: boolean
  shopId: string
  shopName: string
  createdAt: string
  updatedAt: string
}

export interface WarehouseCreateRequest {
  name: string
  contactName?: string
  contactPhone?: string
  detailAddress?: string
  fullAddress?: string
  ward?: string
  wardCode?: string
  district?: string
  districtId?: number
  province?: string
  provinceId?: string
  isDefault?: boolean
}

export interface WarehouseUpdateRequest {
  name?: string
  contactName?: string
  contactPhone?: string
  detailAddress?: string
  fullAddress?: string
  ward?: string
  wardCode?: string
  district?: string
  districtId?: number
  province?: string
  provinceId?: string
  isDefault?: boolean
  status?: string
}

export const warehouseService = {
  getMyWarehouses: async (): Promise<WarehouseResponse[]> => {
    const res = await api.get<WarehouseResponse[]>("/warehouses/my")
    return res.result || []
  },

  getById: async (id: string): Promise<WarehouseResponse | null> => {
    const res = await api.get<WarehouseResponse>(`/warehouses/${id}`)
    return res.result || null
  },

  create: async (data: WarehouseCreateRequest): Promise<WarehouseResponse> => {
    const res = await api.post<WarehouseResponse>("/warehouses", data)
    return res.result!
  },

  update: async (id: string, data: WarehouseUpdateRequest): Promise<WarehouseResponse> => {
    const res = await api.put<WarehouseResponse>(`/warehouses/${id}`, data)
    return res.result!
  },

  delete: async (id: string): Promise<void> => {
    await api.del<void>(`/warehouses/${id}`)
  },

  /**
   * Get all active warehouses for a shop (public endpoint)
   * Used to display warehouse locations on shop page and during checkout
   */
  getShopWarehouses: async (shopId: string): Promise<WarehouseResponse[]> => {
    const res = await api.get<WarehouseResponse[]>(`/warehouses/shop/${shopId}`)
    return res.result || []
  },

  getInventorySummary: async (): Promise<InventorySummary | null> => {
    const res = await api.get<InventorySummary>('/warehouses/inventory/summary')
    return res.result || null
  },

  getStockAlerts: async (threshold = 20): Promise<StockAlert[]> => {
    const res = await api.get<StockAlert[]>(`/warehouses/inventory/stock-alerts?threshold=${threshold}`)
    return res.result || []
  },

  getProductAging: async (): Promise<ProductAging[]> => {
    const res = await api.get<ProductAging[]>('/warehouses/inventory/product-aging')
    return res.result || []
  },
}
