import { useEffect, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from "@/utils/compat"
import { authApiService } from '@/services'
import { authService } from '@/utils/auth'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

function AuthenticateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refetchUser } = useAuth()
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (processing) return

    const handleOAuthCallback = async () => {
      setProcessing(true)

      // Get OAuth callback parameters
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        toast.error(`OAuth error: ${error}`)
        router.replace('/login')
        return
      }

      if (!code || !state) {
        toast.error('Invalid OAuth callback')
        router.replace('/login')
        return
      }

      try {
        // Get stored OAuth data
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier') || ''
        const storedState = sessionStorage.getItem('oauth_state') || ''
        const stateSignature = sessionStorage.getItem('oauth_state_signature') || ''
        const redirectUri = sessionStorage.getItem('oauth_redirect_uri') || `${window.location.origin}/authenticate`

        console.log('OAuth Debug:', {
          stateFromGoogle: state,
          storedState: storedState,
          stateSignature: stateSignature,
          match: state === storedState
        })

        // Verify state matches (CSRF protection)
        if (state !== storedState) {
          console.error('OAuth state mismatch')
          toast.error('OAuth state mismatch - please try again')
          router.replace('/login')
          return
        }

        // Clean up stored values
        sessionStorage.removeItem('oauth_code_verifier')
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('oauth_state_signature')
        sessionStorage.removeItem('oauth_redirect_uri')

        // Exchange code for tokens
        console.log('OAuth Exchange Request:', {
          code,
          state: storedState,
          state_signature: stateSignature,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri
        })
        
        const result = await authApiService.exchangeOAuth2Code({
          code,
          state: storedState,
          state_signature: stateSignature,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        })

        if (result.access_token) {
          authService.setTokens(result.access_token)
          await refetchUser()
          toast.success('Google login successful!')
          router.replace('/')
        } else {
          toast.error('Login failed - no token received')
          router.replace('/login')
        }
      } catch (err) {
        console.error('OAuth exchange failed:', err)
        toast.error(err instanceof Error ? err.message : 'Google login failed')
        router.replace('/login')
      }
    }

    handleOAuthCallback()
  }, [searchParams, router, processing, refetchUser])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating with Google...</p>
      </div>
    </div>
  )
}

export default function AuthenticatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthenticateContent />
    </Suspense>
  )
}
