import api from "@/api/api"
import type {
  ProductSearchResult,
  ElasticSearchRequest,
  PageResponse,
  SuggestResponse,
} from "@/types/dto"

export const searchService = {
  /**
   * Full-text product search via Elasticsearch.
   * Falls back to the standard /products/search endpoint if ES is unavailable.
   */
  searchProducts: async (params: ElasticSearchRequest): Promise<PageResponse<ProductSearchResult>> => {
    const query = new URLSearchParams()
    if (params.q) query.set("q", params.q)
    if (params.categoryId) query.set("categoryId", params.categoryId)
    if (params.shopId) query.set("shopId", params.shopId)
    if (params.province) query.set("province", params.province)
    if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice))
    if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice))
    if (params.minRating !== undefined && params.minRating > 0) query.set("minRating", String(params.minRating))
    if (params.brand) query.set("brand", params.brand)
    if (params.sortBy) query.set("sortBy", params.sortBy)
    if (params.sortDir) query.set("sortDir", params.sortDir)
    if (params.page !== undefined) query.set("page", String(params.page))
    if (params.size !== undefined) query.set("size", String(params.size))

    // The backend SearchController already handles ES → DB fallback internally.
    // Do NOT add a second fallback here — it can ignore category/filter params.
    const res = await api.get<PageResponse<ProductSearchResult>>(
      `/search/products?${query.toString()}`
    )
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  /**
   * Autocomplete / suggestion endpoint — returns keyword suggestions + matching shops.
   */
  suggest: async (prefix: string, limit = 8): Promise<SuggestResponse> => {
    if (!prefix || prefix.trim().length < 1) return { keywords: [], shops: [] }

    try {
      const res = await api.get<SuggestResponse>(
        `/search/suggest?q=${encodeURIComponent(prefix.trim())}&limit=${limit}`
      )
      return res.result || { keywords: [], shops: [] }
    } catch {
      return { keywords: [], shops: [] }
    }
  },

  /**
   * Get distinct provinces that have shops (for location filter).
   */
  getProvinces: async (): Promise<string[]> => {
    try {
      const res = await api.get<string[]>("/search/provinces")
      return res.result || []
    } catch {
      return []
    }
  },

  /**
   * Save search keyword to user's search history.
   */
  saveSearchHistory: async (keyword: string): Promise<void> => {
    try {
      await api.post<void>(`/search/history?q=${encodeURIComponent(keyword.trim())}`)
    } catch {
      // Silently ignore (user may not be logged in)
    }
  },

  /**
   * Get recent searches for current user.
   */
  getRecentSearches: async (): Promise<string[]> => {
    try {
      const res = await api.get<string[]>("/search/history")
      return res.result || []
    } catch {
      return []
    }
  },

  /**
   * Clear all search history.
   */
  clearSearchHistory: async (): Promise<void> => {
    try {
      await api.del<void>("/search/history")
    } catch {
      // Silently ignore
    }
  },
}
