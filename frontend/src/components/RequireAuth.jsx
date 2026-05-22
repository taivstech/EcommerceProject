import { useEffect } from "react"
import { useRouter } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import Loading from "./ui/Loading"

export default function RequireAuth({ children }) {
    const { isAuthenticated, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search)
            router.replace('/login')
        }
    }, [loading, isAuthenticated, router])

    if (loading) return <Loading />
    if (!isAuthenticated) return <Loading />

    return <>{children}</>
}
