import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clearSessionUser, saveSessionUser } from './role'
import { ApiError, apiRequest, setUnauthorizedHandler, tokenStorage } from './api-client'

type LoginData = Record<string, unknown>

// ⚠️ Step 3 ke output se confirm karo ki token kis naam se aata hai
function extractToken(data: LoginData): string | null {
  const nested = (data.tokens ?? {}) as Record<string, unknown>
  const candidates = [
    data.token,
    data.accessToken,
    data.access_token,
    data.jwt,
    nested.accessToken,
    nested.access,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return null
}

// Purani galat value ('undefined') ko valid token na maano
function readToken(): string | null {
  const t = tokenStorage.get()
  if (!t || t === 'undefined' || t === 'null') {
    tokenStorage.clear()
    return null
  }
  return t
}

type AuthContextType = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(() => readToken() !== null)

  function logout() {
    tokenStorage.clear()
    clearSessionUser()
    queryClient.clear() // dusre user ka cached data na dikhe
    setIsAuthenticated(false)
  }

  // Session expire ho to automatically logout, ProtectedRoute login pe bhej dega
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(email: string, password: string) {
    const data = await apiRequest<LoginData>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuthRedirect: true,
    })
    const token = extractToken(data)
    if (!token) {
      throw new ApiError(200, 'Login succeeded but the server did not return a token.')
    }
    queryClient.clear()
    tokenStorage.set(token)
    saveSessionUser(data, email)
    setIsAuthenticated(true)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}