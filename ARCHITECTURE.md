# Architecture & Technical Design

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                    React 18 + Vite                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Auth │ Feed │ CreatePost │ Messages │ Global State       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────┬─────────────────────────────────────────────────────────────┘
     │HTTP/REST (Axios) + WebSocket
     │
┌────▼─────────────────────────────────────────────────────────────┐
│                     API GATEWAY / BACKEND                         │
│                    Express.js + Node.js                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Auth │ Posts │ Messages │ Users │ Recommendations Route │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ WebSocket Handler - Real-time Messaging                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────┬──────────────┬───────────────────┬──────────────────────────┘
     │              │                   │
     │ Snowflake    │ Google Maps       │ Google Gemini
     │ Database     │ API               │ API
     │              │                   │
┌────▼────┐   ┌─────▼──────┐   ┌───────▼────────┐
│ Users   │   │ Locations  │   │ ML Model       │
│ Posts   │   │ Routng     │   │ Recommendations│
│ Messages│   │ Geocoding  │   │ Scoring        │
│ Chats   │   │ Distance   │   │ Analysis       │
└─────────┘   └────────────┘   └────────────────┘
```

## Data Flow

### User Registration Flow
```
Frontend (Auth Component)
    ↓ POST /api/auth/register
Backend (auth.js route)
    ↓ Hash password (bcryptjs)
    ↓ INSERT INTO USERS
Snowflake Database
    ↓ Return success
Frontend → Redirect to login
```

### Creating a Trip Flow
```
User fills form + selects location on map
    ↓ POST /api/posts
Backend validation
    ↓ INSERT INTO POSTS
Snowflake stores post
    ↓ Return post ID
Trigger Gemini recommendation update
    ↓ Call getRecommendations()
Update RECOMMENDATION_SCORE in DB
    ↓ Response to client
Feed refreshes with new post
```

### Real-time Messaging Flow
```
User A sends message
    ↓ WebSocket message event
Backend broadcasts to User B
    ↓ User B receives via WebSocket
    ↓ Store in MESSAGES table
Both UI update in real-time
    ↓ Can reopen chat later from archived messages
```

## Component Hierarchy

```
App
├── Navbar
│   ├── Branding
│   └── NavButtons
├── Auth (if not logged in)
│   └── LoginForm/RegisterForm
└── MainContent (if logged in)
    ├── Feed
    │   ├── SortButtons
    │   └── PostCard[] (grid)
    ├── CreatePost
    │   ├── Form
    │   └── GoogleMap
    └── Messages
        ├── ConversationsList
        └── ChatArea
```

## State Management

### React Context (AppContext)
```javascript
{
  // User data
  user: { id, email, name, age, gender, token },
  
  // Posts feed
  posts: [Post...],
  
  // Messaging
  messages: { [chatId]: Message[] },
  
  // Presence
  onlineUsers: Set<userId>,
  
  // Location
  currentLocation: { lat, lng },
  
  // Methods
  login(), logout(), updateLocation(), addMessage(), setUserOnline()
}
```

## Database Schema Design

### USERS Table
- Primary Key: ID
- Unique: EMAIL
- Fields: name, age, gender, password_hash, is_online, last_seen
- Purpose: User profiles and authentication

### POSTS Table
- Primary Key: ID
- Foreign Key: USER_ID → USERS
- Indexed: USER_ID, START_LAT/LNG, IS_ACTIVE
- Fields: location data, mode, destination, recommendation_score
- Purpose: Trip postings

### MESSAGES Table
- Primary Key: ID
- Foreign Keys: SENDER_ID, RECIPIENT_ID → USERS
- Fields: content, is_archived, created_at
- Purpose: Chat history persistence

### CONNECTIONS Table
- Primary Key: ID
- Foreign Keys: USER_ID_1, USER_ID_2, POST_ID
- Fields: status (matched, connected, completed)
- Purpose: Track user connections and matches

## API Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-02-28T12:00:00Z"
}
```

### Error Response
```json
{
  "status": "error",
  "error": "Error message",
  "code": 400,
  "timestamp": "2026-02-28T12:00:00Z"
}
```

## WebSocket Message Protocol

### Client → Server
```json
{
  "type": "message",
  "senderId": 123,
  "recipientId": 456,
  "content": "Hey, want to share a ride?",
  "timestamp": "2026-02-28T12:00:00Z"
}
```

### Server → Client (Broadcast)
```json
{
  "type": "user-online",
  "userId": 123,
  "timestamp": "2026-02-28T12:00:00Z"
}
```

## Security Layers

1. **Frontend**
   - HTTPS/WSS only in production
   - Secure token storage (localStorage)
   - CORS validation

2. **Backend**
   - Authentication middleware
   - Input validation/sanitization
   - Rate limiting
   - CORS headers
   - Environment variable secrets

3. **Database**
   - Snowflake encryption
   - Password hashing
   - Connection pooling
   - Query parameterization

4. **API**
   - JWT token validation
   - User ownership checks
   - API key rotation
   - Audit logging

## Performance Considerations

### Frontend
- React.memo for component memoization
- useCallback for function prop stability
- Lazy loading for components
- Image optimization
- Code splitting per route

### Backend
- Database connection pooling
- Query result caching
- API response compression
- WebSocket message batching
- Snowflake warehouse auto-suspend

### Scalability
- Horizontal scaling of Node servers
- Load balancing
- CDN for static assets
- Snowflake auto-scaling
- Message queue for async tasks (future)

## Monitoring & Logging

### Metrics to Track
- API response times
- WebSocket connection count
- Database query latency
- Error rates by endpoint
- User session duration

### Logging Strategy
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation
- Error tracking (Sentry)
- Performance monitoring (DataDog)

---

For specific implementation details, refer to the component files and API route handlers.
