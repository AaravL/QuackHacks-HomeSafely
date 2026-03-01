"use client"

import { useState, useMemo } from "react"
import { Search, SlidersHorizontal, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TripCard } from "@/components/trip-card"
import { useAppStore } from "@/lib/store"
import { CURRENT_USER_ID } from "@/lib/mock-data"
import type { TransportMode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const filters: { id: TransportMode | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "walking", label: "Walking" },
  { id: "transit", label: "Transit" },
  { id: "rideshare", label: "Rideshare" },
]

export function TripFeed() {
  const { trips, getUserById, requestToJoin } = useAppStore()
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<TransportMode | "all">("all")

  const filteredTrips = useMemo(() => {
    return trips
      .filter((t) => t.status === "open")
      .filter((t) => {
        if (activeFilter !== "all" && t.transportMode !== activeFilter)
          return false
        if (search) {
          const q = search.toLowerCase()
          return (
            t.from.toLowerCase().includes(q) ||
            t.to.toLowerCase().includes(q) ||
            getUserById(t.userId)?.name.toLowerCase().includes(q)
          )
        }
        return true
      })
  }, [trips, activeFilter, search, getUserById])

  function handleJoin(tripId: string) {
    requestToJoin(tripId)
    toast.success("Request sent! Opening chat...")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Explore Trips
          </h1>
          <p className="text-xs text-muted-foreground">
            Find a companion for your commute
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-4.5 w-4.5 text-primary" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by location or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 border-border bg-secondary pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              activeFilter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Trip list */}
      <div className="flex flex-col gap-3 pb-4">
        {filteredTrips.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No trips found. Try adjusting your search.
            </p>
          </div>
        )}
        {filteredTrips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            user={getUserById(trip.userId)}
            onRequestJoin={handleJoin}
            isOwn={trip.userId === CURRENT_USER_ID}
          />
        ))}
      </div>
    </div>
  )
}
