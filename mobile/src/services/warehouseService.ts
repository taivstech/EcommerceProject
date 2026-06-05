import { api } from './api';

export interface WarehouseResponse {
  id: string;
  name: string;
  contactName?: string;
  contactPhone?: string;
  detailAddress?: string;
  fullAddress?: string;
  ward?: string;
  wardCode?: string;
  district?: string;
  districtId?: number;
  province?: string;
  provinceId?: string;
  status: string;
  isDefault: boolean;
  shopId: string;
  shopName: string;
}

const mapWarehouseResponse = (item: any): WarehouseResponse => {
  return {
    id: item.id,
    name: item.name,
    contactName: item.contact_name || item.contactName || '',
    contactPhone: item.contact_phone || item.contactPhone || '',
    detailAddress: item.detail_address || item.detailAddress || '',
    fullAddress: item.full_address || item.fullAddress || '',
    ward: item.ward || '',
    wardCode: item.ward_code || item.wardCode || '',
    district: item.district || '',
    districtId: item.district_id !== undefined ? Number(item.district_id) : (item.districtId !== undefined ? Number(item.districtId) : undefined),
    province: item.province || '',
    provinceId: item.province_id || item.provinceId || '',
    status: item.status || '',
    isDefault: item.is_default !== undefined ? !!item.is_default : (item.isDefault !== undefined ? !!item.isDefault : false),
    shopId: item.shop_id || item.shopId || '',
    shopName: item.shop_name || item.shopName || '',
  };
};

export const warehouseService = {
  getShopWarehouses: async (shopId: string): Promise<WarehouseResponse[]> => {
    try {
      const res = await api.get<any[]>(`/warehouses/shop/${shopId}`);
      const list = res.result || [];
      return list.map(mapWarehouseResponse);
    } catch (err) {
      console.error('Lỗi lấy kho hàng của shop:', err);
      return [];
    }
  }
};
