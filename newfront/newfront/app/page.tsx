"use client"

import { useEffect, useState } from "react"
import { Shield } from "lucide-react"

import { BottomNav } from "@/components/bottom-nav"
import { TripFeed } from "@/components/trip-feed"
import { CreateTrip } from "@/components/create-trip"
import { MessagesList } from "@/components/messages-list"
import { ChatView } from "@/components/chat-view"
import { UserProfile } from "@/components/user-profile"
import { AuthPage } from "@/components/auth-page"
import { CompanionChat } from "@/components/companion-chat"

import { useAppStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"

function AppHeader() {
  return (
    <header className="flex items-center gap-2 pb-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
        <Shield className="h-4.5 w-4.5 text-primary" />
      </div>
      <span className="font-mono text-sm font-bold tracking-tight text-foreground">
        Hitch
      </span>
    </header>
  )
}

export default function HomePage() {
  const { activeTab, activeChatId } = useAppStore()
  const { isAuthenticated, isLoading, login } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin">
          <Shield className="h-8 w-8 text-primary" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={login} />
  }

  const showHeader = !(activeTab === "messages" && activeChatId)

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      {/* Scrollable content area */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-4 pb-24 pt-4">
          {showHeader && <AppHeader />}

          {/* Dev-only: see what tab is actually active */}
          {process.env.NODE_ENV !== "production" && (
            <div className="text-[11px] text-muted-foreground">
              activeTab: <span className="text-foreground">{String(activeTab)}</span>
              {activeChatId ? (
                <>
                  {" "}
                  | activeChatId: <span className="text-foreground">{String(activeChatId)}</span>
                </>
              ) : null}
            </div>
          )}

          {/* Tabs */}
          {activeTab === "feed" && <TripFeed />}
          {activeTab === "create" && <CreateTrip />}
          {activeTab === "messages" && !activeChatId && <MessagesList />}
          {activeTab === "messages" && activeChatId && <ChatView />}
          {activeTab === "companion" && <CompanionChat />}
          {activeTab === "profile" && <UserProfile />}

          {/* Fallback to prevent blank screen if activeTab is unexpected */}
          {activeTab !== "feed" &&
            activeTab !== "create" &&
            activeTab !== "messages" &&
            activeTab !== "companion" &&
            activeTab !== "profile" && (
              <div className="rounded-xl border border-border bg-muted p-4 text-sm text-foreground">
                Unknown tab: <span className="font-mono">{String(activeTab)}</span>
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Fixed bottom nav */}
      <BottomNav />
    </main>
  )
}