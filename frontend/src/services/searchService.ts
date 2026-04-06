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
    if (params.sortBy) query.set("sortBy", params.sortBy)
    if (params.sortDir) query.set("sortDir", params.sortDir)
    if (params.page !== undefined) query.set("page", String(params.page))
    if (params.size !== undefined) query.set("size", String(params.size))

    try {
      const res = await api.get<PageResponse<ProductSearchResult>>(
        `/search/products?${query.toString()}`
      )
      const esResult = res.result || { content: [], totalPages: 0, totalElements: 0 }
      
      // If Elasticsearch returns empty results and we have a search query, fallback to database search
      if (esResult.empty && params.q && params.q.trim().length > 0) {
        console.warn("Elasticsearch returned empty results, falling back to database search")
        const fallbackQuery = new URLSearchParams()
        if (params.q) fallbackQuery.set("keyword", params.q)
        if (params.categoryId) fallbackQuery.set("categoryId", params.categoryId)
        if (params.shopId) fallbackQuery.set("shopId", params.shopId)
        if (params.minPrice !== undefined) fallbackQuery.set("minPrice", String(params.minPrice))
        if (params.maxPrice !== undefined) fallbackQuery.set("maxPrice", String(params.maxPrice))
        if (params.sortBy) fallbackQuery.set("sortBy", params.sortBy)
        if (params.sortDir) fallbackQuery.set("sortDir", params.sortDir)
        if (params.page !== undefined) fallbackQuery.set("page", String(params.page))
        if (params.size !== undefined) fallbackQuery.set("size", String(params.size))

        try {
          const fallbackRes = await api.get<PageResponse<any>>(
            `/products/search?${fallbackQuery.toString()}`
          )
          return fallbackRes.result || { content: [], totalPages: 0, totalElements: 0 }
        } catch {
          return esResult
        }
      }
      
      return esResult
    } catch {
      // Fallback to standard search if Elasticsearch is unavailable
      console.warn("Elasticsearch unavailable, falling back to standard search")
      const fallbackQuery = new URLSearchParams()
      if (params.q) fallbackQuery.set("keyword", params.q)
      if (params.categoryId) fallbackQuery.set("categoryId", params.categoryId)
      if (params.shopId) fallbackQuery.set("shopId", params.shopId)
      if (params.minPrice !== undefined) fallbackQuery.set("minPrice", String(params.minPrice))
      if (params.maxPrice !== undefined) fallbackQuery.set("maxPrice", String(params.maxPrice))
      if (params.sortBy) fallbackQuery.set("sortBy", params.sortBy)
      if (params.sortDir) fallbackQuery.set("sortDir", params.sortDir)
      if (params.page !== undefined) fallbackQuery.set("page", String(params.page))
      if (params.size !== undefined) fallbackQuery.set("size", String(params.size))

      const fallbackRes = await api.get<PageResponse<any>>(
        `/products/search?${fallbackQuery.toString()}`
      )
      return fallbackRes.result || { content: [], totalPages: 0, totalElements: 0 }
    }
  },

  /**
   * Autocomplete / suggestion endpoint — returns keyword suggestions + matching shops.
   */
  suggest: async (prefix: string, limit = 8): Promise<SuggestResponse> => {
    if (!prefix || prefix.trim().length < 2) return { keywords: [], shops: [] }

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
