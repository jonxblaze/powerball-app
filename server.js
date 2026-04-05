/* eslint-env node */
/* global process */
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

// ✅ ESM-safe __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'powerball_results.json');
const UPDATE_LOCK_FILE_PATH = path.join(process.cwd(), 'public', '.powerball_update.lock');
const UPDATE_LOCK_STALE_MS = 30 * 60 * 1000;

import { fetchAllDraws, GAMES } from './src/utils/powerballApi.node.js';

let updateInProgress = false;

async function acquireUpdateLock() {
  if (updateInProgress) {
    return { acquired: false, reason: 'in-progress' };
  }

  const nowIso = new Date().toISOString();
  try {
    const lockHandle = await fs.open(UPDATE_LOCK_FILE_PATH, 'wx');
    await lockHandle.writeFile(nowIso, 'utf8');
    await lockHandle.close();
    return { acquired: true };
  } catch (error) {
    if (error?.code !== 'EEXIST') {
      throw error;
    }

    // Existing lock: clear stale lock and retry once.
    try {
      const stats = await fs.stat(UPDATE_LOCK_FILE_PATH);
      const ageMs = Date.now() - stats.mtimeMs;
      if (ageMs > UPDATE_LOCK_STALE_MS) {
        console.warn('[LOCK] Removing stale Powerball update lock.');
        await fs.unlink(UPDATE_LOCK_FILE_PATH);

        const retryHandle = await fs.open(UPDATE_LOCK_FILE_PATH, 'wx');
        await retryHandle.writeFile(nowIso, 'utf8');
        await retryHandle.close();
        return { acquired: true };
      }
    } catch (statOrUnlinkError) {
      if (statOrUnlinkError?.code !== 'ENOENT') {
        throw statOrUnlinkError;
      }
      // Lock was removed by another process between checks.
      const retryHandle = await fs.open(UPDATE_LOCK_FILE_PATH, 'wx');
      await retryHandle.writeFile(nowIso, 'utf8');
      await retryHandle.close();
      return { acquired: true };
    }

    return { acquired: false, reason: 'lock-exists' };
  }
}

async function releaseUpdateLock() {
  try {
    await fs.unlink(UPDATE_LOCK_FILE_PATH);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.error('[LOCK] Failed to release update lock:', error);
    }
  }
}

async function startPowerballUpdateInBackground(trigger = 'manual') {
  const lock = await acquireUpdateLock();
  if (!lock.acquired) {
    return { started: false, reason: lock.reason };
  }

  updateInProgress = true;
  void (async () => {
    try {
      const allDraws = await fetchAllDraws(GAMES.POWERBALL);
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(allDraws, null, 2), 'utf8');
      console.log(`[${trigger}] ✅ Saved ${allDraws.length} Powerball results to ${DATA_FILE_PATH}`);
      console.log(`[${trigger}] ✅ Update completed. Fetched ${allDraws.length} Powerball results.`);
    } catch (error) {
      console.error(`[${trigger}] Error during Powerball update:`, error);
    } finally {
      updateInProgress = false;
      await releaseUpdateLock();
    }
  })();

  return { started: true };
}

// --- SCHEDULED POWERBALL DATA UPDATE ---
// Powerball drawings: Mon, Wed, Sat at 7:59 PM Pacific Time
// Schedule fetch for 8:05 PM PT (to allow for result processing)
cron.schedule('5 20 * * 1,3,6', async () => {
  console.log('[CRON] Triggering scheduled Powerball data update after drawing...');
  try {
    const result = await startPowerballUpdateInBackground('CRON');
    if (!result.started) {
      console.log('[CRON] Update already in progress, skipping scheduled update.');
    }
  } catch (err) {
    console.error('[CRON] Failed to trigger scheduled update:', err);
  }
}, {
  timezone: 'America/Los_Angeles'
});

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

API_ROUTES.post('/update-powerball', async (req, res) => {
  try {
    const result = await startPowerballUpdateInBackground('API');
    if (!result.started) {
      return res.status(409).json({
        success: false,
        message: 'Update operation already in progress. Please wait.',
      });
    }

    return res.json({
      success: true,
      message: 'Update initiated. This may take several minutes, but the operation is running in the background.',
    });
  } catch (error) {
    console.error('Failed to start background update:', error);
    return res.status(409).json({
      success: false,
      message: 'Could not start update operation.',
      error: error.message,
    });
  }
});

// ✅ Endpoint: Serve stored Powerball data
API_ROUTES.get('/powerball-data', async (req, res) => {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf8');
    const data = JSON.parse(fileContent);
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
API_ROUTES.get('/powerball-status', async (req, res) => {
  try {
    const stats = await fs.stat(DATA_FILE_PATH);
    res.json({
      success: true,
      lastUpdated: stats.mtime,
      updateInProgress: updateInProgress,
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

// ✅ Endpoint: Check update status
API_ROUTES.get('/update-status', (req, res) => {
  res.json({
    success: true,
    updateInProgress: updateInProgress,
    message: updateInProgress 
      ? 'Update is currently in progress' 
      : 'No update operations running',
  });
});

// Mount API routes at both /api and /app/api for deployment flexibility
app.use('/api', API_ROUTES);
app.use('/app/api', API_ROUTES);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at /api/* and /app/api/*`);
});
