import { ArrowRight, StarIcon } from "lucide-react"
import { Image } from "@/utils/compat"
import { Link } from "@/utils/compat"
import { useEffect, useState } from "react"
import { productService } from "@/services"
import ShopInfo from "./ShopInfo"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Description')
    const [reviews, setReviews] = useState([])
    const [ratingStats, setRatingStats] = useState(null)
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const loadReviews = () => {
        if (!product?.id) return
        setLoadingReviews(true)
        Promise.all([
            productService.getProductReviews(product.id),
            productService.getProductRatingStats(product.id),
        ]).then(([reviewsData, statsData]) => {
            console.log('Loaded reviews:', reviewsData?.length || 0, 'for product:', product.id)
            console.log('Rating stats:', statsData)
            setReviews(reviewsData || [])
            setRatingStats(statsData)
        }).catch(err => {
            console.error('Failed to load reviews:', err)
        }).finally(() => setLoadingReviews(false))
    }

    useEffect(() => {
        loadReviews()
    }, [product?.id, refreshKey])

    // Listen for review submission events
    useEffect(() => {
        const handleReviewSubmitted = () => {
            console.log('Review submitted event received, refreshing reviews...')
            // Small delay to ensure backend has processed the review
            setTimeout(() => {
                setRefreshKey(prev => prev + 1)
            }, 500)
        }
        
        window.addEventListener('reviewSubmitted', handleReviewSubmitted)
        return () => {
            window.removeEventListener('reviewSubmitted', handleReviewSubmitted)
        }
    }, [])

    const averageRating = ratingStats?.average_rating || 0
    const totalReviews = ratingStats?.total_reviews || reviews.length || 0

    return (
        <div className="my-18 text-sm text-slate-600">
            {/* Shop Info - Shopee style */}
            {(product?.shopId || product?.store?.username) && (
                <ShopInfo 
                    shopId={product?.shopId} 
                    shopUsername={product?.store?.username || product?.shopId}
                />
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                <button
                    className={`px-3 py-2 font-medium ${selectedTab === 'Description' ? 'border-b-[1.5px] font-semibold text-slate-800' : 'text-slate-400'}`}
                    onClick={() => setSelectedTab('Description')}
                >
                    Description
                </button>
                <button
                    className={`px-3 py-2 font-medium ${selectedTab === 'Reviews' ? 'border-b-[1.5px] font-semibold text-slate-800' : 'text-slate-400'}`}
                    onClick={() => setSelectedTab('Reviews')}
                >
                    Reviews ({totalReviews})
                </button>
            </div>

            {/* Description */}
            {selectedTab === "Description" && (
                <p className="max-w-xl whitespace-pre-line">{product.description}</p>
            )}

            {/* Reviews */}
            {selectedTab === "Reviews" && (
                <div className="mt-4">
                    {/* Rating Summary */}
                    {ratingStats && totalReviews > 0 && (
                        <div className="flex items-center gap-6 mb-8 p-5 bg-slate-50 rounded-xl max-w-xl">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-slate-800">{averageRating.toFixed(1)}</p>
                                <div className="flex items-center mt-1">
                                    {Array(5).fill('').map((_, i) => (
                                        <StarIcon key={i} size={16} className='text-transparent' fill={averageRating >= i + 1 ? "#00C950" : "#D1D5DB"} />
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{totalReviews} reviews</p>
                            </div>
                        </div>
                    )}

                    {/* Review List */}
                    {loadingReviews ? (
                        <p className="text-slate-400">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <p className="text-slate-400">No reviews yet.</p>
                    ) : (
                        <div className="flex flex-col gap-6 max-w-2xl">
                            {reviews.map((review) => (
                                <div key={review.id} className="flex gap-4 pb-6 border-b border-slate-100">
                                    {review.user_avatar ? (
                                        <Image src={review.user_avatar} alt="" className="size-10 rounded-full object-cover shrink-0" width={40} height={40} />
                                    ) : (
                                        <div className="size-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                            {review.user_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800">{review.user_name || 'Anonymous'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex">
                                                {Array(5).fill('').map((_, i) => (
                                                    <StarIcon key={i} size={14} className='text-transparent' fill={review.rating >= i + 1 ? "#00C950" : "#D1D5DB"} />
                                                ))}
                                            </div>
                                            {review.variant_name && (
                                                <span className="text-xs text-slate-400">| Variant: {review.variant_name}</span>
                                            )}
                                        </div>
                                        {review.comment && (
                                            <p className="mt-2 text-slate-600">{review.comment}</p>
                                        )}
                                        <p className="mt-2 text-xs text-slate-400">
                                            {review.created_at ? new Date(review.created_at).toLocaleDateString('vi-VN') : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ProductDescription
