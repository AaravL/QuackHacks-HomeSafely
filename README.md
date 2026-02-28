# 🏠 HomeSafely - Travel Safe with Others

HomeSafely is a location-based carpooling platform where users can find others to travel home with safely. Whether it's via Uber or walking, HomeSafely connects people heading in similar directions.

## Features

### 🔐 Authentication
- User registration with age and gender selection
- Secure login with Snowflake backend storage
- JWT-based session management

### 🌍 Feed (Reddit-style)
- Browse available trips in a feed format
- Sort by:
  - **Recommended** (AI-powered Gemini recommendations based on route & preferences)
  - **Closest** (GPS distance calculation)
  - **Earliest** (most recent posts first)
  - **Age** (sort by user age)
  - **Gender** (filter by gender)

### 📍 Posting
- Create a trip post with start location and destination
- Select transport mode: Walking, Uber, or Hybrid
- Use Google Maps API to pinpoint locations
- Automatic GPS location activation

### 💬 Real-time Messaging
- WebSocket-based instant messaging
- See if other users are online/offline
- Archive chats in Snowflake
- Reopen previous conversations

### 🤖 AI-Powered Recommendations (Gemini)
- Input your location and destination
- Get recommended posts based on:
  - Route similarity
  - Travel time efficiency
  - User preferences (age, gender)
  - Safety factors

### 🛢️ Data Management
- Snowflake data warehouse for scalability
- React global state management
- Persistent message archiving

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **@react-google-maps/api** - Map integration
- **Axios** - HTTP client
- **WebSocket** - Real-time messaging

### Backend
- **Node.js + Express** - Server framework
- **express-ws** - WebSocket support
- **Snowflake SDK** - Database connection
- **@google/generative-ai** - Gemini API
- **bcryptjs** - Password hashing
- **cors** - Cross-origin requests

### APIs
- **Google Maps API** - Location mapping
- **Google Gemini API** - AI recommendations
- **Snowflake** - Data warehouse

## Project Structure

```
QuackHacks-HomeSafely/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx
│   │   │   ├── Feed.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   └── Messages.jsx
│   │   ├── context/
│   │   │   └── AppContext.jsx (Global state)
│   │   ├── services/
│   │   │   ├── api.js (API calls)
│   │   │   └── websocket.js (WebSocket connections)
│   │   ├── styles/
│   │   │   ├── Auth.css
│   │   │   ├── Feed.css
│   │   │   ├── CreatePost.css
│   │   │   └── Messages.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── backend/
│   ├── services/
│   │   ├── snowflake.js (DB connection)
│   │   └── gemini.js (AI recommendations)
│   ├── routes/
│   │   ├── auth.js (Login/Register)
│   │   ├── posts.js (CRUD posts)
│   │   ├── messages.js (Chat management)
│   │   ├── users.js (User profiles)
│   │   └── recommendations.js (AI suggestions)
│   ├── middleware/
│   ├── models/
│   ├── server.js
│   ├── schema.sql
│   ├── package.json
│   └── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 16+
- Snowflake account
- Google Maps API key
- Google Gemini API key

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Snowflake and API credentials
   ```

3. **Setup Snowflake**
   - Create database and schema
   - Run `schema.sql` to create tables
   ```bash
   snowsql -u <username> -d <database> -f schema.sql
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3001`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Add your API keys and URLs
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts` - Get posts (with sorting)
- `POST /api/posts` - Create new post
- `DELETE /api/posts/:id` - Delete post

### Messages
- `GET /api/messages/chat/:userId/:otherUserId` - Get chat history
- `GET /api/messages/conversations/:userId` - Get all conversations
- `POST /api/messages` - Send message
- `POST /api/messages/archive/:userId/:otherUserId` - Archive chat

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId/status` - Update online status

### Recommendations
- `POST /api/recommendations/personalized` - Get AI recommendations

### WebSocket
- `ws://localhost:3001/ws/messages/:userId` - Real-time messaging

## Key Features Explained

### Gemini AI Recommendations
The system uses Google Gemini to analyze:
- Current user location and destination
- All available posts in the area
- User preferences (age, gender)
- Route efficiency and safety

Returns ranked recommendations for the best matches.

### Real-time Messaging
Uses WebSocket to:
- Establish persistent connection between users
- Send messages instantly
- Broadcast online/offline status
- Maintain message history in Snowflake

### Global State Management
React Context API manages:
- Current user session
- Posts feed
- Messages
- Online users
- Current location

## Development Tips

1. **Test Auth Flow**: Register → Login → Select location → Browse feeds
2. **Test Messaging**: Create 2 users, post trips, and exchange messages
3. **Test Recommendations**: Post with different locations to trigger Gemini API
4. **WebSocket Debugging**: Use browser DevTools Network tab to monitor WS connections

## Future Enhancements

- User ratings and reviews
- Trip history and statistics
- Payment integration for Uber splits
- Safety verification (background checks)
- Push notifications
- Mobile app (React Native)
- Advanced ML model for matching
- Ride insurance

## License

MIT License - Feel free to use for your hackathon!

## Support

For issues or questions, check:
- Snowflake documentation: https://docs.snowflake.com
- Google Maps API: https://developers.google.com/maps
- Google Gemini API: https://ai.google.dev
- React: https://react.dev