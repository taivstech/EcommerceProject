import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import { authApiService } from "@/services/authApiService"
import { authService } from "@/utils/auth"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Link } from "@/utils/compat"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refetchUser } = useAuth()

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("error")
      setErrorMessage("Invalid verification link. No token found.")
      return
    }

    let cancelled = false

    const doVerify = async () => {
      try {
        await authApiService.verifyEmail(token)
        if (cancelled) return

        // Refresh user data after verification (cookies were set by backend response)
        await refetchUser()

        setStatus("success")

        // Auto-redirect to home after 2s
        setTimeout(() => {
          if (!cancelled) router.replace("/")
        }, 2000)
      } catch (err: any) {
        if (cancelled) return
        const msg = err?.response?.data?.message || err?.message || "Verification failed"
        const isAlreadyVerified = msg.toLowerCase().includes("already verified")
        if (isAlreadyVerified) {
          setStatus("success")
          setTimeout(() => { if (!cancelled) router.replace("/") }, 2000)
        } else {
          setStatus("error")
          setErrorMessage(msg)
        }
      }
    }

    doVerify()
    return () => { cancelled = true }
  }, [searchParams, refetchUser, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4">

        {/* Loading */}
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Verifying your email...</h2>
            <p className="text-sm text-slate-500">Please wait a moment.</p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Email verified!</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your account is now active. Redirecting you to the home page...
            </p>
            <div className="flex justify-center">
              <div className="h-1.5 w-32 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-green-500 animate-[slide_2s_linear_forwards] rounded-full" />
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Verification failed</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {errorMessage || "The verification link is invalid or has expired."}
            </p>
            <div className="space-y-2 pt-2">
              <Link
                href="/register"
                className="block w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg transition text-sm"
              >
                Register again
              </Link>
              <Link href="/login" className="block text-sm text-green-700 hover:underline">
                Back to Sign in
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
