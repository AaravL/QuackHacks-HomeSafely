export type TransportMode = "walking" | "transit" | "rideshare"

export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say"

export interface User {
  id: string
  name: string
  age: number
  gender: Gender
  avatar: string
  bio: string
  verified: boolean
  tripsCompleted: number
  rating: number
}

export interface Trip {
  id: string
  userId: string
  from: string
  to: string
  transportMode: TransportMode
  departureTime: string // ISO string
  notes: string
  createdAt: string
  status: "open" | "matched" | "completed"
  tripDistance?: number | null // Distance in miles
  visibleToGender?: string | null
  visibleToAgeMin?: number | null
  visibleToAgeMax?: number | null
  visibleToUniversity?: string | null
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  timestamp: string
}

export interface Conversation {
  id: string
  participantIds: string[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export type TabId = "feed" | "create" | "messages" | "profile" | "companion"