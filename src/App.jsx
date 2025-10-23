import { useState, useEffect } from 'react';
import { parsePowerballData, generateSophisticatedNumbers } from './utils/sophisticatedLottery';

function App() {
  const [allWinningNumbers, setAllWinningNumbers] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [generatedNumbers, setGeneratedNumbers] = useState(null);
  const [recentNumbers, setRecentNumbers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [algorithm, setAlgorithm] = useState('combined');

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await parsePowerballData();
        setAllWinningNumbers(result.winningNumbers);
        setOriginalData(result.sortedData); // Store the original sorted data to access DrawDate
        
        // Set the most recent winning numbers by default
        if (result.sortedData.length > 0) {
          const mostRecentEntry = result.sortedData[0]; // First entry is the most recent due to sorting
          if (mostRecentEntry && mostRecentEntry.WinningNumbers) {
            const numbers = [];
            // Extract numbers 0-5 from the WinningNumbers object
            for (let i = 0; i <= 5; i++) {
              if (mostRecentEntry.WinningNumbers[i]) {
                numbers.push(parseInt(mostRecentEntry.WinningNumbers[i].Number));
              }
            }
            if (numbers.length === 6) { // Ensure we have exactly 6 numbers (5 main + 1 Powerball)
              const mainBalls = numbers.slice(0, 5).sort((a, b) => a - b);
              const powerball = numbers[5]; // The 6th number (index 5) is the Powerball
              setRecentNumbers({ mainBalls, powerball });
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load Powerball data.');
        setLoading(false);
        console.error(err);
      }
    };
    loadData();
  }, []);

  const handleGenerateNumbers = () => {
    if (allWinningNumbers.length > 0) {
      const newNumbers = generateSophisticatedNumbers(allWinningNumbers, algorithm);
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold mb-8 text-red-500">Powerball Generator</h1>

      {/* Display Most Recent Winning Numbers at the top */}
      <div className="bg-gray-700 p-6 rounded-lg shadow-lg text-center mb-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-yellow-300">Most Recent Winning Numbers</h2>
        {recentNumbers ? (
          <>
            <div className="text-lg mb-3 text-gray-300">
              {originalData.length > 0 ? new Date(originalData[0].DrawDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Date not available'}
            </div>
            <div className="flex justify-center items-center space-x-3 mb-4">
              {recentNumbers.mainBalls.map((num, index) => (
                <span key={`recent-${index}`} className="bg-blue-500 text-white text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-full shadow-md">
                  {num.toString().padStart(2, '0')}
                </span>
              ))}
              <span className="text-3xl font-bold text-yellow-400">+</span>
              <span className="bg-red-500 text-white text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-full shadow-md">
                {recentNumbers.powerball.toString().padStart(2, '0')}
              </span>
            </div>
          </>
        ) : (
          <p className="text-gray-300">Loading recent results...</p>
        )}
      </div>

      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        {generatedNumbers ? (
          <div className="mb-6">
            <p className="text-2xl mb-4">Your Generated Numbers:</p>
            <div className="flex justify-center items-center space-x-4 mb-6">
              {generatedNumbers.mainBalls.map((num, index) => (
                <span key={index} className="bg-blue-600 text-white text-3xl font-bold w-16 h-16 flex items-center justify-center rounded-full shadow-md">
                  {num.toString().padStart(2, '0')}
                </span>
              ))}
              <span className="text-4xl font-bold text-yellow-400">+</span>
              <span className="bg-red-600 text-white text-3xl font-bold w-16 h-16 flex items-center justify-center rounded-full shadow-md">
                {generatedNumbers.powerball.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <p className="text-xl mb-4">Ready to generate your Powerball numbers!</p>
            <p className="text-lg text-gray-300">Click the button below to create your unique number combination.</p>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="algorithm" className="block text-lg mb-2">Algorithm:</label>
          <select
            id="algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded mb-4"
          >
            <option value="frequency">Frequency Analysis</option>
            <option value="hotCold">Hot/Cold Numbers</option>
            <option value="balanced">Balanced Distribution</option>
            <option value="pattern">Pattern Analysis</option>
            <option value="statistical">Statistical Analysis</option>
            <option value="combined">Combined Approach</option>
          </select>
        </div>

        <button
          onClick={handleGenerateNumbers}
          className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-full text-xl transition duration-300 ease-in-out transform hover:scale-105"
        >
          Generate Winning Numbers
        </button>
      </div>

      <p className="mt-8 text-gray-400 text-sm">
        Disclaimer: This generator uses historical data to suggest numbers and does not guarantee actual lottery wins.
      </p>
    </div>
  );
}

export default App;
