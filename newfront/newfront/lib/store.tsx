"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import type { User, Trip, Conversation, Message, TabId } from "./types"
import {
  mockUsers,
  mockTrips,
  mockConversations,
  mockMessages,
} from "./mock-data"
import * as api from "./api"
import { useAuth } from "./auth-context"

interface AppState {
  currentUserId: string
  users: User[]
  trips: Trip[]
  conversations: Conversation[]
  messages: Message[]
  activeTab: TabId
  activeChatId: string | null
}

interface AppStore extends AppState {
  setActiveTab: (tab: TabId) => void
  setActiveChatId: (id: string | null) => void
  currentUser: User
  getUserById: (id: string) => User | undefined
  addTrip: (trip: Trip) => void
  sendMessage: (conversationId: string, text: string) => void
  updateProfile: (updates: Partial<User>) => void
  requestToJoin: (tripId: string) => void
}

const AppStoreContext = createContext<AppStore | null>(null)

const STORAGE_KEY = "hitch-data"

function normalizeGender(gender?: string): User["gender"] {
  if (gender === "male" || gender === "female" || gender === "non-binary" || gender === "prefer-not-to-say") {
    return gender
  }
  return "prefer-not-to-say"
}

function loadFromStorage(): Partial<AppState> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Partial<AppState>
  } catch {
    // ignore
  }
  return null
}

function saveToStorage(state: AppState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        users: state.users,
        trips: state.trips,
        conversations: state.conversations,
        messages: state.messages,
      })
    )
  } catch {
    // ignore
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const [hydrated, setHydrated] = useState(false)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [trips, setTrips] = useState<Trip[]>(mockTrips)
  const [conversations, setConversations] =
    useState<Conversation[]>(mockConversations)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [activeTab, setActiveTab] = useState<TabId>("feed")
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const currentUserId = authUser?.id ? String(authUser.id) : mockUsers[0]?.id ?? ""

  useEffect(() => {
    if (!authUser) return

    const mappedAuthUser: User = {
      id: String(authUser.id),
      name: authUser.name,
      age: authUser.age,
      gender: normalizeGender(authUser.gender),
      avatar: "",
      bio: "",
      verified: true,
      tripsCompleted: 0,
      rating: 5,
    }

    setUsers((prev) => {
      const existingIndex = prev.findIndex((u) => u.id === mappedAuthUser.id)
      if (existingIndex === -1) {
        return [mappedAuthUser, ...prev]
      }

      const updated = [...prev]
      updated[existingIndex] = { ...updated[existingIndex], ...mappedAuthUser }
      return updated
    })
  }, [authUser])

  // Hydrate from localStorage and fetch from backend on mount
  useEffect(() => {
    const loadData = async () => {
      const saved = loadFromStorage()
      if (saved) {
        if (saved.users) setUsers(saved.users)
        if (saved.trips) setTrips(saved.trips)
        if (saved.conversations) setConversations(saved.conversations)
        if (saved.messages) setMessages(saved.messages)
      }

      // Fetch fresh data from backend
      try {
        const fetchedTrips = await api.getTrips()
        if (fetchedTrips && Array.isArray(fetchedTrips)) {
          setTrips(fetchedTrips)
        } else if (fetchedTrips === null) {
          console.info('Using mock trips (backend unavailable)')
        }
      } catch (error) {
        console.error('Failed to fetch trips from backend:', error)
        // Fall back to mock data already set
      }

      try {
        const fetchedConversations = await api.getConversations()
        if (fetchedConversations && Array.isArray(fetchedConversations)) {
          setConversations(fetchedConversations)
        } else if (fetchedConversations === null) {
          console.info('Using mock conversations (backend unavailable)')
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      }

      setHydrated(true)
    }

    loadData()
  }, [])

  // Poll for new trips every 5 seconds to sync across browsers
  useEffect(() => {
    const pollTrips = async () => {
      try {
        const fetchedTrips = await api.getTrips()
        if (fetchedTrips && Array.isArray(fetchedTrips)) {
          setTrips(fetchedTrips)
        }
      } catch (error) {
        // Silent fail on polling errors
      }
    }

    const interval = setInterval(pollTrips, 5000)
    return () => clearInterval(interval)
  }, [])

  // Poll for new messages and conversations every 2 seconds for real-time chat
  useEffect(() => {
    if (!currentUserId) return

    const pollMessages = async () => {
      try {
        const fetchedConversations = await api.getConversations()
        if (fetchedConversations && Array.isArray(fetchedConversations)) {
          setConversations(fetchedConversations)
        }

        // Also fetch messages for each conversation
        for (const conv of conversations) {
          try {
            const fetchedMessages = await api.getMessages(conv.id)
            if (fetchedMessages && Array.isArray(fetchedMessages)) {
              setMessages((prev) => {
                // Replace messages for this conversation, keep others
                const otherMsgs = prev.filter((m) => m.conversationId !== conv.id)
                return [...otherMsgs, ...fetchedMessages]
              })
            }
          } catch {
            // Silent fail per message
          }
        }
      } catch (error) {
        // Silent fail on polling errors
      }
    }

    const interval = setInterval(pollMessages, 2000)
    return () => clearInterval(interval)
  }, [currentUserId, conversations])

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (!hydrated) return
    saveToStorage({
      currentUserId,
      users,
      trips,
      conversations,
      messages,
      activeTab,
      activeChatId,
    })
  }, [hydrated, currentUserId, users, trips, conversations, messages, activeTab, activeChatId])

  const currentUser =
    users.find((u) => u.id === currentUserId) ?? mockUsers[0]

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  )

  const addTrip = useCallback((trip: Trip) => {
    // Create trip via API
    api.createTrip({
      from: trip.from,
      to: trip.to,
      mode: trip.transportMode,
    }).then(() => {
      setTrips((prev) => [trip, ...prev])
    }).catch(error => {
      console.error('Failed to create trip:', error)
      // Optimistically add to UI
      setTrips((prev) => [trip, ...prev])
    })
  }, [])

  const sendMessage = useCallback(
    (conversationId: string, text: string) => {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        text,
        timestamp: new Date().toISOString(),
      }
      
      // Send via API
      api.sendMessage(conversationId, text).catch(error => {
        console.error('Failed to send message:', error)
      })
      
      // Optimistically update UI
      setMessages((prev) => [...prev, newMsg])
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: text, lastMessageTime: newMsg.timestamp }
            : c
        )
      )
    },
    [currentUserId]
  )

  const updateProfile = useCallback((updates: Partial<User>) => {
    // Update via API
    api.updateProfile(updates).catch(error => {
      console.error('Failed to update profile:', error)
    })
    
    // Optimistically update UI
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUserId ? { ...u, ...updates } : u
      )
    )
  }, [currentUserId])

  const requestToJoin = useCallback(
    (tripId: string) => {
      const trip = trips.find((t) => t.id === tripId)
      if (!trip) return

      // Check if conversation already exists
      const existing = conversations.find(
        (c) =>
          c.participantIds.includes(currentUserId) &&
          c.participantIds.includes(trip.userId)
      )

      if (existing) {
        setActiveChatId(existing.id)
        setActiveTab("messages")
        return
      }

      // Join trip via API
      api.joinTrip(tripId).catch(error => {
        console.error('Failed to join trip:', error)
      })

      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        participantIds: [currentUserId, trip.userId],
        lastMessage: "Hi! I'd like to join your trip.",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      }

      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: newConv.id,
        senderId: currentUserId,
        text: "Hi! I'd like to join your trip.",
        timestamp: new Date().toISOString(),
      }

      setConversations((prev) => [newConv, ...prev])
      setMessages((prev) => [...prev, newMsg])
      setActiveChatId(newConv.id)
      setActiveTab("messages")
    },
    [trips, conversations, currentUserId]
  )

  const store: AppStore = {
    currentUserId,
    users,
    trips,
    conversations,
    messages,
    activeTab,
    activeChatId,
    setActiveTab,
    setActiveChatId,
    currentUser,
    getUserById,
    addTrip,
    sendMessage,
    updateProfile,
    requestToJoin,
  }

  if (!hydrated) {
    return null
  }

  return (
    <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
  )
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider")
  return ctx
}
