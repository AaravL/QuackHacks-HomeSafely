# 🚀 Quick Start Guide

## 5-Minute Setup

### 1. Clone & Install Backend

```bash
cd backend
npm install
```

### 2. Setup Snowflake

Get your Snowflake credentials, then:

```bash
cp .env.example .env
# Edit .env with your Snowflake account details
```

Create database:
```sql
CREATE DATABASE HOMESAFELY;
CREATE SCHEMA PUBLIC;
```

Run schema:
```bash
snowsql -c your_connection -f schema.sql
```

### 3. Get API Keys

- **Google Maps**: https://console.cloud.google.com/
- **Google Gemini**: https://makersuite.google.com/app/apikey

Add to backend `.env`:
```
GOOGLE_MAPS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### 4. Install & Setup Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
# Add same Google Maps API key
```

### 5. Run Both

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open: http://localhost:3000

## Testing the App

### Create Test Users

1. Sign up User A:
   - Email: user-a@test.com
   - Password: test123
   - Age: 20
   - Gender: Female

2. Sign up User B:
   - Email: user-b@test.com
   - Password: test123
   - Age: 21
   - Gender: Male

### Test Features

- **Browse Trips**: Click "Feed" to see available posts
- **Create Trip**: Click "Create Trip", select destination with map
- **Message**: Find a user and start chatting in real-time
- **AI Recommendations**: System auto-recommends best matches based on routes

## Architecture Overview

```
User (Browser)
    ↓
React Frontend (http://localhost:3000)
    ↓ Axios HTTP + WebSocket
Express Backend (http://localhost:3001)
    ↓
Snowflake Database
  + Google Maps API (location)
  + Google Gemini API (recommendations)
```

## Common Issues

### Cold Start Issues
- Restart both servers
- Clear browser cache (Ctrl+Shift+Del)
- Check console for errors (F12)

### Map Not Loading
- Verify VITE_GOOGLE_MAPS_API_KEY in frontend .env
- Check Google Cloud quota limits

### Messages Not Working
- Check WebSocket connection (DevTools → Network → WS)
- Verify backend server is running

### Snowflake Connection
- Verify account name, user, password
- Check warehouse status
- Ensure database and schema exist

## Next Steps

1. Deploy to production (see DEPLOYMENT.md)
2. Add more features (see CONTRIBUTING.md)
3. Optimize performance
4. Add unit tests
5. Implement payment system

Happy Hacking! 🎉
