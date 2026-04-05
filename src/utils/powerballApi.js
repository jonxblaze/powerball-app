// Centralized Powerball API logic and parsing utilities
// Pure browser-safe utilities and constants
export const BASE_URL = "https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/{game}/{page}/{size}";
export const GAMES = {
  POWERBALL: 12,
  "MEGA Millions": 15,
  "SuperLotto Plus": 8
};


/**
 * Extracts winning numbers from draw data
 */
export function extractWinningNumbers(data) {
  return data.map(entry => {
    const numbers = [];
    for (let i = 0; i <= 5; i++) {
      if (entry.WinningNumbers && entry.WinningNumbers[i]) {
        numbers.push(parseInt(entry.WinningNumbers[i].Number));
      }
    }
    return numbers;
  }).filter(numbers => numbers.length === 6);
}
