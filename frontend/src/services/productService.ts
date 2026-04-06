import api from "@/api/api"
import type {
  ProductResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductSearchRequest,
  CustomerReviewResponse,
  CreateReviewRequest,
  ProductRatingStats,
  WishlistResponse,
  PageResponse,
} from "@/types/dto"

export const productService = {
  getPublicProducts: async (page = 0, size = 20): Promise<PageResponse<ProductResponse>> => {
    const res = await api.get<PageResponse<ProductResponse>>(`/products?page=${page}&size=${size}`)
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  getProductById: async (id: string): Promise<ProductResponse | null> => {
    const res = await api.get<ProductResponse>(`/products/${id}`)
    return res.result || null
  },

  searchProducts: async (params: ProductSearchRequest): Promise<PageResponse<ProductResponse>> => {
    const query = new URLSearchParams()
    if (params.keyword) query.set("keyword", params.keyword)
    if (params.category_id) query.set("categoryId", params.category_id)
    if (params.shop_id) query.set("shopId", params.shop_id)
    if (params.min_price !== undefined) query.set("minPrice", String(params.min_price))
    if (params.max_price !== undefined) query.set("maxPrice", String(params.max_price))
    if (params.sortBy) query.set("sortBy", params.sortBy)
    if (params.sortDir) query.set("sortDir", params.sortDir)
    if (params.page !== undefined) query.set("page", String(params.page))
    if (params.size !== undefined) query.set("size", String(params.size))

    const res = await api.get<PageResponse<ProductResponse>>(
      `/products/search?${query.toString()}`
    )
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  getNewestProducts: async (limit = 10): Promise<ProductResponse[]> => {
    const res = await api.get<ProductResponse[]>(`/products/newest?limit=${limit}`)
    return res.result || []
  },
  getTopSellingProducts: async (page = 0, size = 10): Promise<PageResponse<ProductResponse>> => {
    const res = await api.get<PageResponse<ProductResponse>>(`/products/top-selling?page=${page}&size=${size}`)
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  getTopSellingByShop: async (shopId: string, page = 0, size = 10): Promise<PageResponse<ProductResponse>> => {
    const res = await api.get<PageResponse<ProductResponse>>(
      `/products/shop/${shopId}/top-selling?page=${page}&size=${size}`
    )
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  getTopSellingByCategory: async (categoryId: string, page = 0, size = 10): Promise<PageResponse<ProductResponse>> => {
    const res = await api.get<PageResponse<ProductResponse>>(
      `/products/category/${categoryId}/top-selling?page=${page}&size=${size}`
    )
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  getProductsByShop: async (shopId: string, page = 0, size = 20): Promise<PageResponse<ProductResponse>> => {
    const res = await api.get<PageResponse<ProductResponse>>(`/products/shop/${shopId}?page=${page}&size=${size}`)
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },
  getSellerProducts: async (page = 0, size = 10): Promise<PageResponse<ProductResponse>> => {
    const res = await api.get<PageResponse<ProductResponse>>(`/seller/products?page=${page}&size=${size}`)
    return res.result || { content: [], totalPages: 0, totalElements: 0 }
  },

  createProduct: async (
    data: Omit<ProductCreateRequest, "image_urls">,
    files?: File[]
  ): Promise<ProductResponse> => {
    const formData = new FormData()
    formData.append(
      "product",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    )
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file))
    }
    const res = await api.post<ProductResponse>("/seller/products", formData)
    if (!res.result) throw new Error("Failed to create product")
    return res.result
  },

  updateProduct: async (
    productId: string,
    data: ProductUpdateRequest,
    newFiles?: File[]
  ): Promise<ProductResponse> => {
    const formData = new FormData()
    formData.append(
      "product",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    )
    if (newFiles && newFiles.length > 0) {
      newFiles.forEach((file) => formData.append("files", file))
    }
    const res = await api.put<ProductResponse>(`/seller/products/${productId}`, formData)
    if (!res.result) throw new Error("Failed to update product")
    return res.result
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await api.del<void>(`/seller/products/${productId}`)
  },

  createReview: async (data: CreateReviewRequest): Promise<CustomerReviewResponse> => {
    const res = await api.post<CustomerReviewResponse>("/reviews", data)
    if (!res.result) throw new Error("Failed to create review")
    return res.result
  },

  getProductReviews: async (productId: string): Promise<CustomerReviewResponse[]> => {
    const res = await api.get<CustomerReviewResponse[]>(`/reviews/product/${productId}`)
    return res.result || []
  },

  getProductRatingStats: async (productId: string): Promise<ProductRatingStats | null> => {
    const res = await api.get<ProductRatingStats>(`/reviews/product/${productId}/stats`)
    return res.result || null
  },

  getWishlist: async (): Promise<WishlistResponse[]> => {
    const res = await api.get<WishlistResponse[]>("/wishlist")
    return res.result || []
  },


  addToWishlist: async (productId: string): Promise<void> => {
    await api.post<void>(`/wishlist/products/${productId}`)
  },

  removeFromWishlist: async (productId: string): Promise<void> => {
    await api.del<void>(`/wishlist/products/${productId}`)
  },

  checkWishlist: async (productId: string): Promise<boolean> => {
    const res = await api.get<boolean>(`/wishlist/check/${productId}`)
    return res.result ?? false
  },

  // Recommendations
  getRecommendationsForYou: async (limit = 20): Promise<ProductResponse[]> => {
    const res = await api.get<ProductResponse[]>(`/products/recommendations/for-you?limit=${limit}`)
    return res.result || []
  },

  getSimilarProducts: async (productId: string, limit = 10): Promise<ProductResponse[]> => {
    const res = await api.get<ProductResponse[]>(`/products/${productId}/recommendations/similar?limit=${limit}`)
    return res.result || []
  },

  getBoughtTogether: async (productId: string, limit = 10): Promise<ProductResponse[]> => {
    const res = await api.get<ProductResponse[]>(`/products/${productId}/recommendations/bought-together?limit=${limit}`)
    return res.result || []
  },
}
