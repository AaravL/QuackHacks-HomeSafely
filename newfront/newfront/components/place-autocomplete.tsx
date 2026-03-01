"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export interface PlaceResult {
  address: string
  lat: number
  lng: number
}

interface PlaceAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: PlaceResult) => void
  placeholder?: string
  id?: string
  className?: string
  required?: boolean
  /** Icon slot (e.g. for Navigation or MapPin) — render left of input */
  icon?: React.ReactNode
}

// Minimal types for Google Maps Places (no @types/google.maps required)
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { types?: string[]; fields?: string[] }
          ) => {
            getPlace: () => {
              formatted_address?: string
              geometry?: { location: { lat: () => number; lng: () => number } }
            }
            addListener: (event: string, fn: () => void) => { remove: () => void }
          }
        }
        event?: { clearInstanceListeners?: (instance: unknown) => void }
      }
    }
  }
}

export function PlaceAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  id,
  className,
  required,
  icon,
}: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<unknown>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !scriptLoaded || !inputRef.current || autocompleteRef.current) return

    const g = window.google
    if (!g?.maps?.places) return

    const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["formatted_address", "geometry"],
    })

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      const addr = place.formatted_address ?? ""
      const location = place.geometry?.location
      if (addr) onChange(addr)
      if (location && onPlaceSelect) {
        onPlaceSelect({
          address: addr,
          lat: location.lat(),
          lng: location.lng(),
        })
      }
    })

    autocompleteRef.current = autocomplete
    return () => {
      listener?.remove?.()
      autocompleteRef.current = null
    }
  }, [scriptLoaded, onChange, onPlaceSelect])

  const input = (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 [&>svg]:size-4 [&>svg]:shrink-0 text-muted-foreground">
          {icon}
        </span>
      )}
      <Input
        ref={inputRef}
        type="text"
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground",
          icon && "pl-10",
          className
        )}
        required={required}
        autoComplete="off"
      />
    </div>
  )

  if (!GOOGLE_MAPS_API_KEY) {
    return input
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      {input}
    </>
  )
}
