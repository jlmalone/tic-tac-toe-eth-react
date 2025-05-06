import React, { useState } from 'react';
import { connectWallet } from './utils/wallet';

function App() {
  const [accounts, setAccounts] = useState<string[]>([]);

  const handleConnect = async () => {
    try {
      const connectedAccounts = await connectWallet();
      console.log("Connected accounts:", connectedAccounts); // Log to verify
      setAccounts(connectedAccounts);
    } catch (error) {
      console.error("Connection error:", error);
      alert("Failed to connect. Check the console for details.");
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Hello World with Ethers.js</h1>
          {accounts.length > 0 ? (
              <div>
                <p className="text-green-600">Connected accounts:</p>
                <ul>
                  {accounts.map((account, index) => (
                      <li key={index}>{account}</li>
                  ))}
                </ul>
              </div>
          ) : (
              <button
                  onClick={handleConnect}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Connect Wallet
              </button>
          )}
        </div>
      </div>
  );
}

export default App;