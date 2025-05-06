// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import * as blockchain from './services/blockchain';
import { emojiForAddress, shortenAddress } from './utils/helpers';
import { ZERO_ADDRESS, EXPECTED_CHAIN_ID } from './contracts/addresses';
import './App.css'; // Keep or remove if not needed

// Define Board type
type Board = string[][];
const initialBoard: Board = Array(3).fill(null).map(() => Array(3).fill(ZERO_ADDRESS));

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [gameAddr, setGameAddr] = useState<string>('');
  const [board, setBoard] = useState<Board>(initialBoard);
  const [status, setStatus] = useState<string>('Connect your wallet to start.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rowInput, setRowInput] = useState<string>('0');
  const [colInput, setColInput] = useState<string>('0');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // --- Wallet Connection ---
  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    setStatus('Connecting wallet...');
    try {
      const connectedAccount = await blockchain.connectWallet();
      setAccount(connectedAccount);
      setChainId(blockchain.getCurrentChainId());
      setStatus(`Wallet connected: ${shortenAddress(connectedAccount)} on chain ${blockchain.getCurrentChainId()}`);
      // If a game address was previously entered, try joining it
      if (gameAddr) {
        handleJoinGame(gameAddr); // Use existing state
      }
    } catch (error: any) {
      setAccount(null);
      setChainId(null);
      setStatus(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [gameAddr]); // Re-run if gameAddr changes before connection

  // --- Game Management ---
  const handleCreateGame = async () => {
    if (!account) {
      setStatus('Please connect wallet first.');
      return;
    }
    setIsLoading(true);
    setStatus('Creating game transaction...');
    try {
      const newGameAddr = await blockchain.createGame();
      setGameAddr(newGameAddr); // Update state
      setStatus(`Game created! Address: ${shortenAddress(newGameAddr)}. Joining...`);
      // blockchain.setGameAddress is called within createGame now
      await handleRefreshBoard(newGameAddr); // Refresh board for the new game
      setIsGameOver(false); // Reset game over state for new game
    } catch (error: any) {
      setStatus(`Error creating game: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = useCallback(async (addressToJoin: string) => {
    if (!account) {
      setStatus('Please connect wallet first.');
      return;
    }
    if (!addressToJoin || !/^0x[a-fA-F0-9]{40}$/.test(addressToJoin)) {
      setStatus('Invalid game address format.');
      return;
    }
    setIsLoading(true);
    setStatus(`Joining game: ${shortenAddress(addressToJoin)}...`);
    try {
      blockchain.setGameAddress(addressToJoin); // Set in the service
      setGameAddr(addressToJoin); // Update local state
      // Fetch initial state after joining
      await handleRefreshBoard(addressToJoin);
      const ended = await blockchain.isGameEnded();
      setIsGameOver(ended);
      if (ended) {
        const winner = await blockchain.getWinner();
        setStatus(winner === ZERO_ADDRESS
            ? `Joined ended game: Draw`
            : `Joined ended game: Winner ${emojiForAddress(winner)} (${shortenAddress(winner)})`);
      } else {
        setStatus(`Joined game: ${shortenAddress(addressToJoin)}. Fetching board...`);
      }
    } catch (error: any) {
      setStatus(`Error joining game: ${error.message}`);
      blockchain.setGameAddress(null); // Clear service state on error
      setGameAddr(''); // Clear local state on error
      setBoard(initialBoard); // Reset board
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [account]); // Dependency on account to ensure wallet is connected

  // --- Gameplay ---
  const handleMakeMove = async () => {
    if (!account || !gameAddr || isGameOver) {
      setStatus(isGameOver ? 'Game is over.' : 'Connect wallet and join a game first.');
      return;
    }
    const row = parseInt(rowInput, 10);
    const col = parseInt(colInput, 10);

    if (isNaN(row) || isNaN(col) || row < 0 || row > 2 || col < 0 || col > 2) {
      setStatus('Invalid input: Row and Column must be between 0 and 2.');
      return;
    }
    // Basic check: prevent move if cell is already taken
    if (board[row][col] !== ZERO_ADDRESS) {
      setStatus(`Cell [${row}, ${col}] is already taken by ${emojiForAddress(board[row][col])}`);
      return;
    }

    setIsLoading(true);
    setStatus(`Submitting move [${row}, ${col}]...`);
    try {
      await blockchain.makeMove(row, col);
      setStatus('Move submitted, waiting for confirmation...');
      // Refresh board and check game status after move
      await handleRefreshBoard(gameAddr); // Pass gameAddr to ensure correct context
      const ended = await blockchain.isGameEnded();
      setIsGameOver(ended);
      if (ended) {
        const winner = await blockchain.getWinner();
        setStatus(winner === ZERO_ADDRESS
            ? 'Game Over: It\'s a Draw!'
            : `Game Over: Winner is ${emojiForAddress(winner)} (${shortenAddress(winner)})!`);
      } else {
        // Optional: Get last player to indicate whose turn it might be
        // const lastPlayer = await blockchain.getLastPlayer();
        // setStatus(`Move successful! Last player: ${emojiForAddress(lastPlayer)}`);
        setStatus(`Move successful! Waiting for opponent.`);
      }

    } catch (error: any) {
      setStatus(`Error making move: ${error.message}`);
      console.error(error);
      // Optionally refresh board even on error to get latest state
      await handleRefreshBoard(gameAddr);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Board Refresh ---
  const handleRefreshBoard = useCallback(async (addr: string | null) => {
    const addressToRefresh = addr ?? gameAddr; // Use provided addr or current state
    if (!addressToRefresh || !blockchain.getCurrentAccount()) {
      // Don't try to refresh if not connected or no game joined
      setBoard(initialBoard); // Reset board if no game address
      // setStatus("Connect wallet and join a game to see the board.");
      return;
    }
    // Only set loading if triggered manually, not on join/create
    if (!addr) setIsLoading(true);
    // Always set status if triggered manually
    if (!addr) setStatus('Refreshing board...');

    // Ensure the correct game address is set in the blockchain service
    // This is important if handleRefreshBoard is called before gameAddr state updates
    blockchain.setGameAddress(addressToRefresh);

    try {
      const newBoard = await blockchain.getBoardState();
      setBoard(newBoard);
      // Check game status after refresh as well
      const ended = await blockchain.isGameEnded();
      setIsGameOver(ended);
      if (ended) {
        const winner = await blockchain.getWinner();
        // Set status only if manually refreshed or game just ended
        if (!addr || status === 'Move successful! Waiting for opponent.') { // Check previous status
          setStatus(winner === ZERO_ADDRESS
              ? `Board refreshed: Game Over - Draw`
              : `Board refreshed: Game Over - Winner ${emojiForAddress(winner)}`);
        }
      } else {
        // Set status only if manually refreshed
        if (!addr) setStatus('Board refreshed.');
      }

    } catch (error: any) {
      setStatus(`Error refreshing board: ${error.message}`);
      setBoard(initialBoard); // Reset board on error
      console.error(error);
    } finally {
      if (!addr) setIsLoading(false);
    }
  }, [gameAddr, status]); // Include status to potentially update it based on game end

  // Effect to refresh board periodically? (Optional - can be heavy on RPC)
  /*
  useEffect(() => {
      if (account && gameAddr && !isLoading && !isGameOver) {
          const intervalId = setInterval(() => {
              console.log("Polling for board state...");
              handleRefreshBoard(gameAddr);
          }, 10000); // Refresh every 10 seconds

          return () => clearInterval(intervalId); // Cleanup on unmount or state change
      }
  }, [account, gameAddr, isLoading, isGameOver, handleRefreshBoard]);
  */

  // --- Render ---
  return (
      // <div className="min-h-screen bg-matrix-black text-matrix-green flex items-center justify-center p-4">

      /*<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">*/
        <div className="min-h-screen bg-black text-[#00cc66] font-mono flex items-center justify-center p-4">
          <div className="bg-black border border-[#00cc66] p-6 rounded-lg shadow-[0_0_10px_#00cc66] w-full max-w-sm sm:max-w-md w-full">


            <h1 className="text-2xl font-bold mb-4 text-center text-[#00cc66] animate-pulse">Tic-Tac-Toe</h1>

          {/* Connection Info */}
          {/*<div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">*/}
            <div className="mb-4 p-3 bg-black border border-[#00cc66] rounded">

            {account ? (
                <div>
                  <p>Connected: <span className="font-mono text-sm">{shortenAddress(account)}</span></p>
                  <p>Chain ID: <span className="font-mono text-sm">{chainId ?? 'N/A'} {chainId !== EXPECTED_CHAIN_ID && chainId !== null && <span className='text-red-500 font-bold'>(WRONG NETWORK!)</span>}</span></p>

                </div>
            ) : (
                <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition-all"

                    // className="bg-matrix-green text-black px-4 py-2 rounded hover:bg-green-400 disabled:bg-gray-400"

                    // className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
            )}
          </div>

          {/* Game Controls */}
          {account && chainId === EXPECTED_CHAIN_ID && (
              <div className="space-y-4">
                {/* Create / Join */}
                <div className="flex flex-wrap justify-center gap-2">

                {/*<div className="flex flex-col sm:flex-row gap-2">*/}
                  <button
                      onClick={handleCreateGame}
                      disabled={isLoading}
                      className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition-all flex-shrink-0"

                      // className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isLoading ? 'Creating...' : 'Create Game'}
                  </button>
                  <input
                      type="text"
                      value={gameAddr}
                      // placeholder=[#00ff00]
                      onChange={(e) => setGameAddr(e.target.value)}
                      placeholder="Or Enter Game Address to Join"
                      // className="border border-matrix-green bg-black text-matrix-green p-2 rounded"
                      className="border border-matrix-green bg-black text-matrix-green placeholder-[#00ff00] p-2 rounded"

                      // className="border p-2 rounded flex-grow font-mono text-sm"
                      disabled={isLoading}
                  />
                  <button
                      onClick={() => handleJoinGame(gameAddr)} // Pass current input value
                      disabled={!gameAddr || isLoading || !/^0x[a-fA-F0-9]{40}$/.test(gameAddr)}

                      // className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                      className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition-all flex-shrink-0"

                  >
                    {isLoading ? 'Joining...' : 'Join Game'}
                  </button>
                </div>

                {/* Gameplay Area (only if game joined) */}
                {gameAddr && (
                    <div className="border-t pt-4 space-y-4 border-matrix-green/50">


                      <p className="text-center font-semibold">Game: <span className="font-mono text-sm">{shortenAddress(gameAddr)}</span></p>

                      {/* Board Display */}
                      <div className="grid grid-cols-3 gap-1 mx-auto w-48 h-48 border border-[#00cc66] bg-black p-1 rounded">

                      {/*<div className="grid grid-cols-3 gap-1 mx-auto w-48 h-48 border bg-gray-200 p-1 rounded">*/}
                        {board.flat().map((cell, index) => {
                          const r = Math.floor(index / 3);
                          const c = index % 3;
                          return (
                              <div
                                  key={`cell-${r}-${c}-${index}`} // <--- FIX: Use a unique expression
                                  className="w-full h-full flex items-center justify-center bg-black text-matrix-green text-3xl font-bold border border-matrix-green"

                                  // className="w-full h-full flex items-center justify-center bg-white text-3xl font-bold border border-gray-300 rounded-sm"
                                  title={`Cell [${r}, ${c}] Owner: ${cell}`}
                              >
                                {emojiForAddress(cell)}
                              </div>
                          );
                        })}
                      </div>


                      {/* Move Input */}
                      {!isGameOver && (
                          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                            <input
                                type="number"
                                min="0" max="2" step="1"
                                value={rowInput}
                                onChange={(e) => setRowInput(e.target.value.replace(/[^0-2]/, ''))} // Allow only 0, 1, 2
                                placeholder="Row (0-2)"
                                // className="border p-2 rounded w-20 text-center"
                                className="border border-[#00cc66] bg-black text-[#00cc66] p-2 rounded w-20 text-center"

                                disabled={isLoading}
                            />
                            <input
                                type="number"
                                min="0" max="2" step="1"
                                value={colInput}
                                onChange={(e) => setColInput(e.target.value.replace(/[^0-2]/, ''))} // Allow only 0, 1, 2
                                placeholder="Col (0-2)"
                                // className="border p-2 rounded w-20 text-center"
                                // className="border border-matrix-green bg-black text-matrix-green placeholder-[#00ff00] p-2 rounded"

                                className="border border-[#00cc66] bg-black text-[#00cc66] p-2 rounded w-20 text-center"

                                disabled={isLoading}
                            />
                            <button
                                onClick={handleMakeMove}
                                disabled={isLoading || isGameOver}
                                // className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition-all"

                            >
                              {isLoading ? 'Moving...' : 'Make Move'}
                            </button>
                          </div>
                      )}

                      {/* Refresh Button */}
                      <button
                          onClick={() => handleRefreshBoard(null)} // Pass null to indicate manual refresh
                          disabled={isLoading}
                          className="w-full border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition-all"

                          // className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Refreshing...' : 'Refresh Board Manually'}
                      </button>
                    </div>
                )}
              </div>
          )}

          {/* Status Message */}
            <p className={`mt-4 text-center text-sm ${status.startsWith('Error') ? 'text-red-500' : 'text-[#00cc66]'}`}>

            {/*<p className={`mt-4 text-center text-sm ${status.startsWith('Error') ? 'text-red-600' : 'text-gray-700'}`}>*/}
            {status}
          </p>
        </div>
      </div>
  );
}

export default App;