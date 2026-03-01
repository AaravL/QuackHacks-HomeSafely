# HomeSafely / Hitch

Find safe travel companions for your commute.

## Run the app

### 1. Backend (port 3001)

```bash
cd backend
npm install
npm run dev
```

The server starts even without Snowflake. For **login, signup, trips, and messages** you must add Snowflake credentials to `backend/.env` (see `backend/.env.example`). Without them, those API calls will return errors when used.

### 2. Frontend (port 3000)

```bash
cd newfront/newfront
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Env

- **Frontend** (`newfront/newfront/.env.local`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GEMINI_API_KEY` (see `.env.example`).
- **Backend** (`backend/.env`): `JWT_SECRET`, `GEMINI_API_KEY`, and Snowflake vars for DB (see `backend/.env.example`).
