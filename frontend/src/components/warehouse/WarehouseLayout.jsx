import { useEffect, useState } from "react"
import Loading from "../ui/Loading"
import { Link } from "@/utils/compat"
import { ArrowRightIcon } from "lucide-react"
import WarehouseNavbar from "./WarehouseNavbar"
import WarehouseSidebar from "./WarehouseSidebar"
import { useAuth } from "@/hooks/useAuth"
import { warehouseService } from "@/services/warehouseService"

const ALLOWED_ROLES = ['WAREHOUSE_EMPLOYEE', 'WAREHOUSE_MANAGER', 'SELLER', 'ADMIN']

const WarehouseLayout = ({ children }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth()
    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [warehouses, setWarehouses] = useState([])

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated || !user) {
            setAuthorized(false)
            setLoading(false)
            return
        }
        const roles = user.roles || []
        const hasAccess = roles.some(r => ALLOWED_ROLES.includes((r?.name || '').toUpperCase()))
        if (!hasAccess) {
            setAuthorized(false)
            setLoading(false)
            return
        }
        // Load assigned warehouses
        warehouseService.getAssignedWarehouses()
            .then(whs => {
                setWarehouses(whs || [])
                setAuthorized(true)
            })
            .catch(() => setAuthorized(true)) // still allow if API fails
            .finally(() => setLoading(false))
    }, [user, isAuthenticated, authLoading])

    if (loading) return <Loading />

    if (!authorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">Access Denied</h1>
                <p className="text-slate-500 mt-2 text-sm">You do not have permission to access the Warehouse panel.</p>
                <Link href="/" className="bg-green-600 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full">
                    Go to home <ArrowRightIcon size={18} />
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <WarehouseNavbar warehouses={warehouses} />
            <div className="flex flex-1 overflow-hidden">
                <WarehouseSidebar />
                <div className="flex-1 overflow-y-auto p-5 lg:p-8">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default WarehouseLayout
