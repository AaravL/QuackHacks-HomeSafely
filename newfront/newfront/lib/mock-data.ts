import type { User, Trip, Conversation, Message } from "./types"

export const CURRENT_USER_ID = "user-1"

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Alex Chen",
    age: 26,
    gender: "female",
    avatar: "",
    bio: "Grad student at Columbia. Usually heading home late after study sessions. Safety first!",
    verified: true,
    tripsCompleted: 14,
    rating: 4.9,
  },
  {
    id: "user-2",
    name: "Marcus Johnson",
    age: 29,
    gender: "male",
    avatar: "",
    bio: "Night shift nurse at Mount Sinai. Always looking for a walking buddy after work.",
    verified: true,
    tripsCompleted: 22,
    rating: 4.8,
  },
  {
    id: "user-3",
    name: "Priya Patel",
    age: 24,
    gender: "female",
    avatar: "",
    bio: "Software engineer, commute from Brooklyn to Manhattan daily. Love meeting new people!",
    verified: true,
    tripsCompleted: 8,
    rating: 5.0,
  },
  {
    id: "user-4",
    name: "Jordan Lee",
    age: 31,
    gender: "non-binary",
    avatar: "",
    bio: "Freelance photographer. Often out late for events. Prefer transit companions.",
    verified: false,
    tripsCompleted: 5,
    rating: 4.7,
  },
  {
    id: "user-5",
    name: "Sofia Rodriguez",
    age: 22,
    gender: "female",
    avatar: "",
    bio: "Barista working closing shifts. Would love someone to walk to the subway with!",
    verified: true,
    tripsCompleted: 11,
    rating: 4.9,
  },
  {
    id: "user-6",
    name: "David Kim",
    age: 27,
    gender: "male",
    avatar: "",
    bio: "Late-night coder. Always heading home from the office around midnight.",
    verified: true,
    tripsCompleted: 19,
    rating: 4.6,
  },
]

function futureDate(hoursFromNow: number): string {
  const d = new Date()
  d.setHours(d.getHours() + hoursFromNow)
  return d.toISOString()
}

// Trips are kept as fallback UI in case the backend is unavailable.
// The store will replace these with real backend data on load.
export const mockTrips: Trip[] = [
  {
    id: "trip-1",
    userId: "user-2",
    from: "Mount Sinai Hospital, Madison Ave",
    to: "96th St Subway Station",
    transportMode: "walking",
    departureTime: futureDate(2),
    notes: "Just finished my shift, would love company for the 10 min walk to the subway.",
    createdAt: new Date().toISOString(),
    status: "open",
  },
  {
    id: "trip-2",
    userId: "user-3",
    from: "Williamsburg, Brooklyn",
    to: "Union Square, Manhattan",
    transportMode: "transit",
    departureTime: futureDate(4),
    notes: "Taking the L train then transferring. Happy to wait a couple minutes.",
    createdAt: new Date().toISOString(),
    status: "open",
  },
  {
    id: "trip-3",
    userId: "user-4",
    from: "Bowery, Manhattan",
    to: "Astoria, Queens",
    transportMode: "transit",
    departureTime: futureDate(1),
    notes: "Heading home after a gallery opening. N/W train from 8th St.",
    createdAt: new Date().toISOString(),
    status: "open",
  },
  {
    id: "trip-4",
    userId: "user-5",
    from: "Blue Bottle Coffee, W Village",
    to: "Christopher St Station",
    transportMode: "walking",
    departureTime: futureDate(3),
    notes: "Short walk but it's dark by then. Would appreciate a buddy!",
    createdAt: new Date().toISOString(),
    status: "open",
  },
  {
    id: "trip-5",
    userId: "user-6",
    from: "Midtown East Office",
    to: "Penn Station",
    transportMode: "rideshare",
    departureTime: futureDate(6),
    notes: "Splitting a ride to Penn Station. Can fit 2 more people.",
    createdAt: new Date().toISOString(),
    status: "open",
  },
  {
    id: "trip-6",
    userId: "user-2",
    from: "Central Park West",
    to: "Harlem, 125th St",
    transportMode: "walking",
    departureTime: futureDate(5),
    notes: "Evening jog turned walk. Going through the park, safety in numbers.",
    createdAt: new Date().toISOString(),
    status: "open",
  },
]

// !! IMPORTANT !!
// Conversations and messages must be empty — they come entirely from the backend.
// Putting mock data here causes the store to poll /api/messages/conv-1 etc.
// which are fake IDs that don't exist in Snowflake, causing constant 404s.
export const mockConversations: Conversation[] = []
export const mockMessages: Message[] = []