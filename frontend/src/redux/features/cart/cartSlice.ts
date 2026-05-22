import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { cartService } from '@/services'
import { authService } from '@/utils/auth'
import type { CartItemResponse, AddToCartRequest } from '@/types/dto'

const getGuestCart = (): CartItemResponse[] => {
    if (typeof window === 'undefined') return []
    try {
        const cartStr = localStorage.getItem('guest_cart')
        return cartStr ? JSON.parse(cartStr) : []
    } catch {
        return []
    }
}

const saveGuestCart = (cart: CartItemResponse[]) => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem('guest_cart', JSON.stringify(cart))
    } catch (e) {
        console.error('Failed to save guest cart to localStorage:', e)
    }
}

export const fetchCartItems = createAsyncThunk('cart/fetchCartItems', async () => {
    if (authService.isAuthenticated()) {
        return await cartService.getCartItems()
    } else {
        return getGuestCart()
    }
})

export const addToCart = createAsyncThunk('cart/addToCart', async (data: any) => {
    const variantId = data.product_variant_id || data.variantId
    const quantity = data.quantity || 1
    const productId = data.product_id || data.productId
    const shopId = data.shop_id || data.shopId || (data.productInfo?.shop_id || data.productInfo?.shopId)

    if (authService.isAuthenticated()) {
        await cartService.addToCart({ product_variant_id: variantId, quantity })
        return await cartService.getCartItems()
    } else {
        const cart = getGuestCart()
        const existingIndex = cart.findIndex(item => item.product_variant_id === variantId)
        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity
        } else {
            cart.push({
                id: `guest_${variantId}_${Date.now()}`,
                quantity,
                added_at: new Date().toISOString(),
                product_variant_id: variantId,
                product_id: productId || '',
                shop_id: shopId || '',
            })
        }
        saveGuestCart(cart)
        return cart
    }
})

export const updateCartItem = createAsyncThunk(
    'cart/updateCartItem',
    async ({ id, quantity }: { id: string; quantity: number }) => {
        if (authService.isAuthenticated()) {
            await cartService.updateCartItem(id, { quantity })
            return await cartService.getCartItems()
        } else {
            const cart = getGuestCart()
            const item = cart.find(i => i.id === id)
            if (item) {
                item.quantity = quantity
                saveGuestCart(cart)
            }
            return cart
        }
    }
)

export const removeCartItem = createAsyncThunk('cart/removeCartItem', async (id: string) => {
    if (authService.isAuthenticated()) {
        await cartService.removeCartItem(id)
        return await cartService.getCartItems()
    } else {
        const cart = getGuestCart()
        const filtered = cart.filter(i => i.id !== id)
        saveGuestCart(filtered)
        return filtered
    }
})

export const clearCart = createAsyncThunk('cart/clearCart', async () => {
    if (authService.isAuthenticated()) {
        await cartService.clearCart()
        return []
    } else {
        saveGuestCart([])
        return []
    }
})

export const mergeCart = createAsyncThunk('cart/mergeCart', async () => {
    const guestCart = getGuestCart()
    if (guestCart.length > 0 && authService.isAuthenticated()) {
        try {
            for (const item of guestCart) {
                await cartService.addToCart({
                    product_variant_id: item.product_variant_id,
                    quantity: item.quantity
                })
            }
        } catch (e) {
            console.error('Failed to merge guest cart to backend:', e)
        } finally {
            saveGuestCart([])
        }
    }
    return await cartService.getCartItems()
})

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [] as CartItemResponse[],
        loading: false,
        error: null as string | null,
    },
    reducers: {
        setCartItems: (state, action) => {
            state.items = action.payload || []
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCartItems.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchCartItems.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload || []
            })
            .addCase(fetchCartItems.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to load cart'
            })
            .addCase(addToCart.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload || []
            })
            .addCase(addToCart.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to add to cart'
            })
            .addCase(updateCartItem.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateCartItem.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload || []
            })
            .addCase(updateCartItem.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to update cart item'
            })
            .addCase(removeCartItem.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(removeCartItem.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload || []
            })
            .addCase(removeCartItem.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to remove cart item'
            })
            .addCase(clearCart.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(clearCart.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload || []
            })
            .addCase(clearCart.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to clear cart'
            })
            .addCase(mergeCart.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(mergeCart.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload || []
            })
            .addCase(mergeCart.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to merge cart'
            })
    },
})

export const { setCartItems } = cartSlice.actions

export default cartSlice.reducer

