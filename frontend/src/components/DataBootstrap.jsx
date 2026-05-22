import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchPublicProducts } from '@/redux/features/product/productSlice'
import { fetchCategories } from '@/redux/features/category/categorySlice'
import { fetchCartItems, mergeCart } from '@/redux/features/cart/cartSlice'
import { fetchAddresses } from '@/redux/features/address/addressSlice'
import { authService } from '@/utils/auth'
import { useAuth } from '@/hooks/useAuth'

// Component to bootstrap/fetch initial data for entire app
export default function DataBootstrap() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Always fetch categories and products once on app load
    dispatch(fetchCategories())
    dispatch(fetchPublicProducts())
  }, [dispatch])

  useEffect(() => {
    try {
      // Fetch user-specific data whenever auth state becomes authenticated
      if (isAuthenticated || authService.isAuthenticated()) {
        dispatch(mergeCart())
        dispatch(fetchAddresses())
      } else {
        dispatch(fetchCartItems())
      }
    } catch (err) {
      console.error('Error bootstrapping private data:', err)
    }
  }, [dispatch, isAuthenticated])

  return null
}

