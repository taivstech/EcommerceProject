import type React from "react"
import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "@/utils/compat"
import { Link } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import { Eye, EyeOff, LogIn } from "lucide-react"
import toast from "react-hot-toast"
import { authApiService } from "@/services/authApiService"
import { authService } from "@/utils/auth"

/**
 * Determine where to redirect after login based on user roles
 */
function getRedirectPath(user: any): string {
  const roles = user?.roles || []
  const roleNames = roles.map((r: any) => (r?.name || '').toUpperCase())

  if (roleNames.includes('ADMIN')) return '/admin'
  // Seller and User both go to home; seller can navigate to /store from navbar
  return '/'
}

// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user, isAuthenticated, loading: authLoading, refetchUser } = useAuth()

  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect OAuth callbacks to /authenticate page
  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (code && state) {
      router.replace(`/authenticate?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
    }
  }, [searchParams, router])

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && !authLoading && user) {
      // Check if there's a return URL stored
      const returnUrl = sessionStorage.getItem('returnUrl')
      if (returnUrl) {
        sessionStorage.removeItem('returnUrl')
        router.replace(returnUrl)
      } else {
        router.replace(getRedirectPath(user))
      }
    }
  }, [isAuthenticated, authLoading, user, router])

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google OAuth is not configured')
      return
    }

    setGoogleLoading(true)
    try {
      // Get state from backend
      const stateRes = await authApiService.issueOutboundState()

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // Store PKCE values and state in sessionStorage
      sessionStorage.setItem('oauth_code_verifier', codeVerifier)
      sessionStorage.setItem('oauth_state', stateRes.state)
      sessionStorage.setItem('oauth_state_signature', stateRes.state_signature)

      const redirectUri = `${window.location.origin}/authenticate`
      sessionStorage.setItem('oauth_redirect_uri', redirectUri)

      // Build Google OAuth URL
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
      googleAuthUrl.searchParams.set('response_type', 'code')
      googleAuthUrl.searchParams.set('scope', 'profile email')
      googleAuthUrl.searchParams.set('state', stateRes.state)
      googleAuthUrl.searchParams.set('code_challenge', codeChallenge)
      googleAuthUrl.searchParams.set('code_challenge_method', 'S256')
      googleAuthUrl.searchParams.set('access_type', 'offline')
      googleAuthUrl.searchParams.set('prompt', 'consent')

      // Redirect to Google
      window.location.href = googleAuthUrl.toString()
    } catch (err) {
      console.error('Failed to initiate Google login:', err)
      toast.error('Failed to initiate Google login')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!emailOrPhone || !password) {
      setError("Please enter email/phone and password")
      return
    }

    setLoading(true)
    try {
      const result = await login(emailOrPhone, password)

      if (result.success) {
        toast.success("Login successful")
        // Don't redirect here — the useEffect above will handle it
        // once `user` state is populated by refetchUser()
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="text-center space-y-1">
          <div className="text-3xl font-semibold text-slate-700">
            <span className="text-green-600">go</span>cart<span className="text-green-600">.</span>
          </div>
          <p className="text-sm text-slate-500">Sign in to continue shopping</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="emailOrUsername" className="text-sm font-medium text-slate-700">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                type="text"
                placeholder="Enter your email or username"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
            </div>

            <div className="flex justify-end -mt-2">
              <a href="/forgot-password" className="text-xs text-green-700 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>Signing in...</>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">or continue with</span>
              </div>
            </div>

            {/* Google OAuth button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {googleLoading ? (
                <>Connecting to Google...</>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-green-700 hover:underline font-medium">
                  Sign up now
                </Link>
              </p>
            </div>
        </form>
      </div>
    </div>
  )
}
