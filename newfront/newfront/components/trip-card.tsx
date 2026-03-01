"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import {
  MapPin,
  ArrowRight,
  Clock,
  Footprints,
  TrainFront,
  Car,
  ShieldCheck,
  Navigation,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Trip, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Helper to get auth headers (matching api.ts pattern)
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("authToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const modeConfig = {
  walking: { icon: Footprints, label: "Walking", className: "bg-primary/15 text-primary" },
  transit: { icon: TrainFront, label: "Transit", className: "bg-chart-3/20 text-chart-3" },
  rideshare: { icon: Car, label: "Rideshare", className: "bg-accent/15 text-accent" },
}

interface TripCardProps {
  trip: Trip
  user: User | undefined
  onRequestJoin: (tripId: string) => void
  isOwn?: boolean
}

export function TripCard({ trip, user, onRequestJoin, isOwn }: TripCardProps) {
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [companionEmail, setCompanionEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) return null

  const mode = modeConfig[trip.transportMode]
  const ModeIcon = mode.icon
  const departureDate = new Date(trip.departureTime)
  const isUpcoming = departureDate > new Date()
  const timeLabel = isUpcoming
    ? `in ${formatDistanceToNow(departureDate)}`
    : `${formatDistanceToNow(departureDate)} ago`
  
  // Show time in EST
  const estTimeStr = formatInTimeZone(departureDate, 'America/New_York', 'MMM d, h:mm a zzz')

  const visibilityParts: string[] = []
  if (trip.visibleToGender) {
    visibilityParts.push(`Gender: ${trip.visibleToGender}`)
  }
  if (trip.visibleToAgeMin != null || trip.visibleToAgeMax != null) {
    if (trip.visibleToAgeMin != null && trip.visibleToAgeMax != null) {
      visibilityParts.push(`Age: ${trip.visibleToAgeMin}-${trip.visibleToAgeMax}`)
    } else if (trip.visibleToAgeMin != null) {
      visibilityParts.push(`Age: ${trip.visibleToAgeMin}+`)
    } else if (trip.visibleToAgeMax != null) {
      visibilityParts.push(`Age: up to ${trip.visibleToAgeMax}`)
    }
  }
  if (trip.visibleToUniversity) {
    visibilityParts.push(
      trip.visibleToUniversity === "same"
        ? "University: same as you"
        : `University: ${trip.visibleToUniversity}`
    )
  }
  const visibilityLabel =
    visibilityParts.length > 0 ? visibilityParts.join(" • ") : "Visible to everyone"

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  async function handleCompleteTrip() {
    if (!companionEmail.trim()) {
      toast.error("Please enter your companion's email")
      return
    }

    setIsSubmitting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      const url = `${apiUrl}/posts/${trip.id}/complete`
      console.log('[Trip completion] Calling:', url)
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ companionEmail: companionEmail.trim() }),
      })

      console.log('[Trip completion] Response status:', response.status)
      
      // Read response body once
      const responseText = await response.text()
      console.log('[Trip completion] Raw response:', responseText.substring(0, 200))
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        console.error('[Trip completion] Invalid response:', responseText.substring(0, 500))
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`)
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      console.log('[Trip completion] Success! Response:', data)
      toast.success("Trip marked as completed! 🎉")
      setShowCompletionModal(false)
      setCompanionEmail("")
      
      // Refresh trips data - store polling will handle updating user count
      if (typeof window !== "undefined") {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        try {
          const refreshResponse = await fetch(`${apiUrl}/posts?sortBy=recommendation`, {
            headers: getAuthHeaders(),
          })
          console.log('[Trip completion] Refreshed trips data')
        } catch (refreshError) {
          console.log('[Trip completion] Refresh (non-critical):', refreshError)
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark trip as completed")
      console.error('[Trip completion] Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card transition-all hover:border-primary/30">
        <CardContent className="flex flex-col gap-3 p-4">
          {/* Header: user info + mode badge */}
          <div className="flex items-center justify-between">
            <Drawer>
              <DrawerTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-md text-left transition-colors hover:bg-secondary/40">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {user.name}
                      </span>
                      {user.verified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {user.age} &middot;{" "}
                      {user.gender === "prefer-not-to-say"
                        ? "Not specified"
                        : user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                    </span>
                  </div>
                </button>
              </DrawerTrigger>
              <DrawerContent className="border-border bg-card">
                <DrawerHeader>
                  <DrawerTitle className="text-foreground">{user.name}</DrawerTitle>
                </DrawerHeader>
                <div className="space-y-2 px-4 pb-6 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Age:</span> {user.age}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Gender:</span>{" "}
                    {user.gender === "prefer-not-to-say"
                      ? "Not specified"
                      : user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">University:</span>{" "}
                    {user.university || "Not specified"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Trips Completed:</span>{" "}
                    {user.tripsCompleted || 0}
                  </p>
                </div>
              </DrawerContent>
            </Drawer>
            <Badge
              variant="secondary"
              className={cn("gap-1 text-xs font-medium", mode.className)}
            >
              <ModeIcon className="h-3 w-3" />
              {mode.label}
            </Badge>
          </div>

          {/* Route */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 rounded-lg bg-secondary/50 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate text-sm text-foreground">{trip.from}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <MapPin className="h-3.5 w-3.5 shrink-0 text-destructive" />
                <span className="truncate text-sm text-foreground">{trip.to}</span>
              </div>
            </div>
            {trip.tripDistance && (
              <div className="flex items-center gap-1.5 px-3 text-xs text-muted-foreground">
                <Navigation className="h-3 w-3" />
                <span>{trip.tripDistance} miles</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {trip.notes && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {trip.notes}
            </p>
          )}

          {isOwn && (
            <div className="rounded-lg border border-border/70 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Visibility:</span> {visibilityLabel}
            </div>
          )}

          {/* Footer: time + action */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>{timeLabel}</span>
              </div>
              <span className="text-xs text-muted-foreground/70">{estTimeStr}</span>
            </div>
            {!isOwn && (
              <Button
                size="sm"
                onClick={() => onRequestJoin(trip.id)}
                className="h-8 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Request to Join
              </Button>
            )}
            {isOwn && !isUpcoming && trip.status !== "completed" && (
              <Button
                size="sm"
                onClick={() => setShowCompletionModal(true)}
                className="h-8 rounded-full bg-green-600 px-4 text-xs font-semibold text-white hover:bg-green-700"
              >
                Mark Complete
              </Button>
            )}
            {isOwn && trip.status === "completed" && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                Completed
              </Badge>
            )}
            {isOwn && isUpcoming && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Your trip
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="w-full max-w-sm rounded-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Mark Trip as Completed</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Did this trip happen? If so, enter the email of the person you went with.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Companion's email"
              type="email"
              value={companionEmail}
              onChange={(e) => setCompanionEmail(e.target.value)}
              className="border-border"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCompletionModal(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteTrip}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
