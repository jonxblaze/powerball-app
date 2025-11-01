/* eslint-env node */
/* global process */
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ ESM-safe __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Support both /api and /app/api paths for deployment flexibility
const API_ROUTES = express.Router();

const BASE_URL =
  'https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/{game}/{page}/{size}';
const GAMES = {
  POWERBALL: 12,
  'MEGA Millions': 15,
  'SuperLotto Plus': 8,
};

async function fetchResults(gameId, page, size = 20) {
  const url = BASE_URL
    .replace('{game}', gameId)
    .replace('{page}', page)
    .replace('{size}', size);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        Referer: 'https://www.calottery.com/',
        Origin: 'https://www.calottery.com',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok)
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);

    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error('Request timeout');
    throw error;
  }
}

// ✅ Endpoint: Update Powerball data
API_ROUTES.post('/update-powerball', async (req, res) => {
  try {
    const gameId = GAMES.POWERBALL;
    let allDraws = [];
    let page = 1;

    console.log('Fetching Powerball results...');

    while (true) {
      const data = await fetchResults(gameId, page);
      const draws = data?.PreviousDraws ?? [];
      if (draws.length === 0) break;

      allDraws = allDraws.concat(draws);
      console.log(`Fetched page ${page} (${draws.length} draws)`);
      page++;
      await new Promise((r) => setTimeout(r, 500));
    }

    // Use absolute path - public folder is in the same directory as server.js
    const filePath = path.join(process.cwd(), 'public', 'powerball_results.json');
    fs.writeFileSync(filePath, JSON.stringify(allDraws, null, 2), 'utf8');
    console.log(`✅ Saved ${allDraws.length} Powerball results to ${filePath}`);

    res.json({
      success: true,
      message: `Updated ${allDraws.length} Powerball results.`,
      count: allDraws.length,
    });
  } catch (error) {
    console.error('Error updating Powerball data:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating Powerball data',
      error: error.message,
    });
  }
});

// ✅ Endpoint: Serve stored Powerball data
API_ROUTES.get('/powerball-data', (req, res) => {
  try {
    // Use absolute path - public folder is in the same directory as server.js
    const filePath = path.join(process.cwd(), 'public', 'powerball_results.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading Powerball data:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading Powerball data',
      error: error.message,
    });
  }
});

// ✅ Endpoint: Check file status
API_ROUTES.get('/powerball-status', (req, res) => {
  try {
    // Use absolute path - public folder is in the same directory as server.js
    const filePath = path.join(process.cwd(), 'public', 'powerball_results.json');
    const stats = fs.statSync(filePath);
    res.json({
      success: true,
      lastUpdated: stats.mtime,
      message: 'Powerball results file accessible',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Powerball results file not found',
      error: error.message,
    });
  }
});

// Mount API routes at both /api and /app/api for deployment flexibility
app.use('/api', API_ROUTES);
app.use('/app/api', API_ROUTES);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at /api/* and /app/api/*`);
});
