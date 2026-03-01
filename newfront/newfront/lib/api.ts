const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function signup(data: any) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Signup failed')
  return res.json()
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

  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/posts?${searchParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch trips')
  return res.json()
}

export async function createTrip(data: any) {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create trip')
  return res.json()
}

export async function joinTrip(postId: string) {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to join trip')
  return res.json()
}

// Users
export async function getUser(userId: string) {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

export async function updateProfile(data: any) {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}

// Messages
export async function getConversations() {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/messages/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch conversations')
  return res.json()
}

export async function getMessages(conversationId: string) {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/messages/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function sendMessage(conversationId: string, text: string) {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversationId, text }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

// Recommendations
export async function getRecommendations() {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_BASE_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch recommendations')
  return res.json()
}
