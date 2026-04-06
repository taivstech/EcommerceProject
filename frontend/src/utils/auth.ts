
import { API_BASE_URL } from "@/api/config"
import { DEV_MODE_ENABLED } from "@/utils/dev-mode"

export interface User {
  id: string
  email: string
  username: string
  fullName: string
  profilePicture?: string
  phone?: string
  dob?: string
  roles: Array<{
    name: string
    description?: string
  }>
}

export interface AuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

const TOKEN_KEY = "auth_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const LEGACY_ACCESS_TOKEN_KEY = "accessToken"
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken"

interface CustomJWT {
  exp: number
  iat: number
  sub: string
  scope: string
  jti: string
  iss: string
}

function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const json = atob(padded)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

function extractUserRole(scope: string): "USER" | "ADMIN" | "SELLER" {
  if (scope.includes("ROLE_ADMIN")) return "ADMIN"
  if (scope.includes("ROLE_SELLER")) return "SELLER"
  return "USER"
}

export const authService = {

  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window === "undefined") return
    
    localStorage.setItem(TOKEN_KEY, accessToken)
    // keep legacy key in sync so other parts of the app (or old builds) still work
    localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken)
    }
  },


  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null
    if (DEV_MODE_ENABLED) return "dev-mode-token"
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
  },


  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null
    if (DEV_MODE_ENABLED) return "dev-mode-refresh-token"
    return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY)
  },

  clearTokens: () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  },

  isTokenExpired: (token: string): boolean => {
    if (DEV_MODE_ENABLED) return false

    try {
      const decoded = decodeJwtPayload<{ exp: number }>(token)
      if (!decoded?.exp) return true
      return decoded.exp * 1000 < Date.now() + 30000
    } catch {
      return true
    }
  },

  getUserFromToken: (token: string): Partial<User> | null => {
    if (DEV_MODE_ENABLED) {
      return {
        id: "dev-user-1",
        email: "admin@example.com",
        username: "admin",
        fullName: "Dev Admin",
        roles: [{ name: "ADMIN" }],
      }
    }

    try {
      const decoded = decodeJwtPayload<CustomJWT>(token)
      if (!decoded) return null
      
      return {
        id: decoded.sub,
        roles: decoded.scope ? [{ name: extractUserRole(decoded.scope) }] : [{ name: "USER" }],
      }
    } catch (error) {
      console.error("Failed to decode JWT:", error)
      return null
    }
  },

  isAuthenticated: (): boolean => {
    if (DEV_MODE_ENABLED) return true

    const token = authService.getAccessToken()
    return token ? !authService.isTokenExpired(token) : false
  },

  refreshAccessToken: async (): Promise<boolean> => {
    if (DEV_MODE_ENABLED) return true

    try {
      const oldAccessToken = authService.getAccessToken()

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for refresh

      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(oldAccessToken ? { Authorization: `Bearer ${oldAccessToken}` } : {}),
            },
            body: oldAccessToken ? JSON.stringify({ access_token: oldAccessToken }) : undefined,
            credentials: "include",
            signal: controller.signal,
          }
        )
        
        clearTimeout(timeoutId)

        if (!response.ok) {
          return false
        }

        const data = await response.json()
        const accessToken = data?.result?.access_token ?? data?.result?.accessToken
        if (accessToken) {
          authService.setTokens(accessToken)
          return true
        }

        return false
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        
        // Handle network errors
        if (fetchError.name === 'AbortError') {
          console.warn("Token refresh timeout - backend may be unavailable")
          return false
        }
        
        if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
          console.warn("Token refresh failed - network error. Backend may be unavailable at", API_BASE_URL)
          return false
        }
        
        // Re-throw other errors
        throw fetchError
      }
    } catch (error) {
      console.error("Failed to refresh token:", error)
      return false
    }
  },

  login: async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (DEV_MODE_ENABLED) {
      authService.setTokens("dev-mode-token", "dev-mode-refresh-token")
      return { success: true }
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email_or_phone: emailOrPhone.trim(), password }),
          credentials: "include",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const msg =
          data && typeof data === "object"
            ? `${data.code ?? response.status}: ${data.message ?? "Login failed"}`
            : "Login failed"
        return {
          success: false,
          error: msg,
        }
      }

      const accessToken = data?.result?.access_token ?? data?.result?.accessToken
      if (accessToken) {
        authService.setTokens(accessToken)
        return { success: true }
      }

      return {
        success: false,
        error: "No token received from server",
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: "Connection error",
      }
    }
  },

  register: async (data: {
    username: string
    password: string
    confirmPassword: string
    fullName: string
    email: string
    phone?: string
    dob?: string
  }): Promise<{ success: boolean; error?: string }> => {
    if (DEV_MODE_ENABLED) {
      return { success: true }
    }

    try {
      const payload: Record<string, any> = {
        username: data.username,
        password: data.password,
        confirm_password: data.confirmPassword,
        full_name: data.fullName,
        email: data.email,
      }
      if (data.phone && data.phone.trim()) payload.phone = data.phone.trim()
      if (data.dob && data.dob.trim()) payload.dob = data.dob.trim() // format: YYYY-MM-DD

      const response = await fetch(
        `${API_BASE_URL}/users/registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      const responseData = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: responseData?.message || "Registration failed",
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Register error:", error)
      return {
        success: false,
        error: "Connection error",
      }
    }
  },

  logout: async (): Promise<void> => {
    if (DEV_MODE_ENABLED) {
      authService.clearTokens()
      return
    }

    try {
      const token = authService.getAccessToken()
      if (token) {
        await fetch(
          `${API_BASE_URL}/auth/logout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        )
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      authService.clearTokens()
    }
  },
}
