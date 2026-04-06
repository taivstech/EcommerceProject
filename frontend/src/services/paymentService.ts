import api from "@/api/api"

export const paymentService = {

  createPaymentUrl: async (paymentMethod: string, orderId: string): Promise<string> => {
    const res = await api.post<string>(`/payment/create-payment-url/${paymentMethod.toUpperCase()}/${orderId}`)
    return res.result || ""
  },

  getAvailablePaymentMethods: async (): Promise<string[]> => {
    const res = await api.get<string[]>(`/payment/methods`)
    return res.result || []
  },

  handleCallback: async (paymentMethod: string, params: Record<string, string>): Promise<{ success: boolean; message: string }> => {
    const qs = new URLSearchParams(params).toString()
    const res = await api.get<string>(`/payment/callback/${paymentMethod.toUpperCase()}?${qs}`)
    return {
      success: res.code === 1000 && res.result === 'SUCCESS',
      message: res.message || 'Payment processed'
    }
  },

  createVnpayPaymentUrl: async (orderId: string): Promise<string> => {
    return paymentService.createPaymentUrl('VNPAY', orderId)
  },

  vnpayCallback: async (params: Record<string, string>): Promise<string> => {
    const qs = new URLSearchParams(params).toString()
    const res = await api.get<string>(`/payment/callback/VNPAY?${qs}`)
    return res.result || ""
  },
}

