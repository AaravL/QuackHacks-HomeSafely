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
  SlidersHorizontal,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { LocationPicker } from "@/components/location-picker"
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
  const [fromLat, setFromLat] = useState(40.7128)
  const [fromLng, setFromLng] = useState(-74.006)
  const [to, setTo] = useState("")
  const [toLat, setToLat] = useState(40.7138)
  const [toLng, setToLng] = useState(-74.001)
  const [mode, setMode] = useState<TransportMode>("walking")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([])
  const [loadingTips, setLoadingTips] = useState(false)
  const [visibleToGender, setVisibleToGender] = useState<string>("all")
  const [visibleToAgeMin, setVisibleToAgeMin] = useState<string>("")
  const [visibleToAgeMax, setVisibleToAgeMax] = useState<string>("")
  const [visibleToUniversity, setVisibleToUniversity] = useState<string>("all")

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

    const minAge = visibleToAgeMin ? parseInt(visibleToAgeMin, 10) : null
    const maxAge = visibleToAgeMax ? parseInt(visibleToAgeMax, 10) : null
    if (
      minAge !== null &&
      maxAge !== null &&
      !Number.isNaN(minAge) &&
      !Number.isNaN(maxAge) &&
      minAge > maxAge
    ) {
      toast.error("Minimum age cannot be greater than maximum age")
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
      visibleToGender: visibleToGender === "all" ? null : visibleToGender,
      visibleToAgeMin: minAge,
      visibleToAgeMax: maxAge,
      visibleToUniversity: visibleToUniversity === "all" ? null : visibleToUniversity,
    }, {
      startLat: fromLat,
      startLng: fromLng,
      endLat: toLat,
      endLng: toLng,
    })

    toast.success("Trip posted! (Your previous trip was replaced)")
    setFrom("")
    setTo("")
    setMode("walking")
    setDate("")
    setTime("")
    setNotes("")
    setSafetyTips([])
    setVisibleToGender("all")
    setVisibleToAgeMin("")
    setVisibleToAgeMax("")
    setVisibleToUniversity("all")
    setActiveTab("feed")
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Post a Trip
        </h1>
        <p className="text-xs text-muted-foreground">
          Find a companion for your next journey • You can only have one active trip at a time
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* From */}
        <LocationPicker
          label="Starting Point"
          value={from}
          onChange={(address, lat, lng) => {
            setFrom(address)
            setFromLat(lat)
            setFromLng(lng)
          }}
          placeholder="Where are you leaving from?"
        />

        {/* To */}
        <LocationPicker
          label="Destination"
          value={to}
          onChange={(address, lat, lng) => {
            setTo(address)
            setToLat(lat)
            setToLng(lng)
          }}
          placeholder="Where are you heading?"
        />

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
                min={new Date().toISOString().split('T')[0]}
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

        {/* Visibility Filters */}
        <Card className="border-border/60 bg-card">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Who Can See This Trip
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Control who can see and join your trip
            </p>

            {/* Gender Filter */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visibleGender" className="text-xs font-medium text-muted-foreground">
                Gender
              </Label>
              <select
                id="visibleGender"
                value={visibleToGender}
                onChange={(e) => setVisibleToGender(e.target.value)}
                className="h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Genders</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
                <option value="non-binary">Non-Binary Only</option>
              </select>
            </div>

            {/* Age Range Filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Age Range (optional)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min age"
                  value={visibleToAgeMin}
                  onChange={(e) => setVisibleToAgeMin(e.target.value)}
                  className="h-10 border-border bg-secondary text-sm text-foreground"
                  min="18"
                  max="100"
                />
                <Input
                  type="number"
                  placeholder="Max age"
                  value={visibleToAgeMax}
                  onChange={(e) => setVisibleToAgeMax(e.target.value)}
                  className="h-10 border-border bg-secondary text-sm text-foreground"
                  min="18"
                  max="100"
                />
              </div>
            </div>

            {/* University Filter */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visibleUniversity" className="text-xs font-medium text-muted-foreground">
                University
              </Label>
              <select
                id="visibleUniversity"
                value={visibleToUniversity}
                onChange={(e) => setVisibleToUniversity(e.target.value)}
                className="h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Universities</option>
                <option value="Stevens Institute of Technology">Stevens Institute of Technology</option>
                <option value="Cornell University">Cornell University</option>
                <option value="same">Same University Only</option>
              </select>
            </div>
          </CardContent>
        </Card>

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
