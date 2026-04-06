import api from "@/api/api"
import type { RoleRequest, RoleResponse } from "@/types/dto"

export const roleService = {
  getAllRoles: async (): Promise<RoleResponse[]> => {
    const res = await api.get<RoleResponse[]>("/roles")
    return res.result || []
  },

  createRole: async (body: RoleRequest): Promise<RoleResponse> => {
    const res = await api.post<RoleResponse>("/roles", body)
    if (!res.result) throw new Error("Failed to create role")
    return res.result
  },

  deleteRoleByName: async (name: string): Promise<void> => {
    await api.del<void>(`/roles/${encodeURIComponent(name)}`)
  },
}

