import React, { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import Title from './ui/Title'
import { productService } from '@/services'
import { normalizeProduct } from '@/redux/features/product/productSlice'
import { ArrowRight } from 'lucide-react'
import { Link } from "@/utils/compat"
import { useAuth } from '@/hooks/useAuth'

const MoreProducts = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const { isAuthenticated } = useAuth()
    const displayLimit = 30 // Hiển thị 30 products

    useEffect(() => {
        const loadProducts = async () => {
            if (loading) return
            setLoading(true)
            try {
                const response = await productService.getPublicProducts(0, displayLimit)
                const newProducts = (response.content || []).map(normalizeProduct)
                setProducts(newProducts)
            } catch (error) {
                console.error('Failed to load products:', error)
            } finally {
                setLoading(false)
            }
        }
        loadProducts()
    }, [])

    if (products.length === 0 && !loading) {
        return null
    }

    return (
        <div className='px-6 my-16 max-w-7xl mx-auto'>
            <Title
                title='More Products'
                description={`Showing ${products.length} products`}
                href='/shop'
                actionLabel='See more products and stores'
            />

            {products.length > 0 && (
                <div className='mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6'>
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} showSoldBadge={false} />
                    ))}
                </div>
            )}

            {/* Login to shopping button */}
            {!isAuthenticated && (
                <div className='mt-12 flex justify-center'>
                    <Link
                        href='/login'
                        className='flex items-center gap-2 px-8 py-3.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-all font-medium shadow-sm hover:shadow-md active:scale-95'
                    >
                        <span>Login to shopping</span>
                        <ArrowRight size={18} />
                    </Link>
                </div>
            )}
        </div>
    )
}

export default MoreProducts
