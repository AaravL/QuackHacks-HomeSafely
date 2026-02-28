# Deployment Guide

## Deploying to Production

### Frontend Deployment (Vercel/Netlify)

1. **Build for production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Set environment variables in dashboard**
   - VITE_API_URL
   - VITE_WS_URL
   - VITE_GOOGLE_MAPS_API_KEY

### Backend Deployment (Render/Heroku)

1. **Prepare for deployment**
   - Add `start` script in package.json
   - Create `.gitignore`

2. **Deploy to Render**
   - Connect GitHub repository
   - Set environment variables
   - Deploy

3. **Database Configuration**
   - Use Snowflake cloud instance
   - Update connection strings in .env

## Environment Variables

### Backend (.env)
```
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DATABASE=HOMESAFELY
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
GOOGLE_MAPS_API_KEY=your_key
GEMINI_API_KEY=your_key
PORT=3001
FRONTEND_URL=https://your-frontend-url.com
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com/api
VITE_WS_URL=wss://your-backend-url.com
VITE_GOOGLE_MAPS_API_KEY=your_key
```

## Security Considerations

1. **API Keys**: Use environment variables, never commit to repo
2. **HTTPS/WSS**: Always use secure connections in production
3. **CORS**: Configure whitelist of allowed origins
4. **Rate Limiting**: Implement on backend
5. **Input Validation**: Sanitize all user inputs
6. **Authentication**: Use proper JWT tokens with expiration
