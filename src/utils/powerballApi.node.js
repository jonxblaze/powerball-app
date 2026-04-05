// Node-only Powerball API utilities
import fetch from 'node-fetch';

export const BASE_URL = "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/{game}/{page}/{size}";
export const GAMES = {
  POWERBALL: 12,
  "MEGA Millions": 15,
  "SuperLotto Plus": 8
};

export async function fetchResults(gameId, page, size = 20) {
  const url = BASE_URL
    .replace("{game}", gameId)
    .replace("{page}", page)
    .replace("{size}", size);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function fetchAllDraws(gameId = GAMES.POWERBALL) {
  let allDraws = [];
  let page = 1;
  while (true) {
    const data = await fetchResults(gameId, page);
    const draws = data?.PreviousDraws ?? [];
    if (draws.length === 0) break;
    allDraws = allDraws.concat(draws);
    page++;
    await new Promise((r) => setTimeout(r, 500));
  }
  return allDraws;
}
