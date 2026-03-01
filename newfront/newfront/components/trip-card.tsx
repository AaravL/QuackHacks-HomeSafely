"use client"

import { formatDistanceToNow } from "date-fns"
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
import type { Trip, User } from "@/lib/types"
import { cn } from "@/lib/utils"

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
  if (!user) return null

  const mode = modeConfig[trip.transportMode]
  const ModeIcon = mode.icon
  const departureDate = new Date(trip.departureTime)
  const isUpcoming = departureDate > new Date()
  const timeLabel = isUpcoming
    ? `in ${formatDistanceToNow(departureDate)}`
    : `${formatDistanceToNow(departureDate)} ago`

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="overflow-hidden border-border/60 bg-card transition-all hover:border-primary/30">
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header: user info + mode badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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
                  ? ""
                  : user.gender.charAt(0).toUpperCase() +
                    user.gender.slice(1)}
              </span>
            </div>
          </div>
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
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate text-sm text-foreground">{trip.from}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <MapPin className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <span className="truncate text-sm text-foreground">{trip.to}</span>
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

        {/* Footer: time + action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeLabel}</span>
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
          {isOwn && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Your trip
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
