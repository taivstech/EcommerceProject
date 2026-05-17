import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "@/utils/compat"
import { Link } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import { Eye, EyeOff, UserPlus, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { authApiService } from "@/services/authApiService"

type FieldStatus = "idle" | "checking" | "available" | "taken"

export default function RegisterPage() {
  const router = useRouter()
  const { register, isAuthenticated, loading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [registered, setRegistered] = useState(false)

  // Real-time availability status
  const [usernameStatus, setUsernameStatus] = useState<FieldStatus>("idle")
  const [emailStatus, setEmailStatus] = useState<FieldStatus>("idle")

  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  // Debounced username check
  const checkUsername = useCallback((value: string) => {
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current)
    if (!value || value.length < 4) {
      setUsernameStatus("idle")
      return
    }
    setUsernameStatus("checking")
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const available = await authApiService.checkUsername(value)
        setUsernameStatus(available ? "available" : "taken")
      } catch {
        setUsernameStatus("idle")
      }
    }, 500)
  }, [])

  // Debounced email check
  const checkEmail = useCallback((value: string) => {
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current)
    if (!value || !value.includes("@")) {
      setEmailStatus("idle")
      return
    }
    setEmailStatus("checking")
    emailDebounceRef.current = setTimeout(async () => {
      try {
        const available = await authApiService.checkEmail(value)
        setEmailStatus(available ? "available" : "taken")
      } catch {
        setEmailStatus("idle")
      }
    }, 500)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === "username") checkUsername(value)
    if (name === "email") checkEmail(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.username || !formData.password || !formData.confirmPassword || !formData.fullName || !formData.email) {
      setError("Please fill in all required fields")
      return
    }

    if (usernameStatus === "taken") {
      setError("Username is already taken")
      return
    }
    if (emailStatus === "taken") {
      setError("Email is already registered")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const pwd = formData.password
    if (pwd.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    const hasUpper = /[A-Z]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasDigit = /\d/.test(pwd)
    if (!hasUpper || !hasLower || !hasDigit) {
      setError("Password must contain uppercase, lowercase, and a number")
      return
    }

    setLoading(true)
    try {
      const result = await register(formData)
      if (result.success) {
        setRegistered(true)
      } else {
        setError(result.error || "Registration failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    )
  }

  // ─── Success screen: ask user to check email ──────────────────────────────────
  if (registered) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-6">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Check your email!</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            We've sent a verification link to{" "}
            <span className="font-medium text-slate-700">{formData.email}</span>.
            <br />
            Click the link in the email to verify your account and log in automatically.
          </p>
          <p className="text-xs text-slate-400">The link expires in 24 hours.</p>
          <Link href="/login" className="block text-sm text-green-700 hover:underline font-medium mt-2">
            Back to Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-10 px-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="text-center space-y-1">
          <div className="text-3xl font-semibold text-slate-700">
            <span className="text-green-600">go</span>cart<span className="text-green-600">.</span>
          </div>
          <p className="text-sm text-slate-500">Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1">
            <label htmlFor="username" className="text-sm font-medium text-slate-700">
              Username <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full bg-slate-100 border border-slate-200 px-4 py-3 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />}
                {usernameStatus === "available" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {usernameStatus === "taken" && <XCircle className="h-4 w-4 text-red-500" />}
              </div>
            </div>
            {usernameStatus === "taken" && (
              <p className="text-xs text-red-500">Username is already taken</p>
            )}
            {usernameStatus === "available" && (
              <p className="text-xs text-green-600">Username is available</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full bg-slate-100 border border-slate-200 px-4 py-3 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailStatus === "checking" && <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />}
                {emailStatus === "available" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {emailStatus === "taken" && <XCircle className="h-4 w-4 text-red-500" />}
              </div>
            </div>
            {emailStatus === "taken" && (
              <p className="text-xs text-red-500">Email is already registered</p>
            )}
            {emailStatus === "available" && (
              <p className="text-xs text-green-600">Email is available</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
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
            <p className="text-xs text-slate-500">
              At least 6 characters, including <span className="font-medium">uppercase</span>,{" "}
              <span className="font-medium">lowercase</span>, and a <span className="font-medium">number</span>.
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirm Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full bg-slate-100 border border-slate-200 px-4 py-3 pr-11 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={loading || usernameStatus === "taken" || emailStatus === "taken" || usernameStatus === "checking" || emailStatus === "checking"}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing up...</>
            ) : (
              <><UserPlus className="h-5 w-5" /> Sign Up</>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-green-700 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
