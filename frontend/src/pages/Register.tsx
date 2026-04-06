import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "@/utils/compat"
import { Link } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import toast from "react-hot-toast"

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

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && !authLoading) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.username || !formData.password || !formData.confirmPassword || !formData.fullName || !formData.email) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Backend rule (PasswordValidator):
    // - length >= 6
    // - must contain: uppercase + lowercase + digit
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
        toast.success("Registration successful! Please sign in.")
        // Redirect to login page after successful registration
        router.push("/login?registered=true")
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

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-slate-700">
                Username <span className="text-red-600">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
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
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>Signing up...</>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Sign Up
                </>
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
