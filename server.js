import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;  // Changed from 5000 to 5001 to avoid macOS AirPlay conflicts

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const BASE_URL = "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/{game}/{page}/{size}";
const GAMES = {
  POWERBALL: 12,
  "MEGA Millions": 15,
  "SuperLotto Plus": 8
};

async function fetchResults(gameId, page, size = 20) {
  const url = BASE_URL
    .replace("{game}", gameId)
    .replace("{page}", page)
    .replace("{size}", size);

  // Using a more standard fetch approach
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.calottery.com/',
        'Origin': 'https://www.calottery.com',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Endpoint to update powerball results
app.post('/api/update-powerball', async (req, res) => {
  try {
    const gameId = GAMES.POWERBALL;
    let allDraws = [];
    let page = 1;

    console.log("Fetching Powerball results from calottery.com ...");

    while (true) {
      try {
        const data = await fetchResults(gameId, page);
        const draws = data?.PreviousDraws ?? [];

        if (draws.length === 0) {
          console.log(`No more results after page ${page}.`);
          break;
        }

        allDraws = allDraws.concat(draws);
        console.log(`Fetched page ${page}: ${draws.length} draws (total: ${allDraws.length})`);

        page++;
        await new Promise((r) => setTimeout(r, 500)); // Be nice to the API
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
        break;
      }
    }

    // Write to the JSON file in the public directory so it's accessible to the frontend
    const filePath = path.join(process.cwd(), 'public', 'powerball_results.json');
    fs.writeFileSync(filePath, JSON.stringify(allDraws, null, 2), "utf8");
    console.log(`\n✅ Done! Saved ${allDraws.length} Powerball results to ${filePath}`);
    
    res.json({ 
      success: true, 
      message: `Successfully updated powerball results with ${allDraws.length} draws`,
      count: allDraws.length
    });
  } catch (error) {
    console.error("Error updating powerball data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating powerball data",
      error: error.message 
    });
  }
});

// Endpoint to serve the powerball data
app.get('/api/powerball-data', (req, res) => {
  try {
    // Use absolute path to ensure correct location
    const filePath = path.join(process.cwd(), 'public', 'powerball_results.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    res.json(data);
  } catch (error) {
    console.error("Error serving powerball data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error loading powerball data",
      error: error.message 
    });
  }
});

// Endpoint to check the last update time
app.get('/api/powerball-status', (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'powerball_results.json');
    const stats = fs.statSync(filePath);
    
    res.json({ 
      success: true, 
      lastUpdated: stats.mtime,
      message: "Powerball results file exists and is accessible"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Powerball results file not found",
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});