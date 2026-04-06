import api from "@/api/api"
import type { CategoryResponse, CategoryRequest } from "@/types/dto"

export const categoryService = {

  getAllCategories: async (): Promise<CategoryResponse[]> => {
    const res = await api.get<CategoryResponse[]>("/categories")
    return res.result || []
  },


  getCategoryById: async (id: string): Promise<CategoryResponse | null> => {
    const res = await api.get<CategoryResponse>(`/categories/${id}`)
    return res.result || null
  },


  createCategory: async (data: CategoryRequest): Promise<CategoryResponse> => {
    const res = await api.post<CategoryResponse>("/categories", data)
    if (!res.result) throw new Error("Failed to create category")
    return res.result
  },


  updateCategory: async (id: string, data: CategoryRequest): Promise<CategoryResponse> => {
    const res = await api.put<CategoryResponse>(`/categories/${id}`, data)
    if (!res.result) throw new Error("Failed to update category")
    return res.result
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.del<void>(`/categories/${id}`)
  },
}
