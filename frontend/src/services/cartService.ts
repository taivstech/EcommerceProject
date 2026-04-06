import api from "@/api/api"
import type { CartItemResponse, AddToCartRequest, UpdateCartItemRequest } from "@/types/dto"

export const cartService = {

  getCartItems: async (): Promise<CartItemResponse[]> => {
    const res = await api.get<CartItemResponse[]>("/cart")
    return res.result || []
  },


  addToCart: async (data: AddToCartRequest): Promise<void> => {
    await api.post<void>("/cart/items", data)
  },


  updateCartItem: async (id: string, data: UpdateCartItemRequest): Promise<void> => {
    await api.put<void>(`/cart/items/${id}`, data)
  },


  removeCartItem: async (id: string): Promise<void> => {
    await api.del<void>(`/cart/items/${id}`)
  },

  clearCart: async (): Promise<void> => {
    await api.del<void>("/cart")
  },
}
