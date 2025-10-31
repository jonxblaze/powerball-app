## Powerball Generator (React + Vite + Express)

A React app that generates Powerball number combinations from historical draw data. A small Express server fetches data from the California Lottery API and stores results locally so the UI can analyze and display them.

### Features
- Update historical Powerball results via backend endpoint
- Load and cache results locally in `public/powerball_results.json`
- Multiple number-generation algorithms (frequency, hot/cold, balanced, pattern, statistical, combined)
- Shows the most recent official winning numbers
- Configurable update days (don’t fetch every app load)

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
- Control which days the app attempts to refresh data automatically at startup via `VITE_UPDATE_DAYS` (comma‑separated list of 0–6 where 0=Sun ... 6=Sat). Default is `1,3,6` (Mon, Wed, Sat).

Example `.env`:
```bash
VITE_UPDATE_DAYS=1,3,6
```
Restart `npm run dev` after changing env vars.

### API Endpoints (Express)
- `POST /api/update-powerball`
  - Fetches all pages of draw results from the California Lottery API and saves them to `public/powerball_results.json`.
  - This can be long‑running; the Vite proxy timeout is set higher to accommodate.
- `GET /api/powerball-data`
  - Returns the contents of `public/powerball_results.json`.
- `GET /api/powerball-status`
  - Returns basic info about the local results file (exists/lastUpdated).

### Data Files
- Backend saves canonical data to `public/powerball_results.json`.
- The frontend tries to update on allowed days; otherwise it loads existing data. If the API is unavailable, it falls back to the local JSON in `public/`.

### Optional: Standalone fetch script
There is also a standalone script that can fetch results without running the server:
```bash
node src/utils/fetchPowerball.js
```
This writes `powerball_results.json` to the project root. The Express server, by contrast, writes to `public/powerball_results.json` which the frontend reads by default.

## Build & Preview
```bash
npm run build
npm run preview
```

## Troubleshooting
- **Proxy error or socket hang up** when calling `/api/update-powerball`:
  - Ensure the backend is running on port 5001: `npm run server`
  - Restart the Vite dev server after changing `vite.config.js`
  - The proxy timeout has been increased, but large fetches still take time
- **Port conflict on macOS** (AirPlay can occupy 5000): server uses port 5001 by default
- **CORS**: Express sets permissive CORS headers for local development

## Project Structure (key files)
- `src/App.jsx` — UI, loads data, runs algorithms; only updates on allowed days
- `src/utils/sophisticatedLottery.js` — data loading and number‑generation algorithms
- `src/utils/fetchPowerball.js` — optional standalone fetch script
- `server.js` — Express server with `/api` endpoints
- `public/powerball_results.json` — stored results consumed by the UI
- `vite.config.js` — dev server proxy configuration
