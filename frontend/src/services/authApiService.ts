import api from "@/api/api"
import type {
  AuthenticationRequest,
  AuthenticationResponse,
  IntrospectRequest,
  IntrospectResponse,
  OutboundOAuthStateResponse,
  ExchangeTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types/dto"

export const authApiService = {
  login: async (body: AuthenticationRequest): Promise<AuthenticationResponse> => {
    const res = await api.post<AuthenticationResponse>("/auth/token", body)
    if (!res.result) throw new Error("Login failed")
    return res.result
  },

  introspect: async (body: IntrospectRequest): Promise<IntrospectResponse> => {
    const res = await api.post<IntrospectResponse>("/auth/introspect", body)
    if (!res.result) throw new Error("Introspect failed")
    return res.result
  },

  refresh: async (): Promise<AuthenticationResponse> => {
    const res = await api.post<AuthenticationResponse>("/auth/refresh")
    if (!res.result) throw new Error("Token refresh failed")
    return res.result
  },

  logout: async (): Promise<void> => {
    await api.post<void>("/auth/logout")
  },

  issueOutboundState: async (): Promise<OutboundOAuthStateResponse> => {
    const res = await api.get<OutboundOAuthStateResponse>("/auth/outbound/state", { skipAuth: true })
    if (!res.result) throw new Error("Failed to issue outbound state")
    return res.result
  },

  exchangeOAuth2Code: async (body: ExchangeTokenRequest): Promise<AuthenticationResponse> => {
    const res = await api.post<AuthenticationResponse>("/auth/outbound/authentication", body, { skipAuth: true })
    if (!res.result) throw new Error("OAuth2 exchange failed")
    return res.result
  },

  forgotPassword: async (body: ForgotPasswordRequest): Promise<void> => {
    await api.post<void>("/auth/forgot-password", body)
  },

  resetPassword: async (body: ResetPasswordRequest): Promise<void> => {
    await api.post<void>("/auth/reset-password", body)
  },
}

