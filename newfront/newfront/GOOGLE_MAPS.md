# Google Maps / Places setup

## This project (QuackHacks-HomeSafely)

1. **Create a Google Cloud API key** and enable:
   - **Maps JavaScript API**
   - **Places API**

2. **Add to `.env.local`** (never commit this file):
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

3. **Restart the dev server** so Next.js picks up the env var.

The create-trip form will then show **address autocomplete** for “Starting Point” and “Destination”. Selecting a suggestion fills in coordinates and sends them to the backend. If the key is missing, the form still works with plain text and the backend uses default coordinates.

---

## Fixing the homie repo (anthonysukotjo/homie)

That repo’s Google Maps issues come from:

1. **Env var not available in the browser**  
   It uses `process.env.GOOGLE_MAPS_API_KEY`. In Next.js, only variables prefixed with `NEXT_PUBLIC_` are exposed to the client. So the Places Autocomplete script never gets a key.

2. **Hardcoded API key in `pages/home.tsx`**  
   The geocode request uses a key in the URL. That’s a security risk and the key may be disabled by Google.

**What to do in homie:**

1. In Google Cloud Console, create (or reuse) an API key and enable **Maps JavaScript API**, **Places API**, and **Geocoding API**. Restrict the key by HTTP referrer to your domains.

2. In the homie project root, add `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

3. In `pages/home.tsx`:
   - Replace the hardcoded key in the geocode URL with the env var, and use it only on the server or via a `NEXT_PUBLIC_` var if you must call Geocoding from the client:
     ```ts
     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
     const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(splitAddress)}&key=${apiKey}`;
     ```
   - Pass the same key into `GooglePlacesAutocomplete` (e.g. `apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` or whatever prop that library expects).

4. Ensure the Google Maps script is loaded with that key before `GooglePlacesAutocomplete` is used (e.g. in `_app.tsx` with `next/script` or the loader the library provides).

After that, Places autocomplete and geocoding should work in homie.
