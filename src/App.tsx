// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import * as blockchain from './services/blockchain';
import { emojiForAddress, shortenAddress } from './utils/helpers';
import { ZERO_ADDRESS, EXPECTED_CHAIN_ID } from './contracts/addresses';
import './App.css';
import StatsModal from './components/StatsModal';
import InstructionsModal from './components/InstructionsModal';

// Define Board type
type Board = string[][];
const initialBoard: Board = Array(3)
    .fill(null)
    .map(() => Array(3).fill(ZERO_ADDRESS));

function App() {
  // --- State ---
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [gameAddr, setGameAddr] = useState<string>('');
  const [board, setBoard] = useState<Board>(initialBoard);
  const [status, setStatus] = useState<string>('Connect your wallet to start.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rowInput, setRowInput] = useState<string>('0');
  const [colInput, setColInput] = useState<string>('0');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Toggles for modals
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  // --- Handlers ---
  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    setStatus('Connecting wallet...');
    try {
      const connectedAccount = await blockchain.connectWallet();
      setAccount(connectedAccount);
      setChainId(blockchain.getCurrentChainId());
      setStatus(
          `Wallet connected: ${shortenAddress(connectedAccount)} on chain ${blockchain.getCurrentChainId()}`
      );
      if (gameAddr) {
        handleJoinGame(gameAddr);
      }
    } catch (err: any) {
      setAccount(null);
      setChainId(null);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [gameAddr]);

  const handleCreateGame = async () => {
    if (!account) {
      setStatus('Please connect wallet first.');
      return;
    }
    setIsLoading(true);
    setStatus('Creating game transaction...');
    try {
      const newGameAddr = await blockchain.createGame();
      setGameAddr(newGameAddr);
      setStatus(`Game created! Address: ${shortenAddress(newGameAddr)}. Joining...`);
      await handleRefreshBoard(newGameAddr);
      setIsGameOver(false);
    } catch (err: any) {
      setStatus(`Error creating game: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = useCallback(
      async (addressToJoin: string) => {
        if (!account) {
          setStatus('Please connect wallet first.');
          return;
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(addressToJoin)) {
          setStatus('Invalid game address format.');
          return;
        }
        setIsLoading(true);
        setStatus(`Joining game: ${shortenAddress(addressToJoin)}...`);
        try {
          await blockchain.setGameAddress(addressToJoin);
          setGameAddr(addressToJoin);
          await handleRefreshBoard(addressToJoin);
          const ended = await blockchain.isGameEnded();
          setIsGameOver(ended);
          if (ended) {
            const winner = await blockchain.getWinner();
            setStatus(
                winner === ZERO_ADDRESS
                    ? 'Joined ended game: Draw'
                    : `Joined ended game: Winner ${emojiForAddress(winner)} (${shortenAddress(winner)})`
            );
          } else {
            setStatus(`Joined game: ${shortenAddress(addressToJoin)}. Fetching board...`);
          }
        } catch (err: any) {
          setStatus(`Error joining game: ${err.message}`);
          await blockchain.setGameAddress(null);
          setGameAddr('');
          setBoard(initialBoard);
        } finally {
          setIsLoading(false);
        }
      },
      [account]
  );

  const handleMakeMove = async () => {
    if (!account || !gameAddr || isGameOver) {
      setStatus(isGameOver ? 'Game is over.' : 'Connect wallet and join a game first.');
      return;
    }
    const row = parseInt(rowInput, 10);
    const col = parseInt(colInput, 10);
    if ([row, col].some((n) => isNaN(n) || n < 0 || n > 2)) {
      setStatus('Invalid input: Row and Column must be between 0 and 2.');
      return;
    }
    if (board[row][col] !== ZERO_ADDRESS) {
      setStatus(`Cell [${row}, ${col}] is already taken by ${emojiForAddress(board[row][col])}`);
      return;
    }

    setIsLoading(true);
    setStatus(`Submitting move [${row}, ${col}]...`);
    try {
      await blockchain.makeMove(row, col);
      setStatus('Move submitted, waiting for confirmation...');
      await handleRefreshBoard(gameAddr);
      const ended = await blockchain.isGameEnded();
      setIsGameOver(ended);
      if (ended) {
        const winner = await blockchain.getWinner();
        setStatus(
            winner === ZERO_ADDRESS
                ? "Game Over: It's a Draw!"
                : `Game Over: Winner is ${emojiForAddress(winner)} (${shortenAddress(winner)})!`
        );
      } else {
        setStatus('Move successful! Waiting for opponent.');
      }
    } catch (err: any) {
      setStatus(`Error making move: ${err.message}`);
      await handleRefreshBoard(gameAddr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshBoard = useCallback(
      async (addr: string | null) => {
        const addressToRefresh = addr ?? gameAddr;
        if (!addressToRefresh || !blockchain.getCurrentAccount()) {
          setBoard(initialBoard);
          return;
        }
        if (!addr) {
          setIsLoading(true);
          setStatus('Refreshing board...');
        }
        await blockchain.setGameAddress(addressToRefresh);
        try {
          const newBoard = await blockchain.getBoardState();
          setBoard(newBoard);
          const ended = await blockchain.isGameEnded();
          setIsGameOver(ended);
          if (ended) {
            const winner = await blockchain.getWinner();
            setStatus(
                winner === ZERO_ADDRESS
                    ? 'Board refreshed: Game Over - Draw'
                    : `Board refreshed: Game Over - Winner ${emojiForAddress(winner)}`
            );
          } else if (!addr) {
            setStatus('Board refreshed.');
          }
        } catch (err: any) {
          setStatus(`Error refreshing board: ${err.message}`);
          setBoard(initialBoard);
        } finally {
          if (!addr) setIsLoading(false);
        }
      },
      [gameAddr]
  );

  // --- JSX ---
  return (
      <div className="min-h-screen bg-black text-[#00cc66] font-mono flex items-center justify-center p-4">
        <div className="relative bg-black border border-[#00cc66] p-6 rounded-lg shadow-[0_0_10px_#00cc66] w-full max-w-sm sm:max-w-md">
          {/* Stats icon */}
          <div className="absolute bottom-2 left-2">
            <button onClick={() => setShowStats(true)} title="View Stats">
              <img
                  src="bar_chart.png"
                  alt="Stats"
                  className="w-4 h-4 filter hover:drop-shadow-[0_0_4px_#00cc66] transition"
              />
            </button>
          </div>

          {/* Instructions icon */}
          <div className="absolute bottom-2 right-2">
            <button
                onClick={() => setShowInstructions(true)}
                title="How to Play"
                className="text-[#00cc66]/50 hover:drop-shadow-[0_0_4px_#00cc66] transition  text-sm font-mono"
            >
              ?
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-4 text-center animate-pulse">Tic‑Tac‑Toe</h1>

          {/* Connection Info */}
          <div className="mb-4 p-3 bg-black border border-[#00cc66] rounded">
            {account ? (
                <>
                  <p>
                    Connected: <span className="font-mono text-sm">{shortenAddress(account)}</span>
                  </p>
                  <p>
                    Chain ID:{' '}
                    <span className="font-mono text-sm">
                  {chainId}
                      {chainId !== EXPECTED_CHAIN_ID && (
                          <span className="text-red-500 font-bold"> (WRONG NETWORK!)</span>
                      )}
                </span>
                  </p>
                </>
            ) : (
                <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition"
                >
                  {isLoading ? 'Connecting…' : 'Connect Wallet'}
                </button>
            )}
          </div>

          {/* Game Controls */}
          {account && chainId === EXPECTED_CHAIN_ID && (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                      onClick={handleCreateGame}
                      disabled={isLoading}
                      className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition flex-shrink-0"
                  >
                    {isLoading ? 'Creating…' : 'Create Game'}
                  </button>
                  <input
                      type="text"
                      value={gameAddr}
                      onChange={(e) => setGameAddr(e.target.value)}
                      placeholder="Or Enter Game Address"
                      className="border border-[#00cc66] bg-black text-[#00cc66] placeholder-[#00cc66]/50 p-2 rounded font-mono"
                      disabled={isLoading}
                  />
                  <button
                      onClick={() => handleJoinGame(gameAddr)}
                      disabled={!gameAddr || isLoading || !/^0x[a-fA-F0-9]{40}$/.test(gameAddr)}
                      className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition flex-shrink-0"
                  >
                    {isLoading ? 'Joining…' : 'Join Game'}
                  </button>
                </div>

                {gameAddr && (
                    <div className="border-t border-[#00cc66]/50 pt-4 space-y-4">
                      <p className="text-center font-semibold">
                        Game:{' '}
                        <span className="font-mono text-sm">{shortenAddress(gameAddr)}</span>
                      </p>

                      {/* Board */}
                      <div className="grid grid-cols-3 gap-1 mx-auto w-48 h-48 border border-[#00cc66] bg-black p-1 rounded">
                        {board.flat().map((cell, idx) => {
                          const r = Math.floor(idx / 3);
                          const c = idx % 3;
                          return (
                              <div
                                  key={`cell-${r}-${c}`}
                                  className="flex items-center justify-center bg-black text-[#00cc66] text-3xl font-bold border border-[#00cc66]"
                                  title={`Cell [${r},${c}] Owner: ${cell}`}
                              >
                                {emojiForAddress(cell)}
                              </div>
                          );
                        })}
                      </div>

                      {/* Move inputs */}
                      {!isGameOver && (
                          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                            <input
                                type="number"
                                min="0"
                                max="2"
                                step="1"
                                value={rowInput}
                                onChange={(e) => setRowInput(e.target.value.replace(/[^0-2]/, ''))}
                                placeholder="Row (0-2)"
                                className="border border-[#00cc66] bg-black text-[#00cc66] p-2 rounded w-20 text-center"
                                disabled={isLoading}
                            />
                            <input
                                type="number"
                                min="0"
                                max="2"
                                step="1"
                                value={colInput}
                                onChange={(e) => setColInput(e.target.value.replace(/[^0-2]/, ''))}
                                placeholder="Col (0-2)"
                                className="border border-[#00cc66] bg-black text-[#00cc66] p-2 rounded w-20 text-center"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleMakeMove}
                                disabled={isLoading || isGameOver}
                                className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition"
                            >
                              {isLoading ? 'Moving…' : 'Make Move'}
                            </button>
                          </div>
                      )}

                      <button
                          onClick={() => handleRefreshBoard(null)}
                          disabled={isLoading}
                          className="w-full border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition"
                      >
                        {isLoading ? 'Refreshing…' : 'Refresh Board Manually'}
                      </button>
                    </div>
                )}
              </div>
          )}

          {/* Status */}
          <p
              className={`mt-4 text-center text-sm ${
                  status.startsWith('Error') ? 'text-red-500' : 'text-[#00cc66]'
              }`}
          >
            {status}
          </p>
        </div>

        {/* Modals */}
        {showStats && <StatsModal onClose={() => setShowStats(false)} />}
        {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
      </div>
  );
}

export default App;
