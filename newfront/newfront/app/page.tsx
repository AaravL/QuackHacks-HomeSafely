"use client"

import { Shield } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { TripFeed } from "@/components/trip-feed"
import { CreateTrip } from "@/components/create-trip"
import { MessagesList } from "@/components/messages-list"
import { ChatView } from "@/components/chat-view"
import { UserProfile } from "@/components/user-profile"
import { useAppStore } from "@/lib/store"
import { ScrollArea } from "@/components/ui/scroll-area"

function AppHeader() {
  return (
    <header className="flex items-center gap-2 pb-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
        <Shield className="h-4.5 w-4.5 text-primary" />
      </div>
      <span className="font-mono text-sm font-bold tracking-tight text-foreground">
        HomeSafely
      </span>
    </header>
  )
}

export default function HomePage() {
  const { activeTab, activeChatId } = useAppStore()

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      {/* Scrollable content area */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-4 pb-24 pt-4">
          {/* Show app header except in chat view */}
          {!(activeTab === "messages" && activeChatId) && <AppHeader />}

          {activeTab === "feed" && <TripFeed />}
          {activeTab === "create" && <CreateTrip />}
          {activeTab === "messages" && !activeChatId && <MessagesList />}
          {activeTab === "messages" && activeChatId && <ChatView />}
          {activeTab === "profile" && <UserProfile />}
        </div>
      </ScrollArea>

      {/* Fixed bottom nav */}
      <BottomNav />
    </main>
  )
}
