import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "@/utils/compat"
import { Link } from "@/utils/compat"
import { authApiService } from "@/services/authApiService"
import { Eye, EyeOff, KeyRound, CheckCircle2, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const validate = () => {
    if (!password || !confirmPassword) return "Please fill in all fields"
    if (password.length < 6) return "Password must be at least 6 characters"
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password))
      return "Password must contain uppercase, lowercase, and a number"
    if (password !== confirmPassword) return "Passwords do not match"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!token) {
      setError("Invalid reset link. Please request a new one.")
      return
    }

    setLoading(true)
    try {
      await authApiService.resetPassword({
        token,
        newPassword: password,
        confirmPassword,
      })
      setDone(true)
      setTimeout(() => router.replace("/login"), 2500)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Reset failed. The link may have expired."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-6">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4">
          <p className="text-red-500 text-sm font-medium">Invalid or missing reset token.</p>
          <Link href="/forgot-password" className="text-green-700 text-sm hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

        {/* Logo */}
        <div className="text-center space-y-1 mb-6">
          <div className="text-3xl font-semibold text-slate-700">
            <span className="text-green-600">go</span>cart<span className="text-green-600">.</span>
          </div>
        </div>

        {done ? (
          /* ─── Success ──────────────────────────────────────── */
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Password updated!</h2>
            <p className="text-sm text-slate-500">Redirecting you to sign in...</p>
          </div>
        ) : (
          /* ─── Form ─────────────────────────────────────────── */
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-green-600" />
                Set new password
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose a strong password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1">
                <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-slate-100 border border-slate-200 px-4 py-3 pr-11 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Min 6 chars, must include uppercase, lowercase, and a number.
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-slate-100 border border-slate-200 px-4 py-3 pr-11 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
                ) : (
                  "Update Password"
                )}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">
                  Back to Sign in
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
