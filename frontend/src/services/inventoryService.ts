import api from '@/api/api'

export interface InventorySummary {
  totalProducts: number
  totalVariants: number
  totalStockUnits: number
  totalSoldUnits: number
  criticalStockItems: number
  lowStockItems: number
  outOfStockItems: number
  deadStockItems: number
  averageTurnoverRate: number
}

export interface StockAlert {
  productId: string
  productName: string
  variantId: string
  variantName: string
  sku: string
  currentStock: number
  soldCount: number
  price: number
  alertLevel: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW'
  mainImageUrl: string | null
}

export interface ProductAging {
  productId: string
  productName: string
  mainImageUrl: string | null
  totalStock: number
  totalSold: number
  minPrice: number
  maxPrice: number
  createdAt: string
  daysInInventory: number
  turnoverRate: number
  agingCategory: 'FAST_MOVING' | 'NORMAL' | 'SLOW_MOVING' | 'DEAD_STOCK'
}

export interface RecentSale {
  orderId: string
  productId: string
  productName: string
  variantName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  orderDate: string
  orderStatus: string
  buyerName: string | null
}

export const inventoryService = {
  getSummary: async (): Promise<InventorySummary> => {
    const res = await api.get<InventorySummary>('/warehouses/inventory/summary')
    return res.result!
  },

  getStockAlerts: async (threshold = 20): Promise<StockAlert[]> => {
    const res = await api.get<StockAlert[]>(`/warehouses/inventory/stock-alerts?threshold=${threshold}`)
    return res.result || []
  },

  getProductAging: async (): Promise<ProductAging[]> => {
    const res = await api.get<ProductAging[]>('/warehouses/inventory/product-aging')
    return res.result || []
  },

  getRecentSales: async (limit = 50): Promise<RecentSale[]> => {
    const res = await api.get<RecentSale[]>(`/warehouses/inventory/recent-sales?limit=${limit}`)
    return res.result || []
  },
}
