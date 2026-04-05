## Powerball Generator (React + Vite + Express)

A React app that generates Powerball number combinations from historical draw data. A small Express server fetches data from the California Lottery API and stores results locally so the UI can analyze and display them.

### Features
- Update historical Powerball results via backend endpoint
- Automatic backend refresh after drawings (Mon/Wed/Sat at 8:05 PM PT)
- Load and cache results locally in `public/powerball_results.json`
- Durable lock-file protection prevents overlapping update runs
- Multiple number-generation algorithms (frequency, hot/cold, balanced, pattern, statistical, combined)
- Shows the most recent official winning numbers
- Frontend loads cached/backend data without auto-triggering updates

## Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 22)
- npm

### Install
```bash
npm install
```

### Development
Run the backend server (port 5001):
```bash
npm run server         # or: npm run dev:server
```

Run the Vite dev server (port 5173 by default):
```bash
npm run dev
```

Vite proxies API calls from the browser to the backend (see `vite.config.js`):
- `'/api' -> http://localhost:5001`

### Configuration
- Optional: set `VITE_API_BASE` in `.env` to point the frontend to a different API host.
- By default, Vite proxy and relative `/api` paths are used in local development.

### API Endpoints (Express)
- `POST /api/update-powerball`
  - Fetches all pages of draw results from the California Lottery API and saves them to `public/powerball_results.json`.
  - Uses a durable lock file (`public/.powerball_update.lock`) to prevent concurrent update runs.
  - This can be long‑running; the Vite proxy timeout is set higher to accommodate.
- `GET /api/powerball-data`
  - Returns the contents of `public/powerball_results.json`.
- `GET /api/powerball-status`
  - Returns basic info about the local results file (exists/lastUpdated).
- `GET /api/update-status`
  - Returns current update state (`updateInProgress`).

### Data Files
- Backend saves canonical data to `public/powerball_results.json`.
- Backend uses `public/.powerball_update.lock` during update operations (auto-cleaned on completion; stale locks are recovered).
- The frontend loads from the backend API first. If unavailable, it falls back to the local JSON in `public/`.

### Optional: Standalone fetch script
There is also a standalone script that can fetch results without running the server:
```bash
node src/utils/fetchPowerball.js
```
This writes to `public/powerball_results.json`, the same canonical file used by the Express server and frontend.

## Build & Preview
```bash
npm run build
npm run preview
```

## Troubleshooting
- **`/api/powerball-data` appears twice on app load in development**:
  - This is expected with React Strict Mode, which intentionally re-runs effects in development.
  - Production builds call it once.
- **Proxy error or socket hang up** when calling `/api/update-powerball`:
  - Ensure the backend is running on port 5001: `npm run server`
  - Restart the Vite dev server after changing `vite.config.js`
  - The proxy timeout has been increased, but large fetches still take time
- **Port conflict on macOS** (AirPlay can occupy 5000): server uses port 5001 by default
- **CORS**: Express sets permissive CORS headers for local development

## Project Structure (key files)
- `src/App.jsx` — UI, loads data, runs algorithms
- `src/utils/sophisticatedLottery.js` — data loading and number‑generation algorithms
- `src/utils/fetchPowerball.js` — optional standalone fetch script
- `server.js` — Express server with `/api` endpoints
- `public/powerball_results.json` — stored results consumed by the UI
- `vite.config.js` — dev server proxy configuration
