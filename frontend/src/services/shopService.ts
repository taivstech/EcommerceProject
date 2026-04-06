import api from "@/api/api"
import type {
  ShopResponse,
  ShopCreateRequest,
  ShopUpdateRequest,
  ShopFollowerResponse,
  ShopAddressResponse,
} from "@/types/dto"

export const shopService = {

  getMyShop: async (): Promise<ShopResponse | null> => {
    const res = await api.get<ShopResponse>("/shops")
    return res.result || null
  },

  getPublicShops: async (size = 200): Promise<ShopResponse[]> => {
    const res = await api.get<{ content: ShopResponse[] }>(`/shops/public?size=${size}`)
    return (res.result as any)?.content || []
  },

  getShopById: async (id: string): Promise<ShopResponse | null> => {
    const res = await api.get<ShopResponse>(`/shops/${id}`)
    return res.result || null
  },

  getShopIdsByProvinceId: async (provinceId: string): Promise<string[]> => {
    const res = await api.get<string[]>(`/shops/byProvinceId/${provinceId}`)
    return res.result || []
  },


  getUserIdByShop: async (shopId: string): Promise<string> => {
    const res = await api.get<string>(`/shops/getUserId/${shopId}`)
    return res.result || ""
  },


  getShopIdByUser: async (userId: string): Promise<string> => {
    const res = await api.get<string>(`/shops/getShopId/${userId}`)
    return res.result || ""
  },

  createShop: async (data: ShopCreateRequest, logoFile?: File | null): Promise<string> => {
    if (logoFile) {
      const formData = new FormData()
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" })
      )
      formData.append("file", logoFile)
      const res = await api.post<string>("/shops/create", formData)
      return res.result || ""
    }
    const res = await api.post<string>("/shops/create", data)
    return res.result || ""
  },

  updateShop: async (data: ShopUpdateRequest, logoFile?: File | null): Promise<string> => {
    if (logoFile) {
      const formData = new FormData()
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" })
      )
      formData.append("file", logoFile)
      const res = await api.put<string>("/shops", formData)
      return res.result || ""
    }
    const res = await api.put<string>("/shops", data)
    return res.result || ""
  },

  getShopAddresses: async (shopIds: string[]): Promise<ShopAddressResponse[]> => {
    const query = shopIds.map((id) => `ids=${encodeURIComponent(id)}`).join("&")
    const res = await api.get<ShopAddressResponse[]>(`/shop-addresses?${query}`)
    return res.result || []
  },

  followShop: async (id: string): Promise<void> => {
    await api.post<void>(`/shops/${id}/follow`)
  },

  unfollowShop: async (id: string): Promise<void> => {
    await api.del<void>(`/shops/${id}/follow`)
  },


  getFollowerCount: async (id: string): Promise<number> => {
    const res = await api.get<number>(`/shops/${id}/follower-count`)
    return res.result ?? 0
  },


  isFollowing: async (id: string): Promise<boolean> => {
    const res = await api.get<boolean>(`/shops/${id}/is-following`)
    return res.result ?? false
  },

  getFollowedShops: async (): Promise<ShopFollowerResponse[]> => {
    const res = await api.get<ShopFollowerResponse[]>("/shops/followed")
    return res.result || []
  },
}
