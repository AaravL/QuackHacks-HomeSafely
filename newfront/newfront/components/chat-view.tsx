"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { ArrowLeft, Send, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function ChatView() {
  const { activeChatId, setActiveChatId, conversations, messages, getUserById, sendMessage, currentUserId } =
    useAppStore()
  const [text, setText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversation = conversations.find((c) => c.id === activeChatId)
  const otherId = conversation?.participantIds.find(
    (id) => id !== currentUserId
  )
  const other = otherId ? getUserById(otherId) : undefined

  const chatMessages = useMemo(
    () =>
      messages
        .filter((m) => m.conversationId === activeChatId)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
    [messages, activeChatId]
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [chatMessages.length])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !activeChatId) return
    sendMessage(activeChatId, text.trim())
    setText("")
  }

  if (!conversation || !other) return null

  const initials = other.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setActiveChatId(null)}
          className="h-8 w-8 text-muted-foreground"
          aria-label="Back to messages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Drawer>
          <DrawerTrigger asChild>
            <button className="flex items-center gap-3 rounded-md text-left transition-colors hover:bg-secondary/40">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    {other.name}
                  </span>
                  {other.verified && (
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {other.tripsCompleted} trips completed
                </span>
              </div>
            </button>
          </DrawerTrigger>
          <DrawerContent className="border-border bg-card">
            <DrawerHeader>
              <DrawerTitle className="text-foreground">{other.name}</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-2 px-4 pb-6 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Age:</span> {other.age}
              </p>
              <p>
                <span className="font-medium text-foreground">Gender:</span>{" "}
                {other.gender === "prefer-not-to-say"
                  ? "Not specified"
                  : other.gender.charAt(0).toUpperCase() + other.gender.slice(1)}
              </p>
              <p>
                <span className="font-medium text-foreground">University:</span>{" "}
                {other.university || "Not specified"}
              </p>
              <p>
                <span className="font-medium text-foreground">Trips Completed:</span>{" "}
                {other.tripsCompleted || 0}
              </p>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto py-4"
        style={{ maxHeight: "calc(100dvh - 230px)" }}
      >
        {chatMessages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-0.5",
                isMine ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  isMine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-secondary-foreground"
                )}
              >
                {msg.text}
              </div>
              <span className="px-1 text-[10px] text-muted-foreground">
                {formatInTimeZone(new Date(msg.timestamp), 'America/New_York', 'h:mm a zzz')}
              </span>
            </div>
          )
        })}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-border pt-3"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="h-10 flex-1 border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim()}
          className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
