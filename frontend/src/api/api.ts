
import { authService } from "@/utils/auth"
import { API_BASE_URL } from "@/api/config"
import { DEV_MODE_ENABLED } from "@/utils/dev-mode"
import { redirectToLoginIfNeeded, isAuthError } from "@/utils/authRedirect"

export interface ApiEnvelope<T> {
  code?: number
  message?: string
  result?: T
}

async function readJsonSafe(res: Response): Promise<any> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: any
  skipAuth?: boolean // Skip authentication for public endpoints
}

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/products',
  '/categories',
  '/reviews',
  '/shops/public',
  '/coupons/platform',
  '/coupons/shop',
  '/search/products',  // Only search products is public
  '/search/suggest',  // Only suggest is public
]

// Protected search endpoints that require authentication
const PROTECTED_SEARCH_ENDPOINTS = [
  '/search/history',  // Search history requires auth
]

function isPublicEndpoint(path: string): boolean {
  // Check if it's a protected search endpoint first
  if (PROTECTED_SEARCH_ENDPOINTS.some(endpoint => path === endpoint || path.startsWith(endpoint + '/'))) {
    return false
  }
  // Then check public endpoints — use delimiter to prevent /productsX matching /products
  return PUBLIC_ENDPOINTS.some(endpoint => path === endpoint || path.startsWith(endpoint + '/'))
}

async function request<T>(path: string, options: RequestOptions = {}, retry = true): Promise<ApiEnvelope<T>> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  const isPublic = options.skipAuth || isPublicEndpoint(path)

  const headers = new Headers(options.headers || {})

  // Add ngrok bypass header if using ngrok
  if (API_BASE_URL.includes('ngrok-free.app') || API_BASE_URL.includes('ngrok.io')) {
    headers.set('ngrok-skip-browser-warning', 'true')
  }

  const isBodyPresent = typeof options.body !== "undefined"
  const body =
    isBodyPresent && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body
  if (isBodyPresent && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  }

  // Only add auth header if not public and not skipping auth
  // But ALWAYS send token if available — public endpoints accept it, protected ones need it
  {
    let token = authService.getAccessToken()
    if (token && authService.isTokenExpired(token)) {
      authService.clearTokens()
      token = null
    }
    if (DEV_MODE_ENABLED) {
      headers.set("Authorization", "Bearer dev-mode-token")
    } else if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      body,
      credentials: "include",
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    // For public endpoints, if 401 occurs, retry without auth header
    if (res.status === 401 && retry && !DEV_MODE_ENABLED) {
      if (isPublic) {
        // Retry public endpoint without auth header
        const retryOptions = { ...options, skipAuth: true }
        return request<T>(path, retryOptions, false)
      }
      
      // For protected endpoints, try to refresh token
      const refreshed = await authService.refreshAccessToken()
      if (refreshed) {
        return request<T>(path, options, false)
      }

      // Refresh failed, clear tokens and redirect to login
      authService.clearTokens()
      redirectToLoginIfNeeded()
      throw new Error("UNAUTHENTICATED")
    }

    const data = await readJsonSafe(res)

    // For public endpoints, if still 401 after retry, return empty result instead of throwing
    if (!res.ok) {
      // If it's a public endpoint and we get 401, don't throw error
      if (res.status === 401 && isPublic) {
        console.warn(`Public endpoint ${path} returned 401, returning empty result`)
        return { result: null } as ApiEnvelope<T>
      }
      
      // Check if this is an authentication error
      if (isAuthError({ status: res.status, code: data?.code, message: data?.message })) {
        authService.clearTokens()
        redirectToLoginIfNeeded()
      }
      
      const message =
        (data && typeof data === "object" && (data.message || data.error)) || res.statusText || "Request failed"
      throw new Error(message)
    }

    return (data || {}) as ApiEnvelope<T>
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    // Handle authentication errors
    if (isAuthError({}, error)) {
      authService.clearTokens()
      redirectToLoginIfNeeded()
      throw error
    }
    
    // Handle network errors
    if (error.name === 'AbortError') {
      console.error(`Request timeout for ${path}`)
      throw new Error(`Request timeout: Unable to connect to server. Please check if the backend is running at ${API_BASE_URL}`)
    }
    
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      console.error(`Network error for ${path}:`, error)
      const errorMessage = `Network error: Unable to connect to server at ${API_BASE_URL}. 
      
Possible causes:
1. Backend server is not running (check if Spring Boot is started)
2. Backend is running on a different port (expected: 8088)
3. CORS configuration issue
4. Firewall or network blocking the connection

Please check:
- Is the backend running? (${API_BASE_URL}/actuator/health)
- Is NEXT_PUBLIC_API_URL set correctly in your .env file?
- Check browser console for CORS errors`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
    
    // Re-throw other errors
    throw error
  }
}

const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  del: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
}

export default api
