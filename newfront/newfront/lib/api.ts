import type { TransportMode } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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
  if (token) {
    return { 'Authorization': `Bearer ${token}` }
  }
  return {}
}

// Auth
export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Is the backend running?')
    }
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Login failed')
    }
    
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('authToken', data.token)
    }
    return data
  } catch (err: any) {
    console.error('Login error:', err)
    throw err
  }
}

export async function signup(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Is the backend running?')
    }
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Signup failed')
    }
    
    const result = await res.json()
    if (result.token) {
      localStorage.setItem('authToken', result.token)
    }
    return result
  } catch (err: any) {
    console.error('Signup error:', err)
    throw err
  }
}

// Posts/Trips
export async function getTrips(params?: {
  sortBy?: string
  userId?: string
  userLat?: number
  userLng?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
  if (params?.userId) searchParams.append('userId', params.userId)
  if (params?.userLat) searchParams.append('userLat', params.userLat.toString())
  if (params?.userLng) searchParams.append('userLng', params.userLng.toString())

  try {
    const res = await fetch(`${API_BASE_URL}/posts?${searchParams}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      console.warn(`Failed to fetch trips: ${res.status}`)
      return null
    }
    const data = await res.json()
    
    // Transform backend POSTS shape to frontend Trip shape
    // Backend returns: USER_ID, START_LAT, START_LNG, END_LAT, END_LNG, DESTINATION, MODE, IS_ACTIVE, CREATED_AT, NAME, AGE, GENDER, PROFILE_IMAGE
    // Frontend expects: id, userId, from, to, transportMode, departureTime, notes, createdAt, status
    
    if (!Array.isArray(data)) return data
    
    const modeMap: Record<string, TransportMode> = {
      uber: 'rideshare',
      hybrid: 'transit',
      walking: 'walking',
    }
    
    return data.map((row: any) => ({
      id: row.ID || `trip-${row.USER_ID}-${Date.now()}`,
      userId: String(row.USER_ID),
      from: `${row.START_LAT}, ${row.START_LNG}`, // or use DESTINATION for "to"
      to: row.DESTINATION || 'Unknown',
      transportMode: modeMap[row.MODE?.toLowerCase()] || 'transit',
      departureTime: row.CREATED_AT || new Date().toISOString(),
      notes: row.NOTES || '',
      createdAt: row.CREATED_AT || new Date().toISOString(),
      status: row.IS_ACTIVE ? 'open' : 'completed',
    }))
  } catch (err) {
    console.warn('Failed to fetch trips:', err)
    return null
  }
}

export async function createTrip(data: any) {
  const userId = getCurrentUserId()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const modeMap: Record<string, string> = {
    rideshare: 'uber',
    walking: 'walking',
    transit: 'hybrid',
  }

  const payload = {
    userId,
    startLat: Number(data.startLat ?? 40.7128),
    startLng: Number(data.startLng ?? -74.006),
    endLat: Number(data.endLat ?? 40.7138),
    endLng: Number(data.endLng ?? -74.001),
    destination: data.destination ?? data.to ?? '',
    mode: modeMap[data.mode] ?? 'hybrid',
  }

  const res = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create trip')
    }
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to create trip')
  }
  return res.json()
}

export async function joinTrip(postId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to join trip')
      }
      const errorText = await res.text()
      throw new Error(errorText || 'Failed to join trip')
    }
    return res.json()
  } catch (err) {
    console.warn('Failed to join trip:', err)
    throw err
  }
}

// Users
export async function getUser(userId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      console.warn(`Failed to fetch user: ${res.status}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.warn('Failed to fetch user:', err)
    return null
  }
}

export async function updateProfile(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      console.warn(`Failed to update profile: ${res.status}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.warn('Failed to update profile:', err)
    return null
  }
}

// Messages
export async function getConversations() {
  try {
    const res = await fetch(`${API_BASE_URL}/messages/conversations`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      console.warn(`Failed to fetch conversations: ${res.status}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.warn('Failed to fetch conversations:', err)
    return null
  }
}

export async function getMessages(conversationId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/messages/${conversationId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      console.warn(`Failed to fetch messages: ${res.status}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.warn('Failed to fetch messages:', err)
    return null
  }
}

export async function sendMessage(conversationId: string, text: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ conversationId, text }),
    })
    if (!res.ok) {
      console.warn(`Failed to send message: ${res.status}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.warn('Failed to send message:', err)
    return null
  }
}

// Recommendations
export async function getRecommendations() {
  try {
    const res = await fetch(`${API_BASE_URL}/recommendations`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      console.warn(`Failed to fetch recommendations: ${res.status}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.warn('Failed to fetch recommendations:', err)
    return null
  }
}
