"use client"

import { formatDistanceToNow } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function MessagesList() {
  const { conversations, getUserById, setActiveChatId, currentUserId } = useAppStore()

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <MessageCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground/70">
          Request to join a trip to start chatting
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Messages</h1>
        <p className="text-xs text-muted-foreground">
          {conversations.length} conversation{conversations.length !== 1 && "s"}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {conversations.map((conv) => {
          const otherId = conv.participantIds.find(
            (id) => id !== currentUserId
          )
          const other = otherId ? getUserById(otherId) : undefined
          if (!other) return null

          const initials = other.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()

          const timeAgo = formatDistanceToNow(new Date(conv.lastMessageTime), {
            addSuffix: true,
          })

          return (
            <button
              key={conv.id}
              onClick={() => setActiveChatId(conv.id)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary/60"
            >
              <Avatar className="h-11 w-11 border border-border">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {other.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-xs",
                    conv.unreadCount > 0
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {conv.lastMessage}
                </p>
              </div>

              {conv.unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
