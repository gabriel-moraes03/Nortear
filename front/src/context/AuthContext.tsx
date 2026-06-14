import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { User, LoginData, RegisterData } from '../types'
import { authApi } from '../services/api'

interface AuthContextType {
  token: string | null
  user: User | null
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nortear_token'))
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nortear_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = useCallback(async (data: LoginData) => {
    const res = await authApi.login(data)
    localStorage.setItem('nortear_token', res.token)
    localStorage.setItem('nortear_user', JSON.stringify(res.user))
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    await authApi.register(data)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nortear_token')
    localStorage.removeItem('nortear_user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((u: User) => {
    localStorage.setItem('nortear_user', JSON.stringify(u))
    setUser(u)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
