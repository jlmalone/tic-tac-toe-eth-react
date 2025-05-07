// src/components/StatsModal.tsx
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { FACTORY_ABI, GAME_ABI } from '../contracts/abis';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import { getProvider } from '../services/blockchain';
import { emojiForAddress, shortenAddress } from '../utils/helpers';

interface GameRecord {
  address: string;
  winner: string;
}

interface StatsModalProps {
  onClose: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explorerBase, setExplorerBase] = useState<string>('https://etherscan.io');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const provider =
            getProvider() ?? new ethers.BrowserProvider((window as any).ethereum);
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        // pick the correct Etherscan based on chain
        const base =
            chainId === 11155111
                ? 'https://sepolia.etherscan.io'
                : 'https://etherscan.io';
        setExplorerBase(base);

        const factoryAddress = CONTRACT_ADDRESSES[chainId]?.factoryAddress;
        if (!factoryAddress) throw new Error('No factory configured for this network.');

        const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
        const filter = factory.filters.GameCreated();
        const logs = await factory.queryFilter(filter, 0, 'latest');

        const records: GameRecord[] = [];
        for (const log of logs) {
          const parsed = factory.interface.parseLog(log);
          if (!parsed || !parsed.args) continue;
          const gameAddr = parsed.args.gameAddress as string;

          const gameContract = new ethers.Contract(gameAddr, GAME_ABI, provider);
          let winner = '';
          try {
            const ended = await gameContract.gameEnded();
            if (ended) {
              winner = await gameContract.winner();
            }
          } catch {
            winner = '';
          }
          records.push({ address: gameAddr, winner });
        }

        setGames(records);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch game history.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
      <div className="fixed inset-0 bg-black bg-opacity-90 text-[#00cc66] font-mono p-4 z-50 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-black border border-[#00cc66] p-4 rounded-lg shadow-[0_0_10px_#00cc66]">
          <h2 className="text-xl font-bold mb-4 text-center">🕹️ Game History</h2>

          {loading && <p className="text-center">Loading history...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {!loading && !error && (
              <div className="overflow-auto max-h-96">
                <table className="w-full border border-[#00cc66] mb-4">
                  <thead>
                  <tr>
                    <th className="border border-[#00cc66] p-2">#</th>
                    <th className="border border-[#00cc66] p-2">Game Address</th>
                    <th className="border border-[#00cc66] p-2">Winner</th>
                  </tr>
                  </thead>
                  <tbody>
                  {games.map((rec, i) => (
                      <tr key={rec.address}>
                        <td className="border border-[#00cc66] p-2 text-center">{i + 1}</td>
                        <td className="border border-[#00cc66] p-2">
                          <a
                              href={`${explorerBase}/address/${rec.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                          >
                            {shortenAddress(rec.address)}
                          </a>
                        </td>
                        <td className="border border-[#00cc66] p-2">
                          {rec.winner ? (
                              <a
                                  href={`${explorerBase}/address/${rec.winner}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline inline-flex items-center space-x-1"
                              >
                                <span>{emojiForAddress(rec.winner)}</span>
                                <span>{shortenAddress(rec.winner)}</span>
                              </a>
                          ) : (
                              '–'
                          )}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}

          <button
              onClick={onClose}
              className="mt-2 w-full border border-[#00cc66] px-3 py-2 rounded hover:bg-[#00cc66] hover:text-black transition"
          >
            Close
          </button>
        </div>
      </div>
  );
};

export default StatsModal;
