import { api } from './api';

export interface ShippingAddressResponse {
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
}

export interface OrderItemResponse {
  id: string;
  productVariantId?: string;
  quantity: number;
  price: number;
  productId: string;
  productName: string;
  productImage?: string;
  variantName?: string;
  variantSku?: string;
  hasReview: boolean;
}

export interface OrderShopGroupResponse {
  id: string;
  shopId?: string;
  subtotal: number;
  shippingFee: number;
  totalDiscount: number;
  total: number;
  shipment?: string;
  warehouseId?: string;
  warehouseName?: string;
  items: OrderItemResponse[];
}

export interface OrderResponse {
  id: string;
  status: 'PENDING' | 'AWAITING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
  payment: string;
  isPaid: boolean;
  note?: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  shopDiscountAmount: number;
  shippingDiscountAmount: number;
  totalDiscount: number;
  total: number;
  createdAt: string;
  shippingAddress?: ShippingAddressResponse;
  shopGroups: OrderShopGroupResponse[];
}

export interface CheckoutRequest {
  receiver_name: string;
  phone_number: string;
  full_address: string;
  detail_address?: string;
  ward?: string;
  ward_code?: string;
  district?: string;
  district_id?: number;
  province?: string;
  province_id?: string;
  payment: string;
  coupon_code?: string;
  shop_coupon_code?: string;
  note?: string;
  shop_id?: string;
}

export const orderService = {
  checkout: async (data: CheckoutRequest): Promise<OrderResponse | null> => {
    try {
      const res = await api.post<OrderResponse>('/orders/checkout', data);
      return res.result || null;
    } catch (err) {
      console.error('Lỗi khi thanh toán đơn hàng:', err);
      throw err;
    }
  },

  getMyOrders: async (): Promise<OrderResponse[]> => {
    try {
      const res = await api.get<OrderResponse[]>('/orders/me');
      return res.result || [];
    } catch (err) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', err);
      return [];
    }
  },

  getOrderById: async (id: string): Promise<OrderResponse | null> => {
    try {
      const res = await api.get<OrderResponse>(`/orders/me/${id}`);
      return res.result || null;
    } catch (err) {
      console.error(`Lỗi khi lấy chi tiết đơn hàng ${id}:`, err);
      return null;
    }
  },

  cancelOrder: async (id: string, reason?: string): Promise<boolean> => {
    try {
      const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      await api.put<void>(`/orders/${id}/cancel${query}`, {});
      return true;
    } catch (err) {
      console.error(`Lỗi khi hủy đơn hàng ${id}:`, err);
      return false;
    }
  },

  confirmReceipt: async (id: string): Promise<boolean> => {
    try {
      await api.put<void>(`/orders/${id}/confirm-receipt`, {});
      return true;
    } catch (err) {
      console.error(`Lỗi khi xác nhận nhận hàng cho đơn ${id}:`, err);
      return false;
    }
  }
};
