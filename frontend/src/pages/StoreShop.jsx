import ProductCard from "@/components/ProductCard"
import { useParams } from "@/utils/compat"
import { useEffect, useState } from "react"
import { MapPinIcon, MessageSquare, Users, Package, Star, Calendar } from "lucide-react"
import Loading from "@/components/ui/Loading"
import { Image } from "@/utils/compat"
import { shopService, productService } from "@/services"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "react-hot-toast"

export default function StoreShop() {

    const { username } = useParams()
    const { isAuthenticated } = useAuth()
    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followerCount, setFollowerCount] = useState(0)

    const fetchStoreData = async () => {
        try {
            const shopId = username
            
            const [shopData, productsData] = await Promise.all([
                shopService.getShopById(shopId).catch(() => null),
                productService.getProductsByShop(shopId, 0, 50).catch(() => ({ content: [] }))
            ])

            setStoreInfo(shopData)
            setProducts(productsData.content || [])

            if (shopData && isAuthenticated) {
                const [following, count] = await Promise.all([
                    shopService.isFollowing(shopId).catch(() => false),
                    shopService.getFollowerCount(shopId).catch(() => 0),
                ])
                setIsFollowing(following)
                setFollowerCount(count)
            } else if (shopData) {
                const count = await shopService.getFollowerCount(shopId).catch(() => 0)
                setFollowerCount(count)
            }
        } catch (err) {
            console.error('Failed to load shop data:', err)
            toast.error('Failed to load shop')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStoreData()
    }, [])

    const handleFollow = async () => {
        if (!isAuthenticated) return toast.error('Please login to follow')
        try {
            if (isFollowing) {
                await shopService.unfollowShop(username)
                setIsFollowing(false)
                setFollowerCount(c => Math.max(0, c - 1))
                toast.success('Unfollowed')
            } else {
                await shopService.followShop(username)
                setIsFollowing(true)
                setFollowerCount(c => c + 1)
                toast.success('Following!')
            }
        } catch (err) {
            toast.error('Failed to update follow status')
        }
    }

    const handleChat = async () => {
        if (!isAuthenticated) return toast.error('Please login to chat')
        if (!storeInfo?.user_id) return toast.error('Cannot chat with this shop')
        if (window.__chatWidget) {
            window.__chatWidget.startChatWith(storeInfo.user_id, storeInfo.name)
        }
    }

    const createdDate = storeInfo?.created_at 
        ? new Date(storeInfo.created_at).toLocaleDateString('vi-VN')
        : null

    return !loading ? (
        <div className="min-h-[70vh] mx-6">

            {storeInfo && (
                <div className="max-w-7xl mx-auto mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        {/* Left: Shop profile */}
                        <div className="p-6 md:p-8 flex flex-col items-center md:items-start gap-4 md:border-r border-slate-100 md:w-[340px]">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl font-bold border-2 border-green-200">
                                    {storeInfo.name?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800">{storeInfo.name}</h1>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {storeInfo.status === 'APPROVED' ? '🟢 Active' : storeInfo.status}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={handleFollow}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition ${
                                        isFollowing
                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                                >
                                    <Users size={16} />
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button
                                    onClick={handleChat}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                                >
                                    <MessageSquare size={16} />
                                    Chat
                                </button>
                            </div>
                        </div>

                        {/* Right: Shop stats */}
                        <div className="flex-1 p-6 md:p-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <Package size={18} className="text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Products</p>
                                    <p className="text-sm font-semibold text-green-600">{products.length}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users size={18} className="text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Followers</p>
                                    <p className="text-sm font-semibold text-green-600">
                                        {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}k` : followerCount}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Star size={18} className="text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Rating</p>
                                    <p className="text-sm font-semibold text-green-600">4.8</p>
                                </div>
                            </div>
                            {storeInfo.address && (
                                <div className="flex items-center gap-3 col-span-2">
                                    <MapPinIcon size={18} className="text-slate-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Address</p>
                                        <p className="text-sm text-slate-700">{storeInfo.address}</p>
                                    </div>
                                </div>
                            )}
                            {createdDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Joined</p>
                                        <p className="text-sm text-slate-700">{createdDate}</p>
                                    </div>
                                </div>
                            )}
                            {storeInfo.description && (
                                <div className="col-span-full">
                                    <p className="text-xs text-slate-500 mb-1">Description</p>
                                    <p className="text-sm text-slate-600">{storeInfo.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Products */}
            <div className="max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">Shop <span className="text-slate-800 font-medium">Products</span></h1>
                {products.length > 0 ? (
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mx-auto">
                        {products.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                ) : (
                    <div className="mt-10 text-center text-slate-400">
                        <Package size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No products yet</p>
                    </div>
                )}
            </div>
        </div>
    ) : <Loading />
}
