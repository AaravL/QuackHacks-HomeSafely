# Hitch 🚶‍♀️

**Find safe travel companions for your commute.**

> Built for QuackHacks 2025 - Empowering safer travel through community-driven companionship.
- Health and Wellness Track submission
- Best use of snowflake Bonus Track submission
- Best use of gemini Bonus Track submission

---

## 📹 Demo & Presentation

- **Demo Video** (2-3 minutes): [Add YouTube/Vimeo link here]
- **Pitch Slides**: [Add Google Slides/PDF link here]

*We recommend watching the demo video to see Hitch in action, especially to understand the real-time features and user experience flow.*

---

## 🎯 The Problem

Walking alone late at night, commuting through unfamiliar areas, or traveling during off-peak hours can feel unsafe—especially for students, women, and other vulnerable groups. Traditional safety solutions like rideshares can be expensive, and there's no easy way to find trusted companions heading the same direction at the same time.

**Key pain points we identified:**
- **Isolation risk**: Many people travel alone when they could have company
- **Lack of real-time coordination**: No platform exists to match people traveling the same route simultaneously
- **Trust issues**: Existing platforms don't filter companions by verified university affiliation or demographics
- **Cost barriers**: Alternative transport (rideshares, taxis) is often unaffordable for daily commutes

---

## 💡 Our Solution

Hitch is a **community-driven companion-finding platform** that connects people traveling similar routes at similar times. Users post their trips (walking, transit, or rideshare) with departure times and locations, and the platform intelligently matches them with compatible companions based on:

- **Proximity**: Haversine distance calculation of route length
- **Timing**: Departure time alignment
- **Preferences**: Customizable visibility filters (gender, age range, university affiliation)
- **Safety features**: Trip completion verification system to build trust

The platform emphasizes **verified community connections** (university email verification) and provides an **in-app messaging system** for coordination, eliminating the need to share personal contact information upfront.

---

## ✨ Key Features

### 🗺️ Smart Trip Matching
- Real-time trip feed with **intelligent recommendation scoring** based on route proximity and user preferences
- **Haversine distance calculations** in SQL for accurate route similarity (calculates great-circle distance between coordinates)
- Sort by closest proximity, earliest departure, age, gender, or recommendation score
- Dynamic filtering based on user location parameters

### 🔒 Privacy & Safety Controls
- **Granular visibility filters**: Show your trip only to specific demographics (gender, age range, same university)
- **Trip completion tracking**: Mark trips as complete and verify companions via email
- **Verified profiles**: University email authentication for trusted community building
- **Trips completed counter**: Builds reputation over time

### 💬 Integrated Communication
- **In-app messaging** to coordinate meeting points and details  
- **Conversation archiving** to keep your inbox organized
- **Polling-based updates** for real-time message synchronization

### 🤖 AI-Powered Safety
- **Gemini AI integration** provides personalized safety tips based on route, time, and mode of transport
- Context-aware recommendations for different travel scenarios
- **Gemini AI Companion** Acts as an AI companion, currently only works for messages, but future releases will allow for text to speech and allow for fake phone calls to allow users to act is if they are on the phone for uncomfortable situations

### 🌍 Location Intelligence
- **Google Maps API integration** for accurate address autocomplete
- **Coordinate-based matching** using Haversine formula calculates distances between trips
- **Trip distance display** showing miles between start and end points on each card

---

## 🏗️ Technical Architecture

### Frontend (Next.js + React)
- **Framework**: Next.js 14 with TypeScript for type safety
- **State Management**: Zustand for lightweight, reactive global state
- **UI Components**: Custom component library built on Radix UI primitives
- **Styling**: Tailwind CSS for rapid, responsive design
- **Real-time Updates**: Polling-based data sync (10s intervals for trips, 2s for active chats)

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js for RESTful API
- **Database**: Snowflake cloud data warehouse for scalable SQL operations
- **Authentication**: JWT-based auth with bcrypt password hashing
- **AI Integration**: Google Gemini API for safety recommendations
- **Geospatial**: SQL Haversine formula for distance calculations between coordinates
- **Real-time**: Polling-based data synchronization (10s for trips, 2s for active chats)

### Key Technical Decisions

#### Why Snowflake?
We chose **Snowflake** over traditional databases (PostgreSQL, MongoDB) because:
- **Zero infrastructure management**: No server provisioning or maintenance
- **Instant scalability**: Auto-scales for concurrent users during peak hours
- **SQL familiarity**: Team expertise with SQL reduced learning curve
- **Geographic functions**: Built-in support for geospatial calculations

**Tradeoff**: Higher latency (~200-500ms queries) compared to local databases, but offset by caching strategies and async operations.

#### Authentication Strategy
- **JWT tokens** stored in `localStorage` for persistent sessions
- **Middleware-based protection** for all sensitive routes
- **Email verification** planned for production (not implemented in hackathon scope)

**Tradeoff**: LocalStorage has XSS risks, but we prioritized user experience over httpOnly cookies during the prototype phase.

### Data Flow
```
User Action (Frontend)
    ↓
API Call (fetch with JWT)
    ↓
Express Route Handler
    ↓
Snowflake Query Execution
    ↓
Response Mapping & Filtering
    ↓
Zustand Store Update
    ↓
React Component Re-render
```

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14, React 18, TypeScript
- Zustand (state), Tailwind CSS (styling)
- Radix UI, date-fns, Lucide Icons
- Google Maps API (geocoding)

**Backend:**
- Node.js, Express.js
- Snowflake (database)
- JWT (auth), Bcrypt (hashing)
- Google Gemini AI, Google Maps API

**DevOps:**
- Git/GitHub for version control
- Environment variables for secrets management

---

## 🧠 What We Learned

### Technical Growth
1. **Snowflake's tradeoffs**: Learned to optimize SQL queries for cloud latency and leverage its auto-scaling benefits
2. **Real-time architecture**: Implemented polling-based synchronization with optimal intervals (10s for trips, 2s for messages)
3. **Geospatial calculations**: Implemented Haversine distance formulas in pure SQL for accurate route matching
4. **TypeScript benefits**: Strong typing caught bugs early and improved code maintainability
5. **Complex SQL queries**: Wrote advanced queries with CTEs, joins, and mathematical distance calculations

### Product Insights
1. **Privacy is paramount**: Users need granular control over who sees their trips—generic public feeds don't work for safety
2. **Trust through verification**: University email authentication immediately establishes baseline community trust
3. **Simplicity wins**: We cut scope ruthlessly to deliver core features that work reliably vs. half-baked advanced features

### Team Lessons
1. **API-first design**: Defining backend contracts early prevented frontend/backend integration nightmares
2. **Console logging saves lives**: Extensive logging at every layer made debugging 10x faster
3. **Scope management**: Focused on REST API polling rather than complex real-time architecture—knowing when to simplify was crucial
4. **Progressive enhancement**: Started with core features (trip posting, matching) before adding complexity (messaging, AI recommendations)

### Challenges Overcome
- **Snowflake schema evolution**: ALTER TABLE commands required understanding Snowflake's specific syntax (no multi-column ADD)
- **State synchronization**: Coordinating user profile updates with trip data required careful Zustand store design and polling intervals
- **Timezone handling**: Storing and displaying times across UTC and local timezones required careful ISO 8601 formatting
- **Distance calculations**: Implemented Haversine formula in raw SQL with proper radian conversions and edge case handling
- **Polling optimization**: Balancing real-time feel with server load using different intervals (10s for trips, 2s for active chats)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Snowflake account (free trial available)
- Google Maps API key
- Google Gemini API key

### 1. Backend Setup (Port 3001)

```bash
cd backend
npm install

# Create .env file from example
cp .env.example .env

# Add your credentials to .env:
# - JWT_SECRET (any secure random string)
# - GEMINI_API_KEY
# - Snowflake connection details

npm run dev
```

**Note**: The server starts without Snowflake, but login/signup/trips/messages require database credentials.

### 2. Frontend Setup (Port 3000)

```bash
cd newfront/newfront
npm install

# Create .env.local file from example
cp .env.example .env.local

# Add your credentials:
# - NEXT_PUBLIC_API_URL=http://localhost:3001/api
# - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
# - GEMINI_API_KEY

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Database Setup

Run the schema SQL in your Snowflake console:

```sql
-- From backend/schema.sql
CREATE DATABASE IF NOT EXISTS HITCH;
USE DATABASE HITCH;
USE SCHEMA PUBLIC;

-- Then run the CREATE TABLE statements...
```

**Required columns** (if using existing database):
```sql
ALTER TABLE POSTS ADD COLUMN DEPARTURE_TIME TIMESTAMP_NTZ;
ALTER TABLE POSTS ADD COLUMN NOTES VARCHAR(1000);
ALTER TABLE USERS ADD COLUMN TRIPS_COMPLETED INTEGER DEFAULT 0;
```

---

## 📂 Project Structure

```
HITCH/
├── backend/                 # Express.js API server
│   ├── routes/             # API endpoints (auth, posts, users, messages)
│   ├── services/           # Snowflake & Gemini integrations
│   ├── middleware/         # JWT auth middleware
│   └── schema.sql          # Database schema
├── newfront/newfront/      # Next.js frontend
│   ├── components/         # React components (trip-card, auth, feed, etc.)
│   ├── lib/                # Store (Zustand), API client, types
│   └── app/                # Next.js app router pages
└── README.md               # This file
```

---

## 🎯 Future Enhancements

If we continue development post-hackathon:

1. **Email verification**: Send verification links to confirm university affiliation
2. **Push notifications**: Alert users when matched companions post similar trips
3. **Route visualization**: Display trip routes on an interactive map with start/end markers, mark user distance to route start point
4. **In-app navigation**: Integrate Google Maps directions for meeting point guidance
5. **Safety check-ins**: Automated "did you arrive safely?" notifications
6. **Report system**: Allow users to flag inappropriate behavior with moderation workflow
7. **Mobile app**: React Native version for iOS/Android with background location updates
8. **Enhanced recommendation algorithm**: Machine learning to predict best matches based on successful trip history

---

## 👥 Team

- **[Aarav Loomba]**: [Developer]
- **[Mihir Shankar]**: [Developer]
- **[Kritin Rane]**: [Developer]

---

## 📄 License

[MIT]

---

## 🙏 Acknowledgments

- **QuackHacks organizers** for hosting an amazing hackathon
- **Snowflake** for cloud database credits
- **Google** for Maps and Gemini API access
