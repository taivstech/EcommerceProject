import { StarIcon } from 'lucide-react'
import { Image } from "@/utils/compat"
import { Link } from "@/utils/compat"
import React from 'react'
import NumberBadge from './ui/NumberBadge'

const ProductCard = ({ product, showSoldBadge = true }) => {

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'

    // calculate the average rating of the product
    const ratingList = Array.isArray(product?.rating) ? product.rating : []
    const rating = ratingList.length
        ? Math.round(ratingList.reduce((acc, curr) => acc + (curr?.rating || 0), 0) / ratingList.length)
        : 0;

    // total sold
    const totalSold = product?.totalSold || product?.total_sold || 0

    // price range - check both snake_case (API) and camelCase (normalized) formats
    let minPrice, maxPrice
    
    // Check camelCase first (normalized products), then snake_case (raw API), then variants
    if (product?.minPrice != null || product?.maxPrice != null) {
        // Use camelCase (normalized from productSlice)
        // Handle null values - if one is null, use the other, or 0
        minPrice = product.minPrice != null ? Number(product.minPrice) : (product.maxPrice != null ? Number(product.maxPrice) : 0)
        maxPrice = product.maxPrice != null ? Number(product.maxPrice) : (product.minPrice != null ? Number(product.minPrice) : 0)
    } else if (product?.min_price != null || product?.max_price != null) {
        // Use snake_case (raw API response)
        minPrice = product.min_price != null ? Number(product.min_price) : (product.max_price != null ? Number(product.max_price) : 0)
        maxPrice = product.max_price != null ? Number(product.max_price) : (product.min_price != null ? Number(product.min_price) : 0)
    } else {
        // Fallback: calculate from variants (product detail page)
        const variants = product?.variants || []
        const prices = variants.map(v => v.price).filter(p => p != null && p !== undefined)
        if (prices.length > 0) {
            minPrice = Math.min(...prices.map(p => Number(p)))
            maxPrice = Math.max(...prices.map(p => Number(p)))
        } else {
            // Last fallback: single price field
            minPrice = product?.price != null ? Number(product.price) : 0
            maxPrice = product?.price != null ? Number(product.price) : 0
        }
    }

    // Format price with comma separator for readability
    const formatPrice = (price) => {
        const num = Number(price || 0)
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const displayPrice = minPrice === maxPrice
        ? `${currency}${formatPrice(minPrice)}`
        : `${currency}${formatPrice(minPrice)} - ${currency}${formatPrice(maxPrice)}`

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto'>
            <div className='bg-[#F5F5F5] h-48 sm:w-68 sm:h-72 rounded-lg flex items-center justify-center overflow-hidden relative'>
                <Image
                    width={500}
                    height={500}
                    className='max-h-36 sm:max-h-48 w-auto group-hover:scale-115 transition duration-300'
                    src={product.images?.find(img => img.is_main)?.url || product.images?.[0]?.url || "https://placehold.co/400x400?text=No+Image"}
                    alt={product.name}
                />
                {/* Total sold badge */}
                {showSoldBadge && totalSold > 0 && (
                    <div className="absolute bottom-2 right-2">
                        <div className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                            {totalSold >= 1000 ? `${(totalSold / 1000).toFixed(1)}k` : totalSold} sold
                        </div>
                    </div>
                )}
            </div>
            <div className='text-sm text-slate-800 pt-2 max-w-68'>
                <p className='line-clamp-2'>{product.name}</p>
                <div className='flex items-center gap-2 mt-1'>
                    <div className='flex'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={12} className='text-transparent' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                    </div>
                </div>
                <p className='text-slate-800 font-semibold mt-1 font-num'>{displayPrice}</p>
            </div>
        </Link>
    )
}

export default ProductCard
