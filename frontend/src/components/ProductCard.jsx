import { StarIcon, ShoppingCart } from 'lucide-react'
import { Image } from "@/utils/compat"
import { Link, useRouter } from "@/utils/compat"
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/redux/features/cart/cartSlice'
import { useAuth } from "@/hooks/useAuth"
import { behaviorService } from "@/services/behaviorService"

const ProductCard = ({ product, showSoldBadge = false, pageContext = "listing" }) => {
    const dispatch = useDispatch()
    const router = useRouter()
    const { isAuthenticated } = useAuth()
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'

    const handleCardClick = () => {
        behaviorService.track({
            eventType: "CLICK",
            productId: product?.id,
            pageContext,
        })
    }

    const ratingList = Array.isArray(product?.rating) ? product.rating : []
    const rating = ratingList.length
        ? Math.round(ratingList.reduce((acc, curr) => acc + (curr?.rating || 0), 0) / ratingList.length)
        : (product?.averageRating || product?.avgRating || product?.avg_rating || 0);

    const totalSold = product?.totalSold || product?.total_sold || 0

    let minPrice, maxPrice
    if (product?.minPrice != null || product?.maxPrice != null) {
        minPrice = product.minPrice != null ? Number(product.minPrice) : (product.maxPrice != null ? Number(product.maxPrice) : 0)
        maxPrice = product.maxPrice != null ? Number(product.maxPrice) : (product.minPrice != null ? Number(product.minPrice) : 0)
    } else if (product?.min_price != null || product?.max_price != null) {
        minPrice = product.min_price != null ? Number(product.min_price) : (product.max_price != null ? Number(product.max_price) : 0)
        maxPrice = product.max_price != null ? Number(product.max_price) : (product.min_price != null ? Number(product.min_price) : 0)
    } else {
        const variants = product?.variants || []
        const prices = variants.map(v => v.price).filter(p => p != null && p !== undefined)
        if (prices.length > 0) {
            minPrice = Math.min(...prices.map(p => Number(p)))
            maxPrice = Math.max(...prices.map(p => Number(p)))
        } else {
            minPrice = product?.price != null ? Number(product.price) : 0
            maxPrice = product?.price != null ? Number(product.price) : 0
        }
    }

    const formatPrice = (price) => {
        const num = Number(price || 0)
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const displayPrice = minPrice === maxPrice
        ? `${currency}${formatPrice(minPrice)}`
        : `${currency}${formatPrice(minPrice)} - ${currency}${formatPrice(maxPrice)}`

    const mainImage = product.images?.find(img => img.is_main)?.url || product.images?.[0]?.url || product.mainImage || "https://placehold.co/400x400?text=No+Image"

    const handleAddToCart = (e) => {
        e.preventDefault()
        dispatch(addToCart({ 
            productId: product.id, 
            quantity: 1, 
            variantId: product.variants?.[0]?.id || null,
            productInfo: product 
        }))
    }

    return (
        <Link href={`/product/${product.id}`} onClick={handleCardClick} className='group max-xl:mx-auto block w-full relative outline-none'>
            <div className='relative bg-white rounded-2xl p-3 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 border border-slate-100 h-full flex flex-col'>
                {/* Image Container */}
                <div className='relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-4'>
                    <Image
                        width={500}
                        height={500}
                        className='w-[85%] h-[85%] object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-sm'
                        src={mainImage}
                        alt={product.name}
                    />
                    
                    {/* Quick Action Overlay */}
                    <div className='absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4'>
                        <button 
                            onClick={handleAddToCart}
                            className='translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white/90 backdrop-blur-sm text-slate-800 hover:bg-green-600 hover:text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2'
                        >
                            <ShoppingCart size={16} />
                            Quick Add
                        </button>
                    </div>

                    {/* Badges */}
                    <div className='absolute top-2 left-2 flex flex-col gap-1.5'>
                        {product.isNew && (
                            <span className='bg-blue-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm tracking-wide uppercase'>
                                New
                            </span>
                        )}
                        {minPrice < maxPrice && (
                            <span className='bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm tracking-wide uppercase'>
                                Sale
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Container */}
                <div className='flex flex-col flex-1 px-1'>
                    <div className='flex items-start justify-between gap-2 mb-1'>
                        <p className='text-sm font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-green-600 transition-colors'>
                            {product.name}
                        </p>
                    </div>

                    <div className='mt-auto pt-3'>
                        {/* Rating & Sold */}
                        <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-xs font-medium text-amber-600'>
                                <StarIcon size={12} className='fill-amber-500 text-amber-500' />
                                <span>{rating > 0 ? rating.toFixed(1) : 'No rating'}</span>
                            </div>
                            
                            {showSoldBadge && totalSold > 0 && (
                                <span className='text-[11px] text-slate-500 font-medium'>
                                    {totalSold >= 1000 ? `${(totalSold / 1000).toFixed(1)}k` : totalSold} sold
                                </span>
                            )}
                        </div>

                        {/* Price */}
                        <div className='flex items-center gap-2'>
                            <p className='text-lg font-bold text-slate-900 font-num tracking-tight'>
                                {displayPrice}
                            </p>
                            {minPrice < maxPrice && (
                                <span className='text-xs text-slate-400 line-through font-num'>
                                    {currency}{formatPrice(maxPrice)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default ProductCard
