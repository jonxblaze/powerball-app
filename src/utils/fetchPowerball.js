/**
 * Fetches all Powerball draw results from the California Lottery API
 * and saves them as a JSON file.
 * 
 * This script updates the powerball_results.json file.
 *
 * Run:
 *   node fetchPowerball.js
 */

import fs from "fs";
import { fetchAllDraws, GAMES } from "./powerballApi.node.js";

const OUTPUT = "powerball_results.json";

async function fetchAllPowerball() {
  console.log("Fetching Powerball results from calottery.com ...");
  try {
    const allDraws = await fetchAllDraws(GAMES.POWERBALL);
    fs.writeFileSync(OUTPUT, JSON.stringify(allDraws, null, 2), "utf8");
    console.log(`\n✅ Done! Saved ${allDraws.length} Powerball results to ${OUTPUT}`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

fetchAllPowerball();