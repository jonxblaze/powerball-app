/**
 * Parses JSON data from the Powerball results dataset
 * @returns {Promise<Array>} Array of winning number sets
 */
export const parseJsonData = async () => {
  // Import the JSON data directly
  const response = await fetch(new URL('./powerball_results.json', import.meta.url));
  const data = await response.json();
  
  // Transform the JSON data to the format expected by the algorithms
  // Each entry has WinningNumbers with keys 0-5, where 0-4 are main balls and 5 is Powerball
  const winningNumbers = data.map(entry => {
    const numbers = [];
    
    // Extract numbers 0-5 from the WinningNumbers object
    for (let i = 0; i <= 5; i++) {
      if (entry.WinningNumbers[i]) {
        numbers.push(parseInt(entry.WinningNumbers[i].Number));
      }
    }
    
    return numbers;
  }).filter(numbers => numbers.length === 6); // Ensure we have exactly 6 numbers (5 main + 1 Powerball)
  
  return winningNumbers;
};

/**
 * Sophisticated algorithm combining multiple approaches
 * @param {Array} allWinningNumbers - Array of all historical winning number sets
 * @param {string} algorithmType - Type of algorithm to use (frequency, hotCold, balanced, pattern, statistical, combined)
 * @returns {Object} Object with mainBalls (array) and powerball (number)
 */
export const generateSophisticatedNumbers = (allWinningNumbers, algorithmType = 'combined') => {
  if (!allWinningNumbers || allWinningNumbers.length === 0) {
    return null;
  }

  let result;
  switch (algorithmType) {
    case 'frequency':
      result = generateByFrequency(allWinningNumbers);
      break;
    case 'hotCold':
      result = generateByHotCold(allWinningNumbers);
      break;
    case 'balanced':
      result = generateByBalancedDistribution(allWinningNumbers);
      break;
    case 'pattern':
      result = generateByPatterns(allWinningNumbers);
      break;
    case 'statistical':
      result = generateByStatisticalAnalysis(allWinningNumbers);
      break;
    case 'combined':
    default:
      result = generateByCombinedApproach(allWinningNumbers);
      break;
  }

  // Check if the generated combination already exists in historical data
  if (result) {
    const generatedCombination = [...result.mainBalls, result.powerball].sort((a, b) => a - b);
    
    // Convert historical combinations to sorted arrays for comparison
    const historicalCombinations = allWinningNumbers.map(numbers => [...numbers].sort((a, b) => a - b));
    
    // Check if the generated combination matches any historical combination
    const isDuplicate = historicalCombinations.some(historical => 
      JSON.stringify(historical) === JSON.stringify(generatedCombination)
    );
    
    // If it's a duplicate, try again with more randomness (up to 10 times)
    if (isDuplicate) {
      console.log("Generated combination is a duplicate, regenerating...");
      for (let i = 0; i < 10; i++) {
        // Regenerate with more randomness by using different algorithm
        const newResult = generateByCombinedApproach(allWinningNumbers);
        const newCombination = [...newResult.mainBalls, newResult.powerball].sort((a, b) => a - b);
        
        const isStillDuplicate = historicalCombinations.some(historical => 
          JSON.stringify(historical) === JSON.stringify(newCombination)
        );
        
        if (!isStillDuplicate) {
          return newResult;
        }
      }
      
      // If still a duplicate after 10 tries, generate a completely random combination
      console.log("Could not find a unique combination after 10 tries, generating a random one...");
      return generateRandomCombination();
    }
  }

  return result;
};

/**
 * Fetches and parses the Powerball results from the JSON file
 * @returns {Promise<Object>} Object with winningNumbers array and sorted original data
 */
export const parsePowerballData = async () => {
  try {
    // Using fetch to get the JSON data
    const response = await fetch(new URL('./powerball_results.json', import.meta.url));
    if (!response.ok) {
      throw new Error(`Failed to load Powerball data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    
    // Sort the data by DrawDate to ensure chronological order, with most recent first
    const sortedData = data.sort((a, b) => {
      const dateA = new Date(a.DrawDate);
      const dateB = new Date(b.DrawDate);
      return dateB - dateA; // Sort in descending order (most recent first)
    });
    
    // Transform the sorted JSON data to the format expected by the algorithms
    // Each entry has WinningNumbers with keys 0-5, where 0-4 are main balls and 5 is Powerball
    const winningNumbers = sortedData.map(entry => {
      const numbers = [];
      
      // Extract numbers 0-5 from the WinningNumbers object
      for (let i = 0; i <= 5; i++) {
        if (entry.WinningNumbers && entry.WinningNumbers[i]) {
          numbers.push(parseInt(entry.WinningNumbers[i].Number));
        }
      }
      
      return numbers;
    }).filter(numbers => numbers.length === 6); // Ensure we have exactly 6 numbers (5 main + 1 Powerball)
    
    return { winningNumbers, sortedData };
  } catch (error) {
    console.error('Error parsing Powerball data:', error);
    throw error;
  }
};

/**
 * Generates numbers based on frequency analysis with additional constraints
 */
const generateByFrequency = (allWinningNumbers) => {
  // Separate main balls (first 5) and Powerball (last number)
  const allMainBalls = [];
  const allPowerballs = [];
  
  allWinningNumbers.forEach(numbers => {
    const mainBalls = numbers.slice(0, 5);
    const powerball = numbers[numbers.length - 1];
    
    allMainBalls.push(...mainBalls);
    allPowerballs.push(powerball);
  });

  // Calculate frequency for main balls
  const mainBallCounts = {};
  allMainBalls.forEach(num => {
    mainBallCounts[num] = (mainBallCounts[num] || 0) + 1;
  });

  // Calculate frequency for Powerball
  const powerballCounts = {};
  allPowerballs.forEach(num => {
    powerballCounts[num] = (powerballCounts[num] || 0) + 1;
  });

  // Sort by frequency and pick top 5 for main balls
  const sortedMainBalls = Object.entries(mainBallCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([num]) => Number(num));
  
  // Sort by frequency for Powerball
  const sortedPowerballs = Object.entries(powerballCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([num]) => Number(num));

  // Ensure we have unique numbers for main balls (avoid duplicates)
  const mainBalls = sortedMainBalls.slice(0, 5).sort((a, b) => a - b);
  
  // Pick from among the top few most frequent Powerballs to add some variation
  const topPowerballs = sortedPowerballs.slice(0, 3); // Take top 3 most frequent
  const powerball = topPowerballs[Math.floor(Math.random() * topPowerballs.length)];

  return { mainBalls, powerball };
};

/**
 * Generates numbers based on hot/cold analysis
 */
const generateByHotCold = (allWinningNumbers) => {
  // Determine the most recent draws to identify hot numbers
  const recentDraws = allWinningNumbers.slice(-20); // Last 20 draws for hot numbers
  const olderDraws = allWinningNumbers.slice(0, -20); // Older draws for cold numbers

  // Calculate frequencies in recent and older draws
  const recentMainBalls = [];
  const recentPowerballs = [];
  const olderMainBalls = [];
  const olderPowerballs = [];
  
  recentDraws.forEach(numbers => {
    recentMainBalls.push(...numbers.slice(0, 5));
    recentPowerballs.push(numbers[numbers.length - 1]);
  });

  olderDraws.forEach(numbers => {
    olderMainBalls.push(...numbers.slice(0, 5));
    olderPowerballs.push(numbers[numbers.length - 1]);
  });

  // Find hot (most frequent in recent) and cold (least frequent in recent) numbers
  const recentMainBallCounts = {};
  recentMainBalls.forEach(num => {
    recentMainBallCounts[num] = (recentMainBallCounts[num] || 0) + 1;
  });

  const recentPowerballCounts = {};
  recentPowerballs.forEach(num => {
    recentPowerballCounts[num] = (recentPowerballCounts[num] || 0) + 1;
  });

  // Sort main balls: mix of hot and cold
  const sortedByRecent = Object.entries(recentMainBallCounts)
    .sort(([, countA], [, countB]) => countB - countA); // Most frequent first (hot)

  const hotMainBalls = sortedByRecent.slice(0, 2).map(([num]) => Number(num)); // Take 2 hot numbers

  // For cold numbers, we need to get numbers that appeared least in recent draws
  const allMainBalls = [...new Set([...recentMainBalls, ...olderMainBalls])]; // All unique numbers
  const coldMainBalls = allMainBalls
    .filter(num => !recentMainBallCounts[num]) // Numbers not in recent draws
    .slice(0, 3); // Take 3 cold numbers

  const mainBalls = [...hotMainBalls, ...coldMainBalls].sort((a, b) => a - b);

  // For Powerball: take most frequent in recent (hot) or least frequent (cold) if none exist
  const hotPowerballs = Object.entries(recentPowerballCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([num]) => Number(num));

  // Add some randomness by selecting from top few
  let powerball;
  if (hotPowerballs.length > 0) {
    const topHotPowerballs = hotPowerballs.slice(0, 3); // Take top 3 most frequent
    powerball = topHotPowerballs[Math.floor(Math.random() * topHotPowerballs.length)];
  } else {
    // Use all powerballs from the original dataset if no recent ones
    const allPowerballs = allWinningNumbers.map(numbers => numbers[numbers.length - 1]);
    powerball = allPowerballs.length > 0 ? Math.max(...allPowerballs) : 1;
  }

  return { mainBalls, powerball };
};

/**
 * Generates numbers based on balanced distribution
 */
const generateByBalancedDistribution = (allWinningNumbers) => {
  // Calculate how numbers are distributed across ranges historically
  const rangeCounts = {
    '1-14': 0,
    '15-28': 0,
    '29-42': 0,
    '43-56': 0,
    '57-69': 0
  };
  
  allWinningNumbers.forEach(numbers => {
    numbers.slice(0, 5).forEach(num => {
      if (num >= 1 && num <= 14) rangeCounts['1-14']++;
      else if (num >= 15 && num <= 28) rangeCounts['15-28']++;
      else if (num >= 29 && num <= 42) rangeCounts['29-42']++;
      else if (num >= 43 && num <= 56) rangeCounts['43-56']++;
      else if (num >= 57 && num <= 69) rangeCounts['57-69']++;
    });
  });
  
  // Select one number from each range (or as close to balanced as possible)
  const ranges = [
    { min: 1, max: 14 },
    { min: 15, max: 28 },
    { min: 29, max: 42 },
    { min: 43, max: 56 },
    { min: 57, max: 69 }
  ];
  
  const mainBalls = [];
  ranges.forEach(range => {
    // Get all numbers in the range that have appeared historically
    const numbersInRange = allWinningNumbers.flatMap(numbers => numbers.slice(0, 5))
      .filter(num => num >= range.min && num <= range.max);
    
    if (numbersInRange.length > 0) {
      // Select a random number from available numbers in this range
      const uniqueNumbers = [...new Set(numbersInRange)];
      const randomNum = uniqueNumbers[Math.floor(Math.random() * uniqueNumbers.length)];
      mainBalls.push(randomNum);
    } else {
      // If no numbers in range, pick a random number within the range
      const randomNum = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      mainBalls.push(randomNum);
    }
  });
  
  // Remove duplicates and ensure 5 unique numbers
  const uniqueMainBalls = [...new Set(mainBalls)].sort((a, b) => a - b);
  while (uniqueMainBalls.length < 5) {
    const range = ranges[uniqueMainBalls.length];
    const randomNum = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    if (!uniqueMainBalls.includes(randomNum)) {
      uniqueMainBalls.push(randomNum);
    }
  }
  
  // For Powerball, use the most common number
  const allPowerballs = allWinningNumbers.map(numbers => numbers[numbers.length - 1]);
  const powerballCounts = {};
  allPowerballs.forEach(num => {
    powerballCounts[num] = (powerballCounts[num] || 0) + 1;
  });
  
  const sortedPowerballs = Object.entries(powerballCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([num]) => Number(num));
  
  // Add randomness by selecting from top few
  const topPowerballs = sortedPowerballs.slice(0, 3); // Take top 3 most frequent
  const powerball = topPowerballs[Math.floor(Math.random() * topPowerballs.length)];
  
  return { mainBalls: uniqueMainBalls.slice(0, 5).sort((a, b) => a - b), powerball };
};

/**
 * Generates numbers based on pattern analysis (odd/even, low/high, sum ranges)
 */
const generateByPatterns = (allWinningNumbers) => {
  // Analyze historical patterns
  const patterns = {
    oddEven: [],
    lowHigh: [],
    sum: [],
    sequences: []
  };
  
  allWinningNumbers.forEach(numbers => {
    const mainBalls = numbers.slice(0, 5);
    
    // Count odd/even numbers
    const oddCount = mainBalls.filter(num => num % 2 !== 0).length;
    patterns.oddEven.push(oddCount);
    
    // Count low/high numbers (low: 1-34, high: 35-69)
    const lowCount = mainBalls.filter(num => num <= 34).length;
    patterns.lowHigh.push({low: lowCount, high: 5 - lowCount});
    
    // Calculate sum
    const sum = mainBalls.reduce((acc, num) => acc + num, 0);
    patterns.sum.push(sum);
  });
  
  // Determine common patterns
  const avgOddEven = Math.round(patterns.oddEven.reduce((a, b) => a + b, 0) / patterns.oddEven.length);
  const avgLowHigh = patterns.lowHigh.reduce((acc, pattern) => {
    acc.low += pattern.low;
    acc.high += pattern.high;
    return acc;
  }, {low: 0, high: 0});
  avgLowHigh.low = Math.round(avgLowHigh.low / patterns.lowHigh.length);
  avgLowHigh.high = Math.round(avgLowHigh.high / patterns.lowHigh.length);
  
  // Generate numbers matching the patterns
  let mainBalls = [];
  let attempts = 0;
  const maxAttempts = 100;
  
  while (mainBalls.length < 5 && attempts < maxAttempts) {
    mainBalls = [];
    
    // Generate based on odd/even pattern
    const desiredOdds = avgOddEven;
    const desiredEvens = 5 - desiredOdds;
    
    // Generate odd numbers
    const oddNumbers = allWinningNumbers.flatMap(numbers => numbers.slice(0, 5)).filter(num => num % 2 !== 0);
    const uniqueOddNumbers = [...new Set(oddNumbers)];
    for (let i = 0; i < desiredOdds && mainBalls.length < 5; i++) {
      const randomOdd = uniqueOddNumbers[Math.floor(Math.random() * uniqueOddNumbers.length)];
      if (!mainBalls.includes(randomOdd)) {
        mainBalls.push(randomOdd);
      }
    }
    
    // Generate even numbers
    const evenNumbers = allWinningNumbers.flatMap(numbers => numbers.slice(0, 5)).filter(num => num % 2 === 0);
    const uniqueEvenNumbers = [...new Set(evenNumbers)];
    for (let i = 0; i < desiredEvens && mainBalls.length < 5; i++) {
      const randomEven = uniqueEvenNumbers[Math.floor(Math.random() * uniqueEvenNumbers.length)];
      if (!mainBalls.includes(randomEven)) {
        mainBalls.push(randomEven);
      }
    }
    
    // Ensure we have 5 numbers (in case of duplicates or insufficient data)
    if (mainBalls.length < 5) {
      while (mainBalls.length < 5) {
        const randomNum = Math.floor(Math.random() * 69) + 1;
        if (!mainBalls.includes(randomNum)) {
          mainBalls.push(randomNum);
        }
      }
    }
    
    attempts++;
  }
  
  mainBalls.sort((a, b) => a - b);
  
  // For Powerball, use frequency analysis as before
  const allPowerballs = allWinningNumbers.map(numbers => numbers[numbers.length - 1]);
  const powerballCounts = {};
  allPowerballs.forEach(num => {
    powerballCounts[num] = (powerballCounts[num] || 0) + 1;
  });
  
  const sortedPowerballs = Object.entries(powerballCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([num]) => Number(num));
  
  // Add randomness by selecting from top few
  const topPowerballs = sortedPowerballs.slice(0, 3); // Take top 3 most frequent
  const powerball = topPowerballs[Math.floor(Math.random() * topPowerballs.length)];
  
  return { mainBalls, powerball };
};

/**
 * Generates numbers based on statistical analysis
 */
const generateByStatisticalAnalysis = (allWinningNumbers) => {
  // Calculate statistical measures
  const allMainBalls = allWinningNumbers.flatMap(numbers => numbers.slice(0, 5));
  const allPowerballs = allWinningNumbers.map(numbers => numbers[numbers.length - 1]);
  
  // Calculate mean, median, std deviation for main balls
  const meanMain = allMainBalls.reduce((a, b) => a + b, 0) / allMainBalls.length;
  const sortedMain = [...allMainBalls].sort((a, b) => a - b);
  const medianMain = sortedMain[Math.floor(sortedMain.length / 2)];
  
  // Calculate mean for Powerball
  const meanPowerball = allPowerballs.reduce((a, b) => a + b, 0) / allPowerballs.length;
  
  // Generate numbers around statistical measures
  const mainBalls = [];
  for (let i = 0; i < 5; i++) {
    // Select numbers using both mean and median with variation
    const positionFactor = i / 4; // 0 to 1 for distribution across range
    let num = Math.round(meanMain * (1 - positionFactor) + medianMain * positionFactor + (Math.random() - 0.5) * 10); // Add random variation
    
    // Ensure it's within valid range
    num = Math.max(1, Math.min(69, num));
    
    // Ensure uniqueness
    while (mainBalls.includes(num)) {
      num = Math.floor(Math.random() * 69) + 1;
    }
    
    mainBalls.push(num);
  }
  
  // For Powerball, use the calculated mean with some random variation
  let powerball = Math.round(meanPowerball + (Math.random() - 0.5) * 5); // Add some variation
  if (isNaN(powerball) || powerball < 1) {
    // Fallback to most frequent if mean calculation fails
    const powerballCounts = {};
    allPowerballs.forEach(num => {
      powerballCounts[num] = (powerballCounts[num] || 0) + 1;
    });
    
    const sortedPowerballs = Object.entries(powerballCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([num]) => Number(num));
    
    // Add randomness by selecting from top few
    const topPowerballs = sortedPowerballs.slice(0, 3); // Take top 3 most frequent
    powerball = topPowerballs[Math.floor(Math.random() * topPowerballs.length)];
  }
  
  // Ensure powerball is in valid range (1-26 for Powerball)
  powerball = Math.max(1, Math.min(26, powerball));
  
  return { mainBalls: mainBalls.sort((a, b) => a - b), powerball };
};

/**
 * Generates a completely random combination of Powerball numbers
 * Used as a fallback when all sophisticated algorithms produce duplicates
 */
const generateRandomCombination = () => {
  // Generate 5 unique main balls from 1-69
  const mainBalls = [];
  while (mainBalls.length < 5) {
    const num = Math.floor(Math.random() * 69) + 1;
    if (!mainBalls.includes(num)) {
      mainBalls.push(num);
    }
  }
  
  // Generate Powerball number from 1-26
  const powerball = Math.floor(Math.random() * 26) + 1;
  
  return { 
    mainBalls: mainBalls.sort((a, b) => a - b), 
    powerball 
  };
};

/**
 * Combined approach that uses multiple methods and combines results based on historical performance
 */
const generateByCombinedApproach = (allWinningNumbers) => {
  // Use each individual algorithm to generate numbers
  const freqResult = generateByFrequency(allWinningNumbers);
  const hotColdResult = generateByHotCold(allWinningNumbers);
  const balancedResult = generateByBalancedDistribution(allWinningNumbers);
  const patternResult = generateByPatterns(allWinningNumbers);
  const statisticalResult = generateByStatisticalAnalysis(allWinningNumbers);
  
  // Combine results by taking numbers from different approaches
  // This approach takes different balls from different algorithms
  const allMainBalls = [
    ...freqResult.mainBalls.slice(0, 1),    // 1 from frequency
    ...hotColdResult.mainBalls.slice(0, 1), // 1 from hot/cold
    ...balancedResult.mainBalls.slice(0, 1),// 1 from balanced
    ...patternResult.mainBalls.slice(0, 1), // 1 from patterns
    ...statisticalResult.mainBalls.slice(0, 1) // 1 from statistical
  ];
  
  // Remove duplicates and ensure 5 unique numbers
  const uniqueMainBalls = [...new Set(allMainBalls)];
  while (uniqueMainBalls.length < 5) {
    uniqueMainBalls.push(Math.floor(Math.random() * 69) + 1);
  }
  
  // For Powerball, we'll take the most common one from the results
  const powerballOptions = [
    freqResult.powerball,
    hotColdResult.powerball,
    balancedResult.powerball,
    patternResult.powerball,
    statisticalResult.powerball
  ];
  
  // Add some randomness to avoid always picking the same Powerball
  const randomPowerball = powerballOptions[Math.floor(Math.random() * powerballOptions.length)];
  
  return { 
    mainBalls: uniqueMainBalls.slice(0, 5).sort((a, b) => a - b), 
    powerball: randomPowerball
  };
};

/**
 * Function to get detailed analysis of the algorithms
 */
export const getAlgorithmAnalysis = (allWinningNumbers) => {
  const algorithms = ['frequency', 'hotCold', 'balanced', 'pattern', 'statistical', 'combined'];
  const results = {};
  
  algorithms.forEach(algo => {
    results[algo] = generateSophisticatedNumbers(allWinningNumbers, algo);
  });
  
  return results;
};

/**
 * Function to get the most recent winning numbers from the dataset
 */
export const getMostRecentWinningNumbers = (allWinningNumbers) => {
  if (!allWinningNumbers || allWinningNumbers.length === 0) {
    return null;
  }
  
  // Get the last entry (most recent)
  const recentNumbers = allWinningNumbers[allWinningNumbers.length - 1];
  
  // Format as main balls and powerball
  if (recentNumbers && recentNumbers.length >= 6) {
    const mainBalls = recentNumbers.slice(0, 5).sort((a, b) => a - b);
    const powerball = recentNumbers[recentNumbers.length - 1];
    return { mainBalls, powerball };
  }
  
  return null;
};