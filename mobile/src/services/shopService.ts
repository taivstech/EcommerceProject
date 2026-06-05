import { api } from './api';

export interface ShopAddressResponse {
  id: string;
  shopId: string;
  province?: string;
  provinceId?: string;
  district?: string;
  districtId?: number;
  ward?: string;
  wardCode?: string;
  detailAddress?: string;
}

const mapShopAddressResponse = (item: any): ShopAddressResponse => {
  return {
    id: item.id,
    shopId: item.shop_id || item.shopId || item.id || '',
    province: item.province || '',
    provinceId: item.province_id || item.provinceId || '',
    district: item.district || '',
    districtId: item.district_id !== undefined ? item.district_id : item.districtId,
    ward: item.ward || '',
    wardCode: item.ward_code || item.wardCode || '',
    detailAddress: item.detail_address || item.detailAddress || '',
  };
};

export const shopService = {
  getShopAddresses: async (shopIds: string[]): Promise<ShopAddressResponse[]> => {
    try {
      const query = shopIds.map((id) => `ids=${encodeURIComponent(id)}`).join('&');
      const res = await api.get<any[]>(`/shop-addresses?${query}`);
      const list = res.result || [];
      return list.map(mapShopAddressResponse);
    } catch (err) {
      console.error('Lỗi lấy danh sách địa chỉ shop:', err);
      return [];
    }
  }
};
