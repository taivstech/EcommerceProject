import api from "@/api/api"
import type { CouponResponse, CreateCouponRequest } from "@/types/dto"

export const couponService = {

  createCoupon: async (data: CreateCouponRequest): Promise<CouponResponse> => {
    const res = await api.post<CouponResponse>("/coupons", data)
    if (!res.result) throw new Error("Failed to create coupon")
    return res.result
  },


  createShopCoupon: async (data: CreateCouponRequest): Promise<CouponResponse> => {
    const res = await api.post<CouponResponse>("/coupons/seller", data)
    if (!res.result) throw new Error("Failed to create coupon")
    return res.result
  },


  getPlatformCoupons: async (): Promise<CouponResponse[]> => {
    const res = await api.get<CouponResponse[]>("/coupons/platform")
    return res.result || []
  },


  getShopCoupons: async (shopId: string): Promise<CouponResponse[]> => {
    const res = await api.get<CouponResponse[]>(`/coupons/shop/${shopId}`)
    return res.result || []
  },


  getMyShopCoupons: async (): Promise<CouponResponse[]> => {
    const res = await api.get<CouponResponse[]>("/coupons/seller/my")
    return res.result || []
  },


  getCouponByCode: async (code: string): Promise<CouponResponse | null> => {
    const res = await api.get<CouponResponse>(`/coupons/${encodeURIComponent(code)}`)
    return res.result || null
  },


  getAllCoupons: async (): Promise<CouponResponse[]> => {
    const res = await api.get<CouponResponse[]>("/coupons/all")
    return res.result || []
  },

  deactivateCoupon: async (id: string): Promise<void> => {
    await api.put<void>(`/coupons/${id}/deactivate`)
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await api.del<void>(`/coupons/${id}`)
  },
}
