"use client";

// src/components/gemini-call.tsx  (or wherever you're placing it)
import React, { useMemo, useRef, useState } from "react";
import { geminiChat } from "@/lib/api";

type Role = "user" | "assistant";
type Msg = { id: string; role: Role; text: string; ts: number };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  u.pitch = 1.0;
  window.speechSynthesis.speak(u);
}

export default function GeminiCallTab() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: "assistant",
      text: "Hey honey — I’m here. Want to talk while you walk? Where are you starting from?",
      ts: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);

  const listRef = useRef<HTMLDivElement | null>(null);

  const last10 = useMemo(() => {
    return messages.slice(-10).map(({ role, text }) => ({ role, text }));
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Msg = { id: uid(), role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      // ✅ Use your centralized API helper
      const { reply } = await geminiChat(text, last10);
      const botText = reply?.trim() || "Sorry — I blanked. Say that again?";

      const botMsg: Msg = { id: uid(), role: "assistant", text: botText, ts: Date.now() };
      setMessages((m) => [...m, botMsg]);

      if (speakReplies) speak(botText);
    } catch (e: any) {
      const botMsg: Msg = {
        id: uid(),
        role: "assistant",
        text: `Something went wrong talking to Gemini: ${e?.message ?? "unknown error"}`,
        ts: Date.now(),
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setSending(false);
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 0);
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      <div style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ fontWeight: 700 }}>Walk Home Companion</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Type a message — Gemini replies like a caring parent “on the phone”.
        </div>

        <label style={{ display: "inline-flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={speakReplies}
            onChange={(e) => setSpeakReplies(e.target.checked)}
          />
          <span style={{ fontSize: 13 }}>Speak replies</span>
        </label>
      </div>

      <div ref={listRef} style={{ flex: 1, overflow: "auto", padding: 12, background: "#fafafa" }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "10px 12px",
                borderRadius: 14,
                background: m.role === "user" ? "#dbeafe" : "white",
                border: "1px solid #e5e5e5",
                lineHeight: 1.35,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && <div style={{ fontSize: 12, opacity: 0.7, paddingLeft: 4 }}>…typing</div>}
      </div>

      <div style={{ padding: 12, borderTop: "1px solid #e5e5e5", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Say something… (e.g., ‘pretend you’re my mom on the phone’)"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: sending ? "#f3f4f6" : "white",
            cursor: sending ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}