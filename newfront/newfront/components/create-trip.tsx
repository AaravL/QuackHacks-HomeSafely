"use client"

import { useState } from "react"
import {
  MapPin,
  Navigation,
  Footprints,
  TrainFront,
  Car,
  CalendarDays,
  Clock,
  Sparkles,
  Loader2,
  StickyNote,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import type { TransportMode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const transportOptions: {
  id: TransportMode
  label: string
  icon: typeof Footprints
}[] = [
  { id: "walking", label: "Walking", icon: Footprints },
  { id: "transit", label: "Transit", icon: TrainFront },
  { id: "rideshare", label: "Rideshare", icon: Car },
]

interface SafetyTip {
  tip: string
}

export function CreateTrip() {
  const { addTrip, setActiveTab, currentUserId } = useAppStore()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [mode, setMode] = useState<TransportMode>("walking")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([])
  const [loadingTips, setLoadingTips] = useState(false)

  async function fetchSafetyTips() {
    if (!from || !to) {
      toast.error("Enter both locations first")
      return
    }
    setLoadingTips(true)
    try {
      const res = await fetch("/api/safety-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, mode }),
      })
      const data = await res.json()
      setSafetyTips(data.tips ?? [])
    } catch {
      setSafetyTips([
        { tip: "Stay on well-lit streets and main roads." },
        { tip: "Share your live location with a trusted contact." },
        { tip: "Keep your phone charged and accessible." },
      ])
    } finally {
      setLoadingTips(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!from || !to || !date || !time) {
      toast.error("Please fill in all required fields")
      return
    }

    const departureTime = new Date(`${date}T${time}`).toISOString()

    addTrip({
      id: `trip-${Date.now()}`,
      userId: currentUserId,
      from,
      to,
      transportMode: mode,
      departureTime,
      notes,
      createdAt: new Date().toISOString(),
      status: "open",
    })

    toast.success("Trip posted successfully!")
    setFrom("")
    setTo("")
    setMode("walking")
    setDate("")
    setTime("")
    setNotes("")
    setSafetyTips([])
    setActiveTab("feed")
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Post a Trip
        </h1>
        <p className="text-xs text-muted-foreground">
          Find a companion for your next journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* From */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from" className="text-xs font-medium text-muted-foreground">
            Starting Point
          </Label>
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              id="from"
              placeholder="Where are you leaving from?"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 border-border bg-secondary pl-10 text-sm text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        {/* To */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to" className="text-xs font-medium text-muted-foreground">
            Destination
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
            <Input
              id="to"
              placeholder="Where are you heading?"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 border-border bg-secondary pl-10 text-sm text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        {/* Transport Mode */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Transport Mode
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {transportOptions.map((opt) => {
              const Icon = opt.icon
              const isSelected = mode === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date" className="text-xs font-medium text-muted-foreground">
              Date
            </Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 border-border bg-secondary pl-10 text-sm text-foreground"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="time" className="text-xs font-medium text-muted-foreground">
              Time
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 border-border bg-secondary pl-10 text-sm text-foreground"
                required
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
            <StickyNote className="mr-1 inline h-3 w-3" />
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Any details your companion should know..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* AI Safety Tips */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  AI Safety Tips
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchSafetyTips}
                disabled={loadingTips}
                className="h-7 text-xs text-primary hover:bg-primary/10 hover:text-primary"
              >
                {loadingTips ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-3 w-3" />
                )}
                Get Tips
              </Button>
            </div>
            {safetyTips.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {safetyTips.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {t.tip}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter your route above, then tap "Get Tips" for AI-powered
                safety recommendations.
              </p>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="h-12 rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Post Trip
        </Button>
      </form>
    </div>
  )
}
