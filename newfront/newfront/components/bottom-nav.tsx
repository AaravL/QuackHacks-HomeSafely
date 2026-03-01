"use client"

import { Compass, PlusCircle, MessageCircle, UserRound, PhoneCall } from "lucide-react"
import type { TabId } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const tabs: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: "feed", label: "Explore", icon: Compass },
  { id: "create", label: "New Trip", icon: PlusCircle },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "companion", label: "Companion", icon: PhoneCall },
  { id: "profile", label: "Profile", icon: UserRound },
]

export function BottomNav() {
  const { activeTab, setActiveTab, setActiveChatId, conversations } =
    useAppStore()

  const totalUnread = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  )

  function handleTabPress(id: TabId) {
    if (id !== "messages") {
      setActiveChatId(null)
    }
    setActiveTab(id)
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      role="tablist"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon
        const showBadge = tab.id === "messages" && totalUnread > 0

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => handleTabPress(tab.id)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {showBadge && (
                <span className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                  {totalUnread}
                </span>
              )}
            </div>
            <span className="font-medium">{tab.label}</span>
            {isActive && (
              <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
