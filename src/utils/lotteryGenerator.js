import Papa from 'papaparse';

export const parseCsvData = async (csvString) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const winningNumbers = results.data.map(row => row['Winning Numbers'].split(' ').map(Number));
        resolve(winningNumbers);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const generateWinningNumber = (allWinningNumbers) => {
  if (!allWinningNumbers || allWinningNumbers.length === 0) {
    return null;
  }

  const flatNumbers = allWinningNumbers.flat();
  const numberCounts = {};
  flatNumbers.forEach(num => {
    numberCounts[num] = (numberCounts[num] || 0) + 1;
  });

  // Sort numbers by frequency in descending order
  const sortedNumbers = Object.entries(numberCounts).sort(([, countA], [, countB]) => countB - countA);

  // Select the top 5 most frequent numbers for the main balls
  const mainBalls = sortedNumbers.slice(0, 5).map(([num]) => Number(num)).sort((a, b) => a - b);

  // Select the most frequent Powerball number (the last number in each winning set)
  const powerballs = allWinningNumbers.map(numbers => numbers[numbers.length - 1]);
  const powerballCounts = {};
  powerballs.forEach(num => {
    powerballCounts[num] = (powerballCounts[num] || 0) + 1;
  });
  const sortedPowerballs = Object.entries(powerballCounts).sort(([, countA], [, countB]) => countB - countA);
  const powerball = Number(sortedPowerballs[0][0]);

  return { mainBalls, powerball };
};
