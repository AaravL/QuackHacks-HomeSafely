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
  CURRENT_USER_ID,
} from "./mock-data"

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

const STORAGE_KEY = "homesafely-data"

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
  const [hydrated, setHydrated] = useState(false)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [trips, setTrips] = useState<Trip[]>(mockTrips)
  const [conversations, setConversations] =
    useState<Conversation[]>(mockConversations)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [activeTab, setActiveTab] = useState<TabId>("feed")
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      if (saved.users) setUsers(saved.users)
      if (saved.trips) setTrips(saved.trips)
      if (saved.conversations) setConversations(saved.conversations)
      if (saved.messages) setMessages(saved.messages)
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (!hydrated) return
    saveToStorage({
      currentUserId: CURRENT_USER_ID,
      users,
      trips,
      conversations,
      messages,
      activeTab,
      activeChatId,
    })
  }, [hydrated, users, trips, conversations, messages, activeTab, activeChatId])

  const currentUser =
    users.find((u) => u.id === CURRENT_USER_ID) ?? mockUsers[0]

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  )

  const addTrip = useCallback((trip: Trip) => {
    setTrips((prev) => [trip, ...prev])
  }, [])

  const sendMessage = useCallback(
    (conversationId: string, text: string) => {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: CURRENT_USER_ID,
        text,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, newMsg])
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: text, lastMessageTime: newMsg.timestamp }
            : c
        )
      )
    },
    []
  )

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === CURRENT_USER_ID ? { ...u, ...updates } : u
      )
    )
  }, [])

  const requestToJoin = useCallback(
    (tripId: string) => {
      const trip = trips.find((t) => t.id === tripId)
      if (!trip) return

      // Check if conversation already exists
      const existing = conversations.find(
        (c) =>
          c.participantIds.includes(CURRENT_USER_ID) &&
          c.participantIds.includes(trip.userId)
      )

      if (existing) {
        setActiveChatId(existing.id)
        setActiveTab("messages")
        return
      }

      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        participantIds: [CURRENT_USER_ID, trip.userId],
        lastMessage: "Hi! I'd like to join your trip.",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      }

      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: newConv.id,
        senderId: CURRENT_USER_ID,
        text: "Hi! I'd like to join your trip.",
        timestamp: new Date().toISOString(),
      }

      setConversations((prev) => [newConv, ...prev])
      setMessages((prev) => [...prev, newMsg])
      setActiveChatId(newConv.id)
      setActiveTab("messages")
    },
    [trips, conversations]
  )

  const store: AppStore = {
    currentUserId: CURRENT_USER_ID,
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
