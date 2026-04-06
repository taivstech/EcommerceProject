import { useEffect, useState } from "react"
import Loading from "../ui/Loading"
import { Link } from "@/utils/compat"
import { ArrowRightIcon } from "lucide-react"
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"
import { useAuth } from "@/hooks/useAuth"
import { shopService } from "@/services"

const StoreLayout = ({ children }) => {

    const { user, isAuthenticated, loading: authLoading } = useAuth()
    const [isSeller, setIsSeller] = useState(false)
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState(null)

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated || !user) {
            console.warn('[StoreLayout] Not authenticated')
            setIsSeller(false)
            setLoading(false)
            return
        }
        const roles = user.roles || []
        const hasSeller = roles.some(r => ['SELLER', 'ADMIN'].includes((r?.name || '').toUpperCase()))
        if (!hasSeller) {
            console.warn('[StoreLayout] User lacks SELLER/ADMIN role. Roles:', roles.map(r => r?.name))
            setIsSeller(false)
            setLoading(false)
            return
        }
        // Load real shop info
        shopService.getMyShop()
            .then((shop) => {
                if (shop && shop.status === 'APPROVED') {
                    setStoreInfo(shop)
                    setIsSeller(true)
                } else {
                    console.warn('[StoreLayout] Shop not approved. Status:', shop?.status)
                    setIsSeller(false)
                }
            })
            .catch((err) => {
                console.warn('[StoreLayout] Failed to load shop:', err?.message || err)
                setIsSeller(false)
            })
            .finally(() => setLoading(false))
    }, [user, isAuthenticated, authLoading])

    return loading ? (
        <Loading />
    ) : isSeller ? (
        <div className="flex flex-col h-screen bg-gray-50">
            <SellerNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <SellerSidebar storeInfo={storeInfo} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll bg-gray-50">
                    {children}
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">You are not authorized to access this page</h1>
            <Link href="/" className="bg-slate-700 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full">
                Go to home <ArrowRightIcon size={18} />
            </Link>
        </div>
    )
}

export default StoreLayout