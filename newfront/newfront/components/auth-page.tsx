"use client"

import { useState } from "react"
import { Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as api from "../lib/api"

interface AuthPageProps {
  onLoginSuccess: (token: string, user: any) => void
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("login")

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register form state
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerAge, setRegisterAge] = useState("")
  const [registerGender, setRegisterGender] = useState("female")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await api.login(loginEmail, loginPassword)
      if (response.token && response.user) {
        localStorage.setItem("authToken", response.token)
        localStorage.setItem("currentUser", JSON.stringify(response.user))
        onLoginSuccess(response.token, response.user)
      } else {
        setError("Login failed - no token received")
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await api.signup({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        age: parseInt(registerAge),
        gender: registerGender,
      })
      setError("")
      setActiveTab("login")
      // Pre-fill login form
      setLoginEmail(registerEmail)
      setLoginPassword(registerPassword)
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="font-mono text-2xl font-bold">Hitch</CardTitle>
          <CardDescription>Find safe travel companions for your commute</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                {error && <div className="text-sm text-red-500">{error}</div>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="John Doe"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="register-age">Age</Label>
                    <Input
                      id="register-age"
                      type="number"
                      placeholder="25"
                      value={registerAge}
                      onChange={(e) => setRegisterAge(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-gender">Gender</Label>
                    <select
                      id="register-gender"
                      value={registerGender}
                      onChange={(e) => setRegisterGender(e.target.value)}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                    </select>
                  </div>
                </div>

                {error && <div className="text-sm text-red-500">{error}</div>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
