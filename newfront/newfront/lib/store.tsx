"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import type { User, Trip, Conversation, Message, TabId } from "./types"
import { mockUsers, mockTrips, mockConversations, mockMessages } from "./mock-data"
import * as api from "./api"
import { useAuth } from "./auth-context"

// ── Types ─────────────────────────────────────────────────────────────────────

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
  addTrip: (trip: Trip, coords?: {
    startLat?: number
    startLng?: number
    endLat?: number
    endLng?: number
  }) => void
  sendMessage: (recipientId: string, text: string) => void
  updateProfile: (updates: Partial<User>) => void
  requestToJoin: (tripId: string) => void
  archiveConversation: (otherUserId: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "hitch-data"

function normalizeGender(gender?: string): User["gender"] {
  const valid = ["male", "female", "non-binary", "prefer-not-to-say"]
  return valid.includes(gender ?? "") ? (gender as User["gender"]) : "prefer-not-to-say"
}


const STORAGE_VERSION = 2  // ← bump this any time you want to wipe cached data

function loadFromStorage(): Partial<AppState> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AppState> & { version?: number }
    // If version doesn't match, wipe the cache
    if (parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(state: AppState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,  // ← save version alongside data
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

/**
 * Maps a raw backend message row to the frontend Message shape.
 * conversationId is always the OTHER user's ID so it stays consistent
 * regardless of who sent the message.
 */
function mapBackendMessage(m: any, currentUserId: string): Message {
  const otherUserId =
    String(m.SENDER_ID) === currentUserId
      ? String(m.RECIPIENT_ID)
      : String(m.SENDER_ID)

  return {
    id: String(m.ID),
    conversationId: otherUserId, // ← key by other user, not a local conv id
    senderId: String(m.SENDER_ID),
    text: m.CONTENT,
    timestamp: m.CREATED_AT_UTC ?? m.CREATED_AT,
  }
}

/**
 * Maps a raw backend conversation row (from GET /messages/conversations/:userId)
 * to the frontend Conversation shape.
 */
function mapBackendConversation(row: any, currentUserId: string): Conversation {
  const otherId = String(row.OTHER_USER_ID)
  return {
    id: otherId, // ← keyed by other user's ID, matches conversationId in messages
    participantIds: [currentUserId, otherId],
    lastMessage: row.LAST_MESSAGE_CONTENT ?? "",
    lastMessageTime: row.LAST_MESSAGE_TIME_UTC ?? row.LAST_MESSAGE_TIME ?? new Date().toISOString(),
    unreadCount: 0,
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppStoreContext = createContext<AppStore | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()

  const [hydrated, setHydrated] = useState(false)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [trips, setTrips] = useState<Trip[]>(mockTrips)
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [activeTab, setActiveTab] = useState<TabId>("feed")
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  // Refs so polling intervals always see the latest values without re-registering
  const activeChatIdRef = useRef(activeChatId)
  const currentUserIdRef = useRef("")
  const previousMessageIdsRef = useRef<Set<string>>(new Set())
  
  useEffect(() => { activeChatIdRef.current = activeChatId }, [activeChatId])

  const currentUserId = authUser?.id ? String(authUser.id) : mockUsers[0]?.id ?? ""
  useEffect(() => { currentUserIdRef.current = currentUserId }, [currentUserId])

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Initialize previousMessageIdsRef with existing messages to avoid notifying on old messages
  useEffect(() => {
    if (hydrated && messages.length > 0 && previousMessageIdsRef.current.size === 0) {
      messages.forEach((msg) => previousMessageIdsRef.current.add(msg.id))
    }
  }, [hydrated, messages])

  // ── Sync auth user into users list ──────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return

    const mappedUser: User = {
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
      const idx = prev.findIndex((u) => u.id === mappedUser.id)
      if (idx === -1) return [mappedUser, ...prev]
      const updated = [...prev]
      updated[idx] = { ...updated[idx], ...mappedUser }
      return updated
    })

    api.setOnlineStatus(true)
    return () => { api.setOnlineStatus(false) }
  }, [authUser])

  // ── Initial hydration ────────────────────────────────────────────────────────
useEffect(() => {
  const load = async () => {
    const saved = loadFromStorage()
    if (saved) {
      if (saved.users) setUsers(saved.users)
      if (saved.trips) setTrips(saved.trips)
      // ← DO NOT restore conversations or messages from localStorage
      // They will be fetched fresh from the backend below
    }

    const [fetchedTrips, fetchedConvs] = await Promise.allSettled([
      api.getTrips({ sortBy: "recommendation" }),
      api.getConversations(),
    ])

    if (fetchedTrips.status === "fulfilled" && Array.isArray(fetchedTrips.value)) {
      setTrips(fetchedTrips.value as Trip[])
    }
    if (fetchedConvs.status === "fulfilled" && Array.isArray(fetchedConvs.value)) {
      const uid = String(authUser?.id ?? "")
      setConversations(
        (fetchedConvs.value as any[]).map((r) => mapBackendConversation(r, uid))
      )
    }

    setHydrated(true)
  }
  load()
}, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll trips every 10 s ────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const fetched = await api.getTrips({ sortBy: "recommendation" })
        console.log('[Store] getTrips returned:', fetched?.length || 0, 'trips', fetched)
        if (Array.isArray(fetched)) {
          console.log('[Store] Setting trips from API:', fetched)
          setTrips(fetched as Trip[])
          
          // Extract users from trip data and add them to the store
          const tripUsers = fetched.map((trip: any) => ({
            id: trip.userId,
            name: trip.userName || 'Unknown User',
            age: trip.userAge || null,
            gender: normalizeGender(trip.userGender),
            avatar: trip.userAvatar || '',
            bio: '',
            verified: true,
            tripsCompleted: 0,
            rating: 5,
          }))
          
          setUsers((prev) => {
            const userMap = new Map(prev.map(u => [u.id, u]))
            tripUsers.forEach(u => {
              if (!userMap.has(u.id)) {
                userMap.set(u.id, u)
              }
            })
            return Array.from(userMap.values())
          })
        }
      } catch (error) {
        console.error('[Store] Error fetching trips:', error)
      }
    }, 10_000)
    return () => clearInterval(id)
  }, [])

  // ── Poll active chat messages every 2 s ──────────────────────────────────────
  // Uses refs so the interval never needs to be torn down just because
  // activeChatId or currentUserId changed.
  useEffect(() => {
    const id = setInterval(async () => {
      const otherUserId = activeChatIdRef.current
      const myId = currentUserIdRef.current
      if (!otherUserId || !myId) return

      try {
        const fetched = await api.getMessages(otherUserId)
        if (!Array.isArray(fetched)) return

        const mapped = (fetched as any[]).map((m) => mapBackendMessage(m, myId))

        setMessages((prev) => {
          // Detect new messages from others (not sent by me)
          const newMessages = mapped.filter(
            (msg) => 
              !previousMessageIdsRef.current.has(msg.id) && 
              msg.senderId !== myId
          )

          // Show notifications for new messages
          if (newMessages.length > 0 && typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              console.log('[Store] Showing', newMessages.length, 'notifications')
              newMessages.forEach((msg) => {
                new Notification('New message', {
                  body: msg.text.length > 100 ? msg.text.substring(0, 97) + '...' : msg.text,
                  tag: msg.conversationId,
                })
              })
            }
          }

          // Update the set of seen message IDs
          mapped.forEach((msg) => previousMessageIdsRef.current.add(msg.id))

          // Remove old messages for this conversation, replace with fresh from backend
          const others = prev.filter((m) => m.conversationId !== otherUserId)
          return [...others, ...mapped]
        })

        // Also keep the conversation's lastMessage in sync
        if (mapped.length > 0) {
          const last = mapped[mapped.length - 1]
          setConversations((prev) =>
            prev.map((c) =>
              c.id === otherUserId
                ? { ...c, lastMessage: last.text, lastMessageTime: last.timestamp }
                : c
            )
          )
        }
      } catch (error) {
        console.error('[Store] Message poll error:', error)
      }
    }, 2_000)
    return () => clearInterval(id)
  }, []) // ← no dependencies - refs keep it current

  // ── Poll conversations list every 5 s to catch new chats ────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      const myId = currentUserIdRef.current
      if (!myId) return

      const fetched = await api.getConversations()
      if (!Array.isArray(fetched)) return

      setConversations((prev) => {
        const fromBackend = (fetched as any[]).map((r) =>
          mapBackendConversation(r, myId)
        )
        // Merge: keep any local-only convs (optimistic), update the rest
        const backendIds = new Set(fromBackend.map((c) => c.id))
        const localOnly = prev.filter((c) => !backendIds.has(c.id))
        return [...fromBackend, ...localOnly]
      })
    }, 5_000)
    return () => clearInterval(id)
  }, [])

  // ── Persist to localStorage ──────────────────────────────────────────────────
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

  // ── Derived ──────────────────────────────────────────────────────────────────
  const currentUser = users.find((u) => u.id === currentUserId) ?? mockUsers[0]

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  )

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addTrip = useCallback((trip: Trip, coords?: {
    startLat?: number
    startLng?: number
    endLat?: number
    endLng?: number
  }) => {
    setTrips((prev) => [trip, ...prev])
    api.createTrip({
      startLat: coords?.startLat,
      startLng: coords?.startLng,
      endLat: coords?.endLat,
      endLng: coords?.endLng,
      startLocation: trip.from,
      destination: trip.to,
      to: trip.to,
      from: trip.from,
      mode: trip.transportMode,
    }).catch((err) => {
      console.error("Failed to create trip:", err)
      setTrips((prev) => prev.filter((t) => t.id !== trip.id))
    })
  }, [])

  const sendMessage = useCallback(
    (recipientId: string, text: string) => {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: recipientId, // keyed by other user's ID
        senderId: currentUserId,
        text,
        timestamp: new Date().toISOString(),
      }

      // Optimistic update — message shows immediately
      setMessages((prev) => [...prev, newMsg])
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === recipientId)
        if (exists) {
          return prev.map((c) =>
            c.id === recipientId
              ? { ...c, lastMessage: text, lastMessageTime: newMsg.timestamp }
              : c
          )
        }
        // Create conversation entry if it doesn't exist yet
        return [
          {
            id: recipientId,
            participantIds: [currentUserId, recipientId],
            lastMessage: text,
            lastMessageTime: newMsg.timestamp,
            unreadCount: 0,
          },
          ...prev,
        ]
      })

      api.sendMessage(recipientId, text).catch((err) => {
        console.error("Failed to send message:", err)
        // Roll back optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== newMsg.id))
      })
    },
    [currentUserId]
  )

  const updateProfile = useCallback(
    (updates: Partial<User>) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUserId ? { ...u, ...updates } : u))
      )
      api.updateProfile(updates).catch((err) => {
        console.error("Failed to update profile:", err)
      })
    },
    [currentUserId]
  )

  const requestToJoin = useCallback(
    (tripId: string) => {
      const trip = trips.find((t) => t.id === tripId)
      if (!trip) return

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

      setActiveChatId(trip.userId)
      setActiveTab("messages")
      sendMessage(trip.userId, "Hi! I'd like to join your trip.")
    },
    [trips, conversations, currentUserId, sendMessage]
  )

  const archiveConversation = useCallback((otherUserId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== otherUserId))
    setMessages((prev) => prev.filter((m) => m.conversationId !== otherUserId))
    api.archiveConversation(otherUserId).catch((err) => {
      console.error("Failed to archive conversation:", err)
    })
  }, [])

  // ── Store value ───────────────────────────────────────────────────────────────
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
    archiveConversation,
  }

  if (!hydrated) return null

  return (
    <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
  )
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider")
  return ctx
}