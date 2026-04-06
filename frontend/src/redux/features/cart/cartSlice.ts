import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { cartService } from '@/services'
import type { CartItemResponse, AddToCartRequest, UpdateCartItemRequest } from '@/types/dto'


export const fetchCartItems = createAsyncThunk('cart/fetchCartItems', async () => {
    return await cartService.getCartItems()
})


export const addToCart = createAsyncThunk('cart/addToCart', async (data: AddToCartRequest) => {
    await cartService.addToCart(data)

    return await cartService.getCartItems()
})


export const updateCartItem = createAsyncThunk(
    'cart/updateCartItem',
    async ({ id, quantity }: { id: string; quantity: number }) => {
        await cartService.updateCartItem(id, { quantity })
        return await cartService.getCartItems()
    }
)

export const removeCartItem = createAsyncThunk('cart/removeCartItem', async (id: string) => {
    await cartService.removeCartItem(id)
    return await cartService.getCartItems()
})


export const clearCart = createAsyncThunk('cart/clearCart', async () => {
    await cartService.clearCart()
    return []
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
    },
})

export const { setCartItems } = cartSlice.actions

export default cartSlice.reducer
