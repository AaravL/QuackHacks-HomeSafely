"use client"

import { useState, useCallback, useRef } from "react"
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { MapPin, Loader2 } from "lucide-react"

const libraries: ("places")[] = ["places"]

interface LocationPickerProps {
  label: string
  value: string
  onChange: (address: string, lat: number, lng: number) => void
  placeholder?: string
}

export function LocationPicker({ label, value, onChange, placeholder }: LocationPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  const center = marker || {
    lat: 40.7128, // NYC default
    lng: -74.006,
  }

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address || place.name || ""
        
        setMarker({ lat, lng })
        onChange(address, lat, lng)
        
        if (map) {
          map.panTo({ lat, lng })
          map.setZoom(15)
        }
      }
    }
  }

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setMarker({ lat, lng })
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          onChange(results[0].formatted_address, lat, lng)
        } else {
          onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng)
        }
      })
    }
  }

  if (loadError) {
    return (
      <div className="space-y-2">
        <Label htmlFor={label}>{label}</Label>
        <Input
          id={label}
          value={value}
          onChange={(e) => onChange(e.target.value, 0, 0)}
          placeholder={placeholder || "Enter address"}
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">
          ⚠️ Google Maps failed to load. Add your API key to .env
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-background">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>
        <MapPin className="inline h-3.5 w-3.5 mr-1" />
        {label}
      </Label>
      
      <Autocomplete
        onLoad={(autocomplete) => { autocompleteRef.current = autocomplete }}
        onPlaceChanged={onPlaceChanged}
      >
        <Input
          id={label}
          value={value}
          onChange={(e) => onChange(e.target.value, 0, 0)}
          placeholder={placeholder || "Search or click on map"}
          className="h-10"
        />
      </Autocomplete>

      <Card className="overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '200px' }}
          center={center}
          zoom={marker ? 15 : 11}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      </Card>
      
      <p className="text-xs text-muted-foreground">
        Search for an address or click on the map
      </p>
    </div>
  )
}
