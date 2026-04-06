import Loading from "@/components/ui/Loading"
import { useRouter } from "@/utils/compat"
import { useEffect } from "react"

export default function LoadingPage() {
    const router = useRouter()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const url = params.get('nextUrl')

        if (url) {
            setTimeout(() => {
                router.push(url)
            }, 8000)
        }
    }, [router])

    return <Loading />
}
