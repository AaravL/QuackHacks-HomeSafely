"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Loader2 } from "lucide-react"

type Message = {
  role: "user" | "assistant"
  text: string
}

export function CompanionChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi sweetheart. I’m here with you. Are you walking home right now?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", text: input }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:3001/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: input,
          history: updatedMessages,
          mode: "walk-home-companion",
        }),
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()

      const assistantReply: Message = {
        role: "assistant",
        text: data.reply || "I’m here. Tell me that again.",
      }

      setMessages((prev) => [...prev, assistantReply])
    } catch (err) {
      console.error("Companion error:", err)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Hmm… I’m having a little trouble connecting. Stay with me a second.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Messages */}
      <div className="flex flex-1 flex-col gap-3 pb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-20 left-0 right-0 mx-auto flex max-w-md items-center gap-2 bg-background px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Talk to me..."
          className="flex-1 rounded-full border border-border bg-muted px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}