// Function to parse the Powerball data from the CSV content
export const parsePowerballData = (csvText) => {
  const lines = csvText.trim().split('\n');
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    
    const values = line.split(',');
    const date = values[0];
    const numbersStr = values[1];
    const multiplier = values[2];
    
    // Parse the winning numbers (first 5 are regular numbers, last is powerball)
    const numbers = numbersStr.split(' ').filter(n => n).map(Number);
    
    results.push({
      date,
      numbers: numbers.slice(0, 5), // First 5 numbers
      powerball: numbers[5], // Last number is the powerball
      multiplier: multiplier ? Number(multiplier) : null
    });
  }
  
  return results;
};

// Function to analyze number frequencies
export const analyzeFrequencies = (data) => {
  const numberFreq = {};
  const powerballFreq = {};
  
  data.forEach(draw => {
    // Count regular numbers (1-69)
    draw.numbers.forEach(num => {
      numberFreq[num] = (numberFreq[num] || 0) + 1;
    });
    
    // Count powerball numbers (1-26)
    if (draw.powerball !== undefined) {
      powerballFreq[draw.powerball] = (powerballFreq[draw.powerball] || 0) + 1;
    }
  });
  
  return { numberFreq, powerballFreq };
};

// Function to generate a random Powerball combination based on historical data
export const generatePowerballNumbers = (data) => {
  if (!data || data.length === 0) {
    // Fallback to random generation if no data
    return {
      numbers: Array.from({length: 5}, () => Math.floor(Math.random() * 69) + 1),
      powerball: Math.floor(Math.random() * 26) + 1
    };
  }
  
  const { numberFreq, powerballFreq } = analyzeFrequencies(data);
  
  // Convert frequency objects to arrays of [number, frequency] pairs
  const numberEntries = Object.entries(numberFreq).map(([num, freq]) => [Number(num), freq]);
  const powerballEntries = Object.entries(powerballFreq).map(([num, freq]) => [Number(num), freq]);
  
  // Weighted random selection for regular numbers
  const selectWeightedNumbers = (entries, count) => {
    const selected = [];
    const availableEntries = [...entries];
    
    for (let i = 0; i < count; i++) {
      if (availableEntries.length === 0) break;
      
      // Calculate total frequency for normalization
      const totalFreq = availableEntries.reduce((sum, [, freq]) => sum + freq, 0);
      
      // Generate a random value
      const rand = Math.random() * totalFreq;
      
      // Find the selected number based on weighted probability
      let cumulativeFreq = 0;
      let selectedIndex = 0;
      
      for (let j = 0; j < availableEntries.length; j++) {
        cumulativeFreq += availableEntries[j][1];
        if (rand <= cumulativeFreq) {
          selectedIndex = j;
          break;
        }
      }
      
      // Add selected number to results
      const [selectedNum] = availableEntries.splice(selectedIndex, 1)[0];
      selected.push(selectedNum);
    }
    
    return selected.sort((a, b) => a - b);
  };
  
  // Select 5 unique numbers from 1-69
  const numbers = selectWeightedNumbers(numberEntries, 5);
  
  // Select 1 powerball number from 1-26
  const powerball = selectWeightedNumbers(powerballEntries, 1)[0];
  
  return { numbers, powerball };
};