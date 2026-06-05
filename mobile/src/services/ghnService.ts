import { api } from './api';

export interface GhnProvince {
  ProvinceID: number;
  ProvinceName: string;
  Code?: string;
}

export interface GhnDistrict {
  DistrictID: number;
  DistrictName: string;
  ProvinceID: number;
  Code?: string;
}

export interface GhnWard {
  WardCode: string;
  WardName: string;
  DistrictID: number;
}

export interface GhnServiceType {
  service_id: number;
  short_name: string;
  service_type_id: number;
}

export interface GhnFeeRequest {
  service_type_id: number;
  from_district_id: number;
  from_ward_code?: string;
  to_district_id: number;
  to_ward_code: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  insurance_value?: number;
  coupon?: string;
}

export const ghnService = {
  getProvinces: async (): Promise<GhnProvince[]> => {
    try {
      const res = await api.get<{ data: GhnProvince[] }>('/ghn/provinces');
      return res.result?.data || [];
    } catch (err) {
      console.error('Lỗi lấy danh sách tỉnh thành:', err);
      return [];
    }
  },

  getDistricts: async (provinceId: number): Promise<GhnDistrict[]> => {
    try {
      const res = await api.get<{ data: GhnDistrict[] }>(`/ghn/districts?province_id=${provinceId}`);
      return res.result?.data || [];
    } catch (err) {
      console.error(`Lỗi lấy danh sách quận huyện cho tỉnh ${provinceId}:`, err);
      return [];
    }
  },

  getWards: async (districtId: number): Promise<GhnWard[]> => {
    try {
      const res = await api.get<{ data: GhnWard[] }>(`/ghn/wards?district_id=${districtId}`);
      return res.result?.data || [];
    } catch (err) {
      console.error(`Lỗi lấy danh sách phường xã cho quận ${districtId}:`, err);
      return [];
    }
  },

  getAvailableServices: async (fromDistrictId: number, toDistrictId: number): Promise<GhnServiceType[]> => {
    try {
      const res = await api.post<{ data: GhnServiceType[] }>('/ghn/available-services', {
        from_district_id: fromDistrictId,
        to_district_id: toDistrictId,
      });
      return res.result?.data || [];
    } catch (err) {
      console.error('Lỗi lấy danh sách dịch vụ giao hàng:', err);
      return [];
    }
  },

  calculateFee: async (request: GhnFeeRequest): Promise<number> => {
    try {
      const res = await api.post<{ data: { total: number } }>('/ghn/calculate-fee', request);
      return res.result?.data?.total || 0;
    } catch (err) {
      console.error('Lỗi tính phí giao hàng:', err);
      return 0;
    }
  }
};
