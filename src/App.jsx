import { useState, useEffect } from 'react';
import { parsePowerballData, generateSophisticatedNumbers } from './utils/sophisticatedLottery';
import { extractWinningNumbers } from './utils/powerballApi';

const DEFAULT_ALGORITHM_DESCRIPTION = 'Select an algorithm to see its description.';

const sortByDrawDateDesc = (data) =>
  data.sort((a, b) => {
    const dateA = new Date(a.DrawDate);
    const dateB = new Date(b.DrawDate);
    return dateB - dateA;
  });

const extractRecentNumbers = (sortedData) => {
  if (!sortedData.length) {
    return null;
  }

  const mostRecentEntry = sortedData[0];
  if (!mostRecentEntry || !mostRecentEntry.WinningNumbers) {
    return null;
  }

  const numbers = [];
  for (let i = 0; i <= 5; i++) {
    if (mostRecentEntry.WinningNumbers[i]) {
      numbers.push(parseInt(mostRecentEntry.WinningNumbers[i].Number, 10));
    }
  }

  if (numbers.length !== 6) {
    return null;
  }

  return {
    mainBalls: numbers.slice(0, 5).sort((a, b) => a - b),
    powerball: numbers[5],
  };
};

function App() {
  const [allWinningNumbers, setAllWinningNumbers] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [generatedNumbers, setGeneratedNumbers] = useState(null);
  const [recentNumbers, setRecentNumbers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [algorithm, setAlgorithm] = useState('combined');
  const [algorithmDescription, setAlgorithmDescription] = useState(DEFAULT_ALGORITHM_DESCRIPTION);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load data only; updates are handled by backend schedule.
        const result = await parsePowerballData();
        setAllWinningNumbers(result.winningNumbers);
        setOriginalData(result.sortedData);
        setRecentNumbers(extractRecentNumbers(result.sortedData));
        setAlgorithmDescription(DEFAULT_ALGORITHM_DESCRIPTION);
        setLoading(false);
      } catch (err) {
        console.error("Error during data loading:", err);
        
        // If the API call fails, try to load from the local JSON file directly
        try {
          console.log("API loading failed, falling back to local JSON...");
          // Fetch the local JSON file from public directory
          const response = await fetch('/powerball_results.json');
          if (!response.ok) throw new Error('Local JSON fetch failed');
          const data = await response.json();
          
          const sortedData = sortByDrawDateDesc(data);
          
          const winningNumbers = extractWinningNumbers(sortedData);
          setAllWinningNumbers(winningNumbers);
          setOriginalData(sortedData);
          setRecentNumbers(extractRecentNumbers(sortedData));
          setAlgorithmDescription(DEFAULT_ALGORITHM_DESCRIPTION);
          setLoading(false);
        } catch (fallbackError) {
          // If all attempts fail, show an error
          setError('Failed to load Powerball data. The backend server may not be running.');
          setLoading(false);
          console.error("Fallback loading also failed:", fallbackError);
        }
      }
    };
    loadData();
  }, []);

  const getAlgorithmDescription = (selectedAlgorithm) => {
    switch(selectedAlgorithm) {
      case 'frequency':
        return 'Selects numbers based on how frequently they have appeared in historical draws.';
      case 'hotCold':
        return 'Combines recently frequent ("hot") numbers with older, less frequent ("cold") numbers.';
      case 'balanced':
        return 'Ensures numbers are distributed across different numerical ranges for balanced coverage.';
      case 'pattern':
        return 'Analyzes patterns like odd/even ratios, low/high number ratios, and sum totals.';
      case 'statistical':
        return 'Uses statistical measures like mean, median, and standard deviation for number generation.';
      case 'combined':
        return 'Uses multiple approaches and combines their results for comprehensive analysis.';
      default:
        return 'Select an algorithm to see its description.';
    }
  };

  const handleAlgorithmChange = (e) => {
    const selectedAlgorithm = e.target.value;
    setAlgorithm(selectedAlgorithm);
    setAlgorithmDescription(getAlgorithmDescription(selectedAlgorithm));
    
    // Automatically generate numbers when algorithm changes
    if (allWinningNumbers.length > 0) {
      const newNumbers = generateSophisticatedNumbers(allWinningNumbers, selectedAlgorithm);
      setGeneratedNumbers(newNumbers);
    } else {
      setError('Powerball data not loaded yet.');
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading Powerball data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-red-500 text-center">Powerball Generator</h1>

      {/* Display Most Recent Winning Numbers at the top */}
      <div className="bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg shadow-lg text-center mb-4 sm:mb-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-yellow-300">Most Recent Winning Numbers</h2>
        {recentNumbers ? (
          <>
            <div className="text-base sm:text-lg mb-3 text-gray-300">
              {originalData.length > 0 ? new Date(originalData[0].DrawDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Date not available'}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
              {recentNumbers.mainBalls.map((num, index) => (
                <span key={`recent-${index}`} className="bg-blue-500 text-white text-lg sm:text-xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shadow-md">
                  {num.toString().padStart(2, '0')}
                </span>
              ))}
              <span className="text-xl sm:text-3xl font-bold text-yellow-400">+</span>
              <span className="bg-red-500 text-white text-lg sm:text-xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shadow-md">
                {recentNumbers.powerball.toString().padStart(2, '0')}
              </span>
            </div>
          </>
        ) : (
          <p className="text-gray-300">Loading recent results...</p>
        )}
      </div>

      <div className="bg-gray-800 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
        {generatedNumbers ? (
          <div className="mb-4 sm:mb-6">
            <p className="text-xl sm:text-2xl mb-3 sm:mb-4">Your Generated Numbers:</p>
            <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mb-4 sm:mb-6">
              {generatedNumbers.mainBalls.map((num, index) => (
                <span key={index} className="bg-blue-600 text-white text-lg sm:text-2xl font-bold w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shadow-md">
                  {num.toString().padStart(2, '0')}
                </span>
              ))}
              <span className="text-xl sm:text-4xl font-bold text-yellow-400">+</span>
              <span className="bg-red-600 text-white text-lg sm:text-2xl font-bold w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shadow-md">
                {generatedNumbers.powerball.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 sm:mb-6 text-center">
            <p className="text-lg sm:text-xl mb-3 sm:mb-4">Ready to generate your Powerball numbers!</p>
            <p className="text-base sm:text-lg text-gray-300">Click the button below to create your unique number combination.</p>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="algorithm" className="block text-base sm:text-lg mb-2">Algorithm:</label>
          <select
            id="algorithm"
            value={algorithm}
            onChange={handleAlgorithmChange}
            className="bg-gray-700 text-white p-2 rounded mb-2 w-full max-w-[240px] mx-auto block"
          >
            <option value="frequency">Frequency Analysis</option>
            <option value="hotCold">Hot/Cold Numbers</option>
            <option value="balanced">Balanced Distribution</option>
            <option value="pattern">Pattern Analysis</option>
            <option value="statistical">Statistical Analysis</option>
            <option value="combined">Combined Approach</option>
          </select>
          <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-[240px] mx-auto">{algorithmDescription}</p>
        </div>

        <div className="text-green-400 text-sm sm:text-base mt-2 italic">
          Numbers will automatically generate when you select an algorithm
        </div>
      </div>

      <p className="mt-6 sm:mt-8 text-gray-400 text-xs sm:text-sm text-center max-w-md">
        Disclaimer: This generator uses historical data to suggest numbers and does not guarantee actual lottery wins.
      </p>
    </div>
  );
}

export default App;
