import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { categoryService } from "@/services"
import type { CategoryResponse } from "@/types/dto"

export const fetchCategories = createAsyncThunk("category/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    return await categoryService.getAllCategories()
  } catch (error: any) {
    // If it's a network error, return empty array instead of throwing
    if (error?.message?.includes('Network error') || error?.message === 'Failed to fetch') {
      console.warn('Backend not available, returning empty categories list')
      return []
    }
    return rejectWithValue(error?.message || 'Failed to load categories')
  }
})

const categorySlice = createSlice({
  name: "category",
  initialState: {
    list: [] as CategoryResponse[],
    loading: false,
    error: null as string | null,
  },
  reducers: {
    setCategories: (state, action) => {
      state.list = action.payload || []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || "Failed to load categories"
        state.list = []
      })
  },
})

export const { setCategories } = categorySlice.actions
export default categorySlice.reducer

