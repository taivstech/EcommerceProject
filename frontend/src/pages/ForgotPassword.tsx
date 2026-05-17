import type React from "react"
import { useState } from "react"
import { Link } from "@/utils/compat"
import { authApiService } from "@/services/authApiService"
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    try {
      await authApiService.forgotPassword({ email })
      setSent(true)
    } catch (err: any) {
      // Don't leak whether email exists — always show success-like message
      setSent(true)
    } finally {
      setLoading(false)
    }
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

        {sent ? (
          /* ─── Success state ──────────────────────────────────── */
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Check your email</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              If an account with <span className="font-medium text-slate-700">{email}</span> exists, we've sent a
              password reset link. It expires in 15 minutes.
            </p>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-green-700 hover:underline font-medium mt-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign in
            </Link>
          </div>
        ) : (
          /* ─── Form ───────────────────────────────────────────── */
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Forgot your password?</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="forgot-email" className="text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-slate-100 border border-slate-200 pl-10 pr-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  "Send reset link"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
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
