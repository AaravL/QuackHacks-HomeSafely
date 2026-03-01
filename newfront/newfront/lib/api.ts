import type { TransportMode } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('currentUser')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.id ? String(parsed.id) : null
  } catch {
    return null
  }
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('authToken')
  if (!token) {
    console.warn('[getAuthHeaders] No authToken found in localStorage')
  } else {
    console.log('[getAuthHeaders] Token found:', token.substring(0, 20) + '...')
  }
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function safeJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    console.error('[safeJson] Non-JSON response:', { status: res.status, text: text.slice(0, 500) })
    throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  if (!res.ok) {
    console.error('[safeJson] Request failed:', { 
      status: res.status, 
      statusText: res.statusText, 
      data 
    })
    throw new Error(data?.error || data?.message || `Request failed: ${res.status}`)
  }
  return data as T
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await safeJson<{ token: string; user: any }>(res)
  if (data.token) localStorage.setItem('authToken', data.token)
  if (data.user) localStorage.setItem('currentUser', JSON.stringify(data.user))
  return data
}

export async function signup(payload: {
  email: string
  password: string
  name?: string
  age?: number
  gender?: string
  username?: string
  university?: string
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  // Register returns { message } — no token yet, user must log in after
  return safeJson<{ message: string }>(res)
}

export function logout() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('currentUser')
}

// ── Users ─────────────────────────────────────────────────────────────────────

/** GET /api/users/:userId */
export async function getUser(userId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/** GET /api/users/me  — returns the currently authenticated user */
export async function getMe() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/** PUT /api/users/:userId */
export async function updateProfile(updates: Record<string, any>) {
  const userId = getCurrentUserId()
  if (!userId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updates),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/** PUT /api/users/:userId/status */
export async function setOnlineStatus(isOnline: boolean) {
  const userId = getCurrentUserId()
  if (!userId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ isOnline }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Posts / Trips ─────────────────────────────────────────────────────────────

const backendToFrontendMode: Record<string, TransportMode> = {
  uber: 'rideshare',
  hybrid: 'transit',
  walking: 'walking',
}

const frontendToBackendMode: Record<string, string> = {
  rideshare: 'uber',
  transit: 'hybrid',
  walking: 'walking',
}

/** GET /api/posts */
export async function getTrips(params?: {
  sortBy?: string
  userId?: string
  userLat?: number
  userLng?: number
}) {
  try {
    const searchParams = new URLSearchParams()
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.userLat != null) searchParams.append('userLat', String(params.userLat))
    if (params?.userLng != null) searchParams.append('userLng', String(params.userLng))

    const url = `${API_BASE_URL}/posts?${searchParams}`
    console.log('[api.getTrips] Fetching from:', url)
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    })
    console.log('[api.getTrips] Response status:', res.status)
    if (!res.ok) {
      console.error('[api.getTrips] Not OK:', res.status, res.statusText)
      return null
    }
    const data = await res.json()
    console.log('[api.getTrips] Raw data from backend:', data?.length || 0, 'items', data)
    if (!Array.isArray(data)) {
      console.error('[api.getTrips] Response is not array:', typeof data)
      return null
    }

    const mapped = data.map((row: any) => ({
      id: String(row.ID),
      userId: String(row.USER_ID),
      from: row.START_LOCATION || `${row.START_LAT}, ${row.START_LNG}`,
      to: row.DESTINATION ?? 'Unknown',
      transportMode: backendToFrontendMode[row.MODE?.toLowerCase()] ?? 'transit',
      departureTime: row.CREATED_AT_UTC ?? row.CREATED_AT ?? new Date().toISOString(),
      notes: row.NOTES ?? '',
      createdAt: row.CREATED_AT_UTC ?? row.CREATED_AT ?? new Date().toISOString(),
      status: row.IS_ACTIVE ? 'open' : 'completed',
      tripDistance: row.TRIP_DISTANCE ? Math.round(row.TRIP_DISTANCE * 10) / 10 : null,
      visibleToGender: row.VISIBLE_TO_GENDER ?? null,
      visibleToAgeMin: row.VISIBLE_TO_AGE_MIN ?? null,
      visibleToAgeMax: row.VISIBLE_TO_AGE_MAX ?? null,
      visibleToUniversity: row.VISIBLE_TO_UNIVERSITY ?? null,
      // Extra user fields joined by backend
      userName: row.NAME ?? '',
      userAge: row.AGE ?? null,
      userGender: row.GENDER ?? '',
      userAvatar: row.PROFILE_IMAGE ?? '',
    }))
    console.log('[api.getTrips] Mapped to', mapped.length, 'trips:', mapped)
    return mapped
  } catch (error) {
    console.error('[api.getTrips] Error:', error)
    return null
  }
}

/** POST /api/posts */
export async function createTrip(data: {
  startLat?: number
  startLng?: number
  endLat?: number
  endLng?: number
  startLocation?: string
  destination?: string
  to?: string
  mode?: string
  from?: string
  visibleToGender?: string | null
  visibleToAgeMin?: number | null
  visibleToAgeMax?: number | null
  visibleToUniversity?: string | null
}) {
  const userId = getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const payload = {
    userId,
    startLat: Number(data.startLat ?? 40.7128),
    startLng: Number(data.startLng ?? -74.006),
    endLat:   Number(data.endLat   ?? 40.7138),
    endLng:   Number(data.endLng   ?? -74.001),
    startLocation: data.startLocation ?? data.from,
    destination: data.destination ?? data.to ?? '',
    mode: frontendToBackendMode[data.mode ?? ''] ?? 'hybrid',
    visibleToGender: data.visibleToGender,
    visibleToAgeMin: data.visibleToAgeMin,
    visibleToAgeMax: data.visibleToAgeMax,
    visibleToUniversity: data.visibleToUniversity,
  }

  console.log('[createTrip] Posting to backend:', payload)

  try {
    const res = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    })
    const result = await safeJson(res)
    console.log('[createTrip] Success:', result)
    return result
  } catch (error) {
    console.error('[createTrip] Failed:', error)
    throw error
  }
}

/** DELETE /api/posts/:postId  (soft-delete, sets IS_ACTIVE = FALSE) */
export async function deleteTrip(postId: string) {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return safeJson(res)
}

// joinTrip is handled via messaging — no separate /join endpoint on the backend
export async function joinTrip(postId: string) {
  // Intentionally a no-op on the backend for now.
  // The "join" flow creates a conversation + message instead.
  return { ok: true, postId }
}

// ── Messages ──────────────────────────────────────────────────────────────────

/**
 * GET /api/messages/conversations/:userId
 * Returns all conversations for the current user.
 */
export async function getConversations() {
  const userId = getCurrentUserId()
  if (!userId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/messages/conversations/${userId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/messages/chat/:userId/:otherUserId
 * conversationId here is expected to be the OTHER user's id.
 */
export async function getMessages(otherUserId: string) {
  const userId = getCurrentUserId()
  if (!userId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/messages/chat/${userId}/${otherUserId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/**
 * POST /api/messages
 * recipientId = the other user's ID (backend expects senderId + recipientId + content)
 */
export async function sendMessage(recipientId: string, text: string) {
  const senderId = getCurrentUserId()
  if (!senderId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ senderId, recipientId, content: text }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/**
 * POST /api/messages/archive/:userId/:otherUserId
 */
export async function archiveConversation(otherUserId: string) {
  const userId = getCurrentUserId()
  if (!userId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/messages/archive/${userId}/${otherUserId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Recommendations ───────────────────────────────────────────────────────────

/** POST /api/recommendations/personalized */
export async function getRecommendations(userLocation?: string, userDestination?: string) {
  const userId = getCurrentUserId()
  if (!userId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/recommendations/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ userId, userLocation, userDestination }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}