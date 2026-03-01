"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AuthUser {
  id: string
  email: string
  name: string
  age: number
  gender: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken")
    const savedUser = localStorage.getItem("currentUser")

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem("authToken")
        localStorage.removeItem("currentUser")
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken)
    setUser(newUser)
    setIsAuthenticated(true)
    localStorage.setItem("authToken", newToken)
    localStorage.setItem("currentUser", JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("authToken")
    localStorage.removeItem("currentUser")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
