import { useEffect, useState } from 'react'
import { MessageSquare, Store, Star, Clock, Users, Package, Calendar, MapPin } from 'lucide-react'
import { Image } from "@/utils/compat"
import { Link } from "@/utils/compat"
import { shopService, productService, warehouseService } from '@/services'
import { useAuth } from '@/hooks/useAuth'

const ShopInfo = ({ shopId, shopUsername }) => {
    const { isAuthenticated } = useAuth()
    const [shopInfo, setShopInfo] = useState(null)
    const [followerCount, setFollowerCount] = useState(0)
    const [productCount, setProductCount] = useState(0)
    const [warehouses, setWarehouses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!shopId && !shopUsername) return

        const fetchShopData = async () => {
            try {
                let shop = null
                if (shopId) {
                    shop = await shopService.getShopById(shopId)
                } else if (shopUsername) {
                    shop = await shopService.getShopById(shopUsername).catch(() => null)
                }

                if (shop) {
                    setShopInfo(shop)

                    const shopIdToUse = shop.id || shopId
                    const [followers, products, shopWarehouses] = await Promise.all([
                        shopService.getFollowerCount(shopIdToUse).catch(() => 0),
                        productService.getProductsByShop(shopIdToUse, 0, 1).catch(() => ({ totalElements: 0 })),
                        warehouseService.getShopWarehouses(shopIdToUse).catch(() => [])
                    ])
                    setFollowerCount(followers)
                    setProductCount(products?.totalElements ?? products?.page?.totalElements ?? products?.content?.length ?? 0)
                    setWarehouses(shopWarehouses || [])
                }
            } catch (err) {
                console.error('Failed to load shop info:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchShopData()
    }, [shopId, shopUsername])

    const handleChat = () => {
        if (!isAuthenticated) {
            return
        }
        if (!shopInfo?.user_id) return
        
        if (window.__chatWidget) {
            window.__chatWidget.startChatWith(shopInfo.user_id, shopInfo.name)
        }
    }

    if (loading) {
        return (
            <div className="mt-8 p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="animate-pulse flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!shopInfo) return null

    const createdDate = shopInfo.created_at 
        ? new Date(shopInfo.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        })
        : null

    const joinedText = createdDate ? `${createdDate}` : null

    return (
        <div className="mt-8 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            {/* Shop Header */}
            <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                {shopInfo.logo ? (
                    <Image 
                        src={shopInfo.logo} 
                        alt={shopInfo.name || 'Shop'} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" 
                        width={64} 
                        height={64} 
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center text-2xl font-bold border-2 border-green-200">
                        {shopInfo.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                )}

                {/* Shop Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-lg mb-1 truncate">
                        {shopInfo.name || 'Shop'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">
                        {shopInfo.description || 'No description'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleChat}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                            <MessageSquare size={16} />
                            Chat Now
                        </button>
                        {shopUsername && (
                            <Link
                                href={`/shop/${shopUsername}`}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                            >
                                <Store size={16} />
                                View Shop
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Shop Stats - Shopee style */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                {/* Reviews */}
                <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500" />
                    <div>
                        <p className="text-xs text-slate-500">Reviews</p>
                        <p className="text-sm font-medium text-slate-700">
                            {shopInfo.rating_count || 0}
                        </p>
                    </div>
                </div>

                {/* Response Rate */}
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" />
                    <div>
                        <p className="text-xs text-slate-500">Response Rate</p>
                        <p className="text-sm font-medium text-slate-700">
                            {shopInfo.response_rate ? `${shopInfo.response_rate}%` : '—'}
                        </p>
                    </div>
                </div>

                {/* Joined */}
                {joinedText && (
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-green-500" />
                        <div>
                            <p className="text-xs text-slate-500">Joined</p>
                            <p className="text-sm font-medium text-slate-700">
                                {joinedText}
                            </p>
                        </div>
                    </div>
                )}

                {/* Products */}
                <div className="flex items-center gap-2">
                    <Package size={16} className="text-purple-500" />
                    <div>
                        <p className="text-xs text-slate-500">Products</p>
                        <p className="text-sm font-medium text-slate-700">
                            {productCount}
                        </p>
                    </div>
                </div>

                {/* Response Time */}
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-500" />
                    <div>
                        <p className="text-xs text-slate-500">Response Time</p>
                        <p className="text-sm font-medium text-slate-700">
                            {shopInfo.response_time || 'Within hours'}
                        </p>
                    </div>
                </div>

                {/* Followers */}
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-pink-500" />
                    <div>
                        <p className="text-xs text-slate-500">Followers</p>
                        <p className="text-sm font-medium text-slate-700">
                            {followerCount > 0 ? `${(followerCount / 1000).toFixed(1)}k` : followerCount}
                        </p>
                    </div>
                </div>
            </div>

            {/* Warehouses Section */}
            {warehouses.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-3">Warehouses ({warehouses.length})</p>
                    <div className="space-y-2">
                        {warehouses.map((warehouse) => (
                            <div key={warehouse.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800">{warehouse.name}</p>
                                    {warehouse.fullAddress && (
                                        <p className="text-xs text-slate-500 mt-0.5">{warehouse.fullAddress}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ShopInfo
