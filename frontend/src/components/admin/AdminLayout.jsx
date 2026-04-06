import { useEffect, useState } from "react"
import Loading from "../ui/Loading"
import { Link } from "@/utils/compat"
import { ArrowRightIcon } from "lucide-react"
import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"
import { useAuth } from "@/hooks/useAuth"

const AdminLayout = ({ children }) => {

    const { user, isAuthenticated, loading: authLoading } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated || !user) {
            setIsAdmin(false)
            setLoading(false)
            return
        }
        const roles = user.roles || []
        const hasAdmin = roles.some(r => (r?.name || '').toUpperCase() === 'ADMIN')
        setIsAdmin(hasAdmin)
        setLoading(false)
    }, [user, isAuthenticated, authLoading])

    return loading ? (
        <Loading />
    ) : isAdmin ? (
        <div className="flex flex-col h-screen bg-gray-50">
            <AdminNavbar />
            <div className="flex flex-1 overflow-hidden">
                <AdminSidebar />
                <div className="flex-1 overflow-y-auto p-5 lg:pl-12 lg:pt-10">
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

export default AdminLayout