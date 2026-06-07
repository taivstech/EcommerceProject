import { api } from './api';

export interface ShippingAddressResponse {
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
}

export interface OrderItemResponse {
  id: string;
  product_variant_id?: string;
  quantity: number;
  price: number;
  product_id: string;
  product_name: string;
  product_image?: string;
  variant_name?: string;
  variant_sku?: string;
  has_review?: boolean;
}

export interface OrderShopGroupResponse {
  id: string;
  shop_id?: string;
  subtotal: number;
  shipping_fee: number;
  total_discount: number;
  total: number;
  shipment?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  items: OrderItemResponse[];
}

export interface OrderResponse {
  id: string;
  status: 'PENDING' | 'AWAITING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
  payment: string;
  is_paid: boolean;
  note?: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount?: number;
  shop_discount_amount?: number;
  shipping_discount_amount?: number;
  total_discount: number;
  total: number;
  created_at: string;
  shipping_address?: ShippingAddressResponse;
  shop_groups: OrderShopGroupResponse[];
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
