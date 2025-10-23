/**
 * Fetches all Powerball draw results from the California Lottery API
 * and saves them as a JSON file.
 *
 * Run:
 *   npm init -y
 *   npm install node-fetch
 *   node fetchPowerball.js
 */

import fs from "fs";
import fetch from "node-fetch";

const BASE_URL = "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/{game}/{page}/{size}";
const GAMES = {
  POWERBALL: 12,
  "MEGA Millions": 15,
  "SuperLotto Plus": 8
};
const OUTPUT = "powerball_results.json";

async function fetchResults(gameId, page, size = 20) {
  const url = BASE_URL
    .replace("{game}", gameId)
    .replace("{page}", page)
    .replace("{size}", size);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function fetchAllPowerball() {
  const gameId = GAMES.POWERBALL;
  let allDraws = [];
  let page = 1;

  console.log("Fetching Powerball results from calottery.com ...");

  while (true) {
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
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(allDraws, null, 2), "utf8");
  console.log(`\n✅ Done! Saved ${allDraws.length} Powerball results to ${OUTPUT}`);
}

fetchAllPowerball().catch((err) => console.error("❌ Error:", err));
