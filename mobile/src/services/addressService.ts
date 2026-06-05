import { api } from './api';

export interface UserAddressResponse {
  id: string;
  receiverName: string;
  phoneNumber: string;
  fullAddress: string;
  detailAddress?: string;
  ward?: string;
  wardCode?: string;
  district?: string;
  districtId?: number;
  province?: string;
  provinceId?: string;
  defaultAddress: boolean;
}

export interface UserAddressRequest {
  receiver_name: string;
  phone_number: string;
  full_address?: string;
  detail_address?: string;
  ward?: string;
  ward_code?: string;
  district?: string;
  district_id?: number;
  province?: string;
  province_id?: string;
  default_address: boolean;
}

const mapAddressResponse = (item: any): UserAddressResponse => {
  return {
    id: item.id,
    receiverName: item.receiver_name || item.receiverName || '',
    phoneNumber: item.phone_number || item.phoneNumber || '',
    fullAddress: item.full_address || item.fullAddress || '',
    detailAddress: item.detail_address || item.detailAddress || '',
    ward: item.ward || '',
    wardCode: item.ward_code || item.wardCode || '',
    district: item.district || '',
    districtId: item.district_id !== undefined ? item.district_id : item.districtId,
    province: item.province || '',
    provinceId: item.province_id || item.provinceId || '',
    defaultAddress: item.default_address !== undefined ? item.default_address : item.defaultAddress,
  };
};

export const addressService = {
  // Lấy toàn bộ danh sách địa chỉ nhận hàng
  getAllMyAddresses: async (): Promise<UserAddressResponse[]> => {
    try {
      const res = await api.get<any[]>('/users/me/addresses');
      const list = res.result || [];
      return list.map(mapAddressResponse);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách địa chỉ:', err);
      return [];
    }
  },

  // Lấy địa chỉ cụ thể theo ID
  getMyAddressById: async (id: string): Promise<UserAddressResponse | null> => {
    try {
      const res = await api.get<any>(`/users/me/addresses/${id}`);
      return res.result ? mapAddressResponse(res.result) : null;
    } catch (err) {
      console.error(`Lỗi khi lấy địa chỉ ${id}:`, err);
      return null;
    }
  },

  // Tạo địa chỉ mới
  createMyAddress: async (data: UserAddressRequest): Promise<boolean> => {
    try {
      await api.post<void>('/users/me/addresses', data);
      return true;
    } catch (err) {
      console.error('Lỗi khi thêm địa chỉ:', err);
      return false;
    }
  },

  // Cập nhật địa chỉ
  updateMyAddress: async (id: string, data: UserAddressRequest): Promise<boolean> => {
    try {
      await api.put<void>(`/users/me/addresses/${id}`, data);
      return true;
    } catch (err) {
      console.error(`Lỗi khi cập nhật địa chỉ ${id}:`, err);
      return false;
    }
  },

  // Xóa địa chỉ
  deleteMyAddress: async (id: string): Promise<boolean> => {
    try {
      await api.del<void>(`/users/me/addresses/${id}`);
      return true;
    } catch (err) {
      console.error(`Lỗi khi xóa địa chỉ ${id}:`, err);
      return false;
    }
  },

  // Đặt làm mặc định
  setMyDefaultAddress: async (id: string): Promise<boolean> => {
    try {
      await api.put<void>(`/users/me/addresses/${id}/default`, {});
      return true;
    } catch (err) {
      console.error(`Lỗi khi đặt mặc định địa chỉ ${id}:`, err);
      return false;
    }
  }
};
