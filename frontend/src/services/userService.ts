import api from "@/api/api"
import type {
  UserResponse,
  UserCreationRequest,
  UserCouponResponse,
  UpgradeSellerRequest,
} from "@/types/dto"

export const userService = {

  register: async (body: UserCreationRequest): Promise<UserResponse> => {
    const res = await api.post<UserResponse>("/users/registration", body)
    if (!res.result) throw new Error("Registration failed")
    return res.result
  },


  getCurrentUser: async (): Promise<UserResponse | null> => {
    const res = await api.get<UserResponse>("/users/me")
    return res.result || null
  },


  updateProfile: async (
    data: {
      username?: string
      full_name?: string
      phone?: string
      dob?: string
    },
    avatarFile?: File | null
  ): Promise<UserResponse> => {
    if (avatarFile) {
      const formData = new FormData()
      formData.append(
        "profile",
        new Blob([JSON.stringify(data)], { type: "application/json" })
      )
      formData.append("file", avatarFile)
      const res = await api.put<UserResponse>("/users/me", formData)
      if (!res.result) throw new Error("Failed to update profile")
      return res.result
    }

    // JSON-only (no avatar change)
    const res = await api.put<UserResponse>("/users/me", data)
    if (!res.result) throw new Error("Failed to update profile")
    return res.result
  },


  upgradeToSeller: async (body?: UpgradeSellerRequest): Promise<string> => {
    const res = await api.post<string>("/users/me/upgrade-to-seller", body)
    return res.result || ""
  },


  getMyCoupons: async (): Promise<UserCouponResponse[]> => {
    const res = await api.get<UserCouponResponse[]>("/users/me/coupons")
    return res.result || []
  },
}
