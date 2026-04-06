import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { User } from "@/utils/auth"
import { authService } from "@/utils/auth"
import { DEV_MODE_ENABLED, DEV_MODE_USER } from "@/utils/dev-mode"
import api from "@/api/api"
import type { UserResponse } from "@/types/dto"

export type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: {
    username: string
    password: string
    confirmPassword: string
    fullName: string
    email: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function toUserFromMe(): Promise<User> {
  try {
    const response = await api.get<UserResponse>("/users/me")
    const userData = response.result
    if (!userData) throw new Error("Missing user data")

    return {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      fullName: userData.full_name || userData.username,
      profilePicture: userData.profile_picture,
      dob: userData.dob,
      roles: (userData.roles || []) as any,
    }
  } catch (error: any) {
    throw error
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetchUser = useCallback(async () => {
    const u = await toUserFromMe()
    setUser(u)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (DEV_MODE_ENABLED) {
          setUser(DEV_MODE_USER)
          return
        }

        const token = authService.getAccessToken()
        if (token && !authService.isTokenExpired(token)) {
          await refetchUser()
          return
        }

        const refreshed = await authService.refreshAccessToken()
        if (refreshed) {
          await refetchUser()
        } else {
          authService.clearTokens()
          setUser(null)
        }
      } catch (err) {
        console.error("Auth bootstrap failed:", err)
        authService.clearTokens()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [refetchUser])

  const login = useCallback(
    async (emailOrPhone: string, password: string) => {
      setLoading(true)
      setError(null)
      try {
        const result = await authService.login(emailOrPhone, password)
        if (!result.success) {
          setError(result.error || "Login failed")
          return { success: false, error: result.error }
        }

        try {
          await refetchUser()
          return { success: true }
        } catch (e) {
          console.error("Login succeeded but fetching profile failed:", e)
          const msg = e instanceof Error ? e.message : "Failed to fetch user info after login"
          setError(msg)
          return { success: false, error: msg }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed"
        setError(message)
        return { success: false, error: message }
      } finally {
        setLoading(false)
      }
    },
    [refetchUser],
  )

  const register = useCallback(async (data: AuthContextValue["register"] extends (a: infer A) => any ? A : never) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.register(data)
      if (!result.success) {
        setError(result.error || "Registration failed")
        return { success: false, error: result.error }
      }
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed"
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refetchUser,
    }),
    [user, loading, error, login, register, logout, refetchUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>")
  }
  return ctx
}

