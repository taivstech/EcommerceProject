import { api } from './api';

export interface CouponResponse {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  isActive: boolean;
  description?: string;
  maxUsage?: number;
  maxUsagePerUser?: number;
  currentUsage?: number;
  currentUserUsageCount?: number;
  usedByCurrentUser?: boolean;
  shopId?: string;
}

const mapCouponResponse = (item: any): CouponResponse => {
  return {
    id: item.id,
    code: item.code,
    discountType: item.discount_type || item.discountType || 'FIXED_AMOUNT',
    discountValue: item.discount_value !== undefined ? Number(item.discount_value) : (item.discountValue !== undefined ? Number(item.discountValue) : 0),
    minOrderAmount: item.min_order_amount !== undefined ? Number(item.min_order_amount) : (item.minOrderAmount !== undefined ? Number(item.minOrderAmount) : 0),
    maxDiscount: item.max_discount !== undefined ? Number(item.max_discount) : (item.maxDiscount !== undefined ? Number(item.maxDiscount) : undefined),
    isActive: item.is_active !== undefined ? item.is_active : (item.isActive !== undefined ? item.isActive : false),
    description: item.description || '',
    maxUsage: item.max_usage !== undefined ? item.max_usage : item.maxUsage,
    maxUsagePerUser: item.max_usage_per_user !== undefined ? item.max_usage_per_user : item.maxUsagePerUser,
    currentUsage: item.current_usage !== undefined ? item.current_usage : item.currentUsage,
    currentUserUsageCount: item.current_user_usage_count !== undefined ? item.current_user_usage_count : item.currentUserUsageCount,
    usedByCurrentUser: item.used_by_current_user !== undefined ? item.used_by_current_user : item.usedByCurrentUser,
    shopId: item.shop_id || item.shopId || undefined,
  };
};

export const couponService = {
  getPlatformCoupons: async (): Promise<CouponResponse[]> => {
    try {
      const res = await api.get<any[]>('/coupons/platform');
      const list = res.result || [];
      return list.map(mapCouponResponse);
    } catch {
      return [];
    }
  },

  getShopCoupons: async (shopId: string): Promise<CouponResponse[]> => {
    try {
      const res = await api.get<any[]>(`/coupons/shop/${shopId}`);
      const list = res.result || [];
      return list.map(mapCouponResponse);
    } catch {
      return [];
    }
  },

  getCouponByCode: async (code: string): Promise<CouponResponse | null> => {
    try {
      const res = await api.get<any>(`/coupons/${encodeURIComponent(code)}`);
      return res.result ? mapCouponResponse(res.result) : null;
    } catch {
      return null;
    }
  }
};
