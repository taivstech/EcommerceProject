import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { addressService } from '@/services'
import type { UserAddressResponse, UserAddressRequest } from '@/types/dto'

export const fetchAddresses = createAsyncThunk('address/fetchAddresses', async () => {
    return await addressService.getAddresses()
})

export const createAddress = createAsyncThunk('address/createAddress', async (data: UserAddressRequest) => {
    await addressService.createAddress(data)
    return await addressService.getAddresses()
})

export const updateAddress = createAsyncThunk(
    'address/updateAddress',
    async ({ id, data }: { id: string; data: UserAddressRequest }) => {
        await addressService.updateAddress(id, data)
        return await addressService.getAddresses()
    }
)

export const deleteAddress = createAsyncThunk('address/deleteAddress', async (id: string) => {
    await addressService.deleteAddress(id)
    return await addressService.getAddresses()
})

export const setDefaultAddress = createAsyncThunk('address/setDefaultAddress', async (id: string) => {
    await addressService.setDefaultAddress(id)
    return await addressService.getAddresses()
})

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [] as UserAddressResponse[],
        loading: false,
        error: null as string | null,
    },
    reducers: {
        setAddresses: (state, action) => {
            state.list = action.payload || []
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAddresses.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchAddresses.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload || []
            })
            .addCase(fetchAddresses.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to load addresses'
            })
            .addCase(createAddress.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(createAddress.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload || []
            })
            .addCase(createAddress.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to create address'
            })
            .addCase(updateAddress.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateAddress.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload || []
            })
            .addCase(updateAddress.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to update address'
            })
            .addCase(deleteAddress.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(deleteAddress.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload || []
            })
            .addCase(deleteAddress.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to delete address'
            })
            .addCase(setDefaultAddress.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(setDefaultAddress.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload || []
            })
            .addCase(setDefaultAddress.rejected, (state, action) => {
                state.loading = false
                state.error = action.error?.message || 'Failed to set default address'
            })
    },
})

export const { setAddresses } = addressSlice.actions

export default addressSlice.reducer