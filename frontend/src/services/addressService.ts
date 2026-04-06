import api from "@/api/api"
import type { UserAddressResponse, UserAddressRequest } from "@/types/dto"

export const addressService = {
  getAddresses: async (): Promise<UserAddressResponse[]> => {
    const res = await api.get<UserAddressResponse[]>("/users/me/addresses")
    return res.result || []
  },

  getAddressById: async (id: string): Promise<UserAddressResponse | null> => {
    const res = await api.get<UserAddressResponse>(`/users/me/addresses/${id}`)
    return res.result || null
  },

  createAddress: async (data: UserAddressRequest): Promise<void> => {
    await api.post<void>("/users/me/addresses", data)
  },


  updateAddress: async (id: string, data: UserAddressRequest): Promise<void> => {
    await api.put<void>(`/users/me/addresses/${id}`, data)
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.del<void>(`/users/me/addresses/${id}`)
  },


  setDefaultAddress: async (id: string): Promise<void> => {
    await api.patch<void>(`/users/me/addresses/${id}/default`)
  },
}
