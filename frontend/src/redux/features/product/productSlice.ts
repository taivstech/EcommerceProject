import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { productService } from '@/services'
import type { ProductResponse } from '@/types/dto'

export function normalizeProduct(p: ProductResponse) {
    const images = Array.isArray(p?.images)
        ? p.images
              .map((img: any) => {
                  if (!img) return null
                  if (typeof img === 'string') return { url: img, is_main: false }
                  if (typeof img?.url === 'string') return { url: img.url, is_main: !!img.is_main }
                  return null
              })
              .filter(Boolean)
        : []

    const variants = Array.isArray(p?.variants)
        ? p.variants.map((v: any) => ({
              id: v.id,
              name: v.name || null,
              sku: v.sku || null,
              price: v.price,
              stock: v.stock,
              soldCount: v.sold_count ?? 0,
              status: v.status,
              imageUrl: v.imageUrl || v.image_url || null,
              detailAttributes: Array.isArray(v.detail_attributes) ? v.detail_attributes : [],
          }))
        : []

    const attributes = Array.isArray(p?.attributes)
        ? p.attributes.map((a: any) => ({
              id: a.id,
              name: a.name,
              sortOrder: a.sort_order ?? 0,
              options: Array.isArray(a.options)
                  ? a.options.map((o: any) => ({
                        id: o.id,
                        name: o.name,
                        imageUrl: o.image_url || null,
                        sortOrder: o.sort_order ?? 0,
                    }))
                  : [],
          }))
        : []

    let primaryPrice = 0
    if (typeof p?.price !== 'undefined' && p?.price !== null) {
        primaryPrice = Number(p.price)
    } else if (typeof p?.min_price !== 'undefined' && p?.min_price !== null && p.min_price > 0) {
        primaryPrice = Number(p.min_price)
    } else if (typeof p?.max_price !== 'undefined' && p?.max_price !== null && p.max_price > 0) {
        primaryPrice = Number(p.max_price)
    }

    // Derive the main image: prefer product-level images, fallback to first variant image
    // This is critical for seeded Amazon data which only has images in product_variants
    const firstVariantImageUrl = variants.find((v: any) => v.imageUrl)?.imageUrl || null
    const normalizedImages = images.length
        ? images
        : firstVariantImageUrl
            ? [{ url: firstVariantImageUrl, is_main: true }]
            : []

    return {
        id: p?.id,
        name: p?.name,
        brand: p?.brand || null,
        description: p?.description,
        price: Number.isFinite(primaryPrice) ? primaryPrice : 0,
        minPrice: typeof p?.min_price !== 'undefined' && p?.min_price !== null ? Number(p.min_price) : null,
        maxPrice: typeof p?.max_price !== 'undefined' && p?.max_price !== null ? Number(p.max_price) : null,

        shopId: p?.shop_id,
        shopName: p?.shop_name || null,
        categoryId: p?.category_id,
        createdAt: p?.created_at,
        totalSold: p?.total_sold ?? 0,

        images: normalizedImages,

        variants,

        attributes,

        rating: [],
        mrp: null,
        store: null,
        averageRating: p?.avg_rating != null ? Number(p.avg_rating) : ((p as any)?.avgRating != null ? Number((p as any).avgRating) : null),
        ratingCount: p?.rating_count != null ? Number(p.rating_count) : ((p as any)?.ratingCount != null ? Number((p as any).ratingCount) : null),
    }
}

export const fetchPublicProducts = createAsyncThunk('product/fetchPublicProducts', async (_, { rejectWithValue }) => {
    try {
        const page = await productService.getPublicProducts()
        return (page.content || []).map(normalizeProduct)
    } catch (error: any) {
        if (error?.message?.includes('Network error') || error?.message === 'Failed to fetch') {
            console.warn('Backend not available, returning empty products list')
            return []
        }
        return rejectWithValue(error?.message || 'Failed to load products')
    }
})

export const fetchNewestProducts = createAsyncThunk('product/fetchNewestProducts', async (limit: number = 10) => {
    const list = await productService.getNewestProducts(limit)
    return list.map(normalizeProduct)
})

export const fetchSellerProducts = createAsyncThunk('product/fetchSellerProducts', async () => {
    const page = await productService.getSellerProducts()
    return (page.content || []).map(normalizeProduct)
})

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [] as any[],
        loading: false,
        error: null as string | null,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
        },
        clearProduct: (state) => {
            state.list = []
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPublicProducts.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchPublicProducts.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload || []
            })
            .addCase(fetchPublicProducts.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to load products'
                state.list = []
            })
            .addCase(fetchNewestProducts.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchNewestProducts.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload || []
            })
            .addCase(fetchNewestProducts.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to load newest products'
            })
            .addCase(fetchSellerProducts.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchSellerProducts.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload || []
            })
            .addCase(fetchSellerProducts.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to load seller products'
            })
    },
})

export const { setProduct, clearProduct } = productSlice.actions

export default productSlice.reducer
