import { api } from './api';

export const paymentService = {
  createPaymentUrl: async (paymentMethod: string, orderId: string): Promise<string> => {
    try {
      const res = await api.post<string>(`/payment/create-payment-url/${paymentMethod.toUpperCase()}/${orderId}`);
      return res.result || '';
    } catch (err) {
      console.error(`Lỗi tạo link thanh toán ${paymentMethod}:`, err);
      return '';
    }
  }
};
