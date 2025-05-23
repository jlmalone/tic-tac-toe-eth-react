// src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IBlockchainService, BoardState } from './services/blockchainServiceTypes';
import { getBlockchainService, BlockchainType } from './services/index';
import { emojiForAddress, shortenAddress } from './utils/helpers';
import { EXPECTED_CHAIN_ID as ETH_EXPECTED_CHAIN_ID, ZERO_ADDRESS as ETH_ZERO_ADDRESS } from './contracts/addresses'; // For Ethereum defaults
import { SOLANA_EXPECTED_NETWORK, SOLANA_EMPTY_CELL_FILLER_STRING } from './solanaConfig'; // For Solana defaults
import './App.css';
import StatsModal from './components/StatsModal';
import InstructionsModal from './components/InstructionsModal';

// Solana Wallet Adapter specific
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function App() {
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>('ethereum');
  const solanaWallet = useSolanaWallet(); // Hook for Solana wallet state

  const blockchainService = useMemo<IBlockchainService | null>(() => {
    try {
      if (selectedBlockchain === 'solana') {
        return getBlockchainService(selectedBlockchain, solanaWallet);
      }
      return getBlockchainService(selectedBlockchain);
    } catch (error) {
      console.error(`Failed to initialize ${selectedBlockchain} service:`, error);
      setStatus(`Error: Could not initialize ${selectedBlockchain} service. ${(error as Error).message}`);
      return null;
    }
  }, [selectedBlockchain, solanaWallet]);


  const ZER0_ADDRESS_EQUIVALENT = useMemo(() => {
    return blockchainService?.getZeroAddress() ||
        (selectedBlockchain === 'ethereum' ? ETH_ZERO_ADDRESS : SOLANA_EMPTY_CELL_FILLER_STRING);
  }, [blockchainService, selectedBlockchain]);

  const initialBoard: BoardState = Array(3).fill(null).map(() => Array(3).fill(ZER0_ADDRESS_EQUIVALENT));

  const [account, setAccount] = useState<string | null>(null);
  const [networkIdentifier, setNetworkIdentifier] = useState<string | number | null>(null);
  const [gameAddr, setGameAddr] = useState<string>(''); // Stores current game address input or active game
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [status, setStatus] = useState<string>('Select a blockchain and connect your wallet.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rowInput, setRowInput] = useState<string>('0');
  const [colInput, setColInput] = useState<string>('0');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const [showStats, setShowStats] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  // Effect to update UI based on service availability and connection state
  useEffect(() => {
    if (blockchainService) {
      setAccount(blockchainService.getCurrentAccount());
      setNetworkIdentifier(blockchainService.getNetworkIdentifier());
      const currentZeroAddr = blockchainService.getZeroAddress();
      setBoard(Array(3).fill(null).map(() => Array(3).fill(currentZeroAddr)));
      const currentActiveGame = blockchainService.getGameAddress();
      setGameAddr(currentActiveGame || ''); // Sync gameAddr with service's active game
      setStatus(`Switched to ${selectedBlockchain}. ${blockchainService.getCurrentAccount() ? `Wallet ${shortenAddress(blockchainService.getCurrentAccount()!)} connected.` : 'Connect wallet to start.'}`);
      if (currentActiveGame) {
        handleRefreshBoard(currentActiveGame); // Refresh board if a game was already active in service
      }
    } else {
      setAccount(null);
      setNetworkIdentifier(null);
      setBoard(Array(3).fill(null).map(() => Array(3).fill(ZER0_ADDRESS_EQUIVALENT)));
      setStatus(`Service for ${selectedBlockchain} not ready. Select blockchain and connect wallet.`);
      setGameAddr('');
    }
  }, [selectedBlockchain, blockchainService, ZER0_ADDRESS_EQUIVALENT]);


  // Effect for handling account and network changes from the service
  useEffect(() => {
    if (!blockchainService) return;

    const handleAccountChange = (newAccount: string | null) => {
      setAccount(newAccount);
      setStatus(newAccount ? `Account: ${shortenAddress(newAccount)}` : 'Wallet disconnected.');
      if (!newAccount) {
        // Reset game state if wallet disconnects
        setGameAddr('');
        setBoard(Array(3).fill(null).map(() => Array(3).fill(blockchainService.getZeroAddress())));
        setIsGameOver(false);
        blockchainService.setGameAddress(null);
      }
    };

    const handleNetworkChange = (newNetwork: string | number | null) => {
      setNetworkIdentifier(newNetwork);
      const isEth = selectedBlockchain === 'ethereum';
      const expectedNet = isEth ? ETH_EXPECTED_CHAIN_ID : SOLANA_EXPECTED_NETWORK;

      if (newNetwork !== null && newNetwork.toString() !== expectedNet.toString()) {
        setStatus(`Network changed to: ${newNetwork}. Please switch to ${isEth ? `Sepolia (${ETH_EXPECTED_CHAIN_ID})` : SOLANA_EXPECTED_NETWORK}.`);
        // Optionally, reset account and game state if network is wrong
        // setAccount(null);
        // setGameAddr('');
        // setBoard(initialBoard);
        // setIsGameOver(false);
      } else if (newNetwork !== null && newNetwork.toString() === expectedNet.toString()) {
        setStatus(`Network set to: ${newNetwork}.`);
        // Refresh account info if network is correct
        if (blockchainService.getCurrentAccount()) {
          setAccount(blockchainService.getCurrentAccount());
        }
      }
    };

    blockchainService.onAccountChanged(handleAccountChange);
    blockchainService.onNetworkChanged(handleNetworkChange);

    return () => {
      blockchainService.cleanupListeners();
    };
  }, [blockchainService, selectedBlockchain, initialBoard]);

  const handleRefreshBoard = useCallback(async (addrForRefreshInput?: string | null) => {
    if (!blockchainService) {
      setStatus("Blockchain service not available.");
      setBoard(Array(3).fill(null).map(() => Array(3).fill(ZER0_ADDRESS_EQUIVALENT)));
      return;
    }
    const effectiveGameAddr = addrForRefreshInput !== undefined ? addrForRefreshInput : blockchainService.getGameAddress();

    if (!effectiveGameAddr || !blockchainService.isValidAddress(effectiveGameAddr) || !blockchainService.getCurrentAccount()) {
      const currentZero = blockchainService.getZeroAddress();
      setBoard(Array(3).fill(null).map(() => Array(3).fill(currentZero)));
      if (addrForRefreshInput === null) { // Explicit refresh button click with no game
        setStatus("Cannot refresh: No game joined or wallet disconnected.");
      }
      setIsGameOver(false);
      return;
    }

    const isManualRefresh = addrForRefreshInput === null && !!effectiveGameAddr;
    if (isManualRefresh) setIsLoading(true);
    if (isManualRefresh) setStatus('Refreshing board...');

    try {
      const newBoard = await blockchainService.getBoardState(effectiveGameAddr);
      setBoard(newBoard);
      const ended = await blockchainService.isGameEnded(effectiveGameAddr);
      setIsGameOver(ended);
      if (ended) {
        const winner = await blockchainService.getWinner(effectiveGameAddr);
        const winnerMsg = winner === blockchainService.getZeroAddress() ? 'Draw' : `Winner ${emojiForAddress(winner)}`;
        setStatus(isManualRefresh ? `Board refreshed: Game Over - ${winnerMsg}` : `Game Over - ${winnerMsg}`);
      } else if (isManualRefresh) {
        setStatus('Board refreshed.');
      } else if (!isManualRefresh && addrForRefreshInput){ // Loaded/joined a new game
        setStatus(`Board loaded for game ${shortenAddress(effectiveGameAddr)}.`);
      }
    } catch (err: any) {
      setStatus(`Error refreshing board: ${err.message}`);
      setBoard(Array(3).fill(null).map(() => Array(3).fill(blockchainService.getZeroAddress())));
      setIsGameOver(false);
    } finally {
      if (isManualRefresh) setIsLoading(false);
    }
  }, [blockchainService, ZER0_ADDRESS_EQUIVALENT]);


  const handleJoinGame = useCallback(async (addressToJoin: string) => {
    if (!blockchainService || !account) {
      setStatus('Connect wallet and select blockchain first.');
      return;
    }
    if (!blockchainService.isValidAddress(addressToJoin)) {
      setStatus(`Invalid game address format for ${selectedBlockchain}.`);
      return;
    }
    setIsLoading(true);
    setStatus(`Joining game: ${shortenAddress(addressToJoin)}...`);
    try {
      await blockchainService.joinGame(addressToJoin); // Service sets its internal game address
      setGameAddr(addressToJoin); // Update UI state
      await handleRefreshBoard(addressToJoin); // Refresh board for the newly joined game
    } catch (err: any) {
      setStatus(`Error joining game: ${err.message}`);
      if (blockchainService) {
        await blockchainService.setGameAddress(null); // Clear game in service on error
        setBoard(Array(3).fill(null).map(() => Array(3).fill(blockchainService.getZeroAddress())));
      }
      setGameAddr(''); // Clear UI state
      setIsGameOver(false);
    } finally {
      setIsLoading(false);
    }
  }, [blockchainService, account, selectedBlockchain, handleRefreshBoard]);


  const handleConnect = useCallback(async () => {
    if (!blockchainService) {
      setStatus("Blockchain service not available. Select a blockchain first.");
      return;
    }
    setIsLoading(true);
    setStatus(`Connecting to ${selectedBlockchain} wallet...`);
    try {
      const connectedAccount = await blockchainService.connectWallet();
      // Listeners in useEffect will update account and networkIdentifier state
      setStatus(`Wallet connected: ${shortenAddress(connectedAccount)} on ${blockchainService.getNetworkIdentifier()}`);

      const currentServiceGame = blockchainService.getGameAddress();
      if (gameAddr && blockchainService.isValidAddress(gameAddr) && gameAddr !== currentServiceGame) {
        // If UI has a gameAddr, try to join it if it's different from service's active game
        await handleJoinGame(gameAddr);
      } else if (currentServiceGame) {
        // If service already has an active game, refresh its board
        await handleRefreshBoard(currentServiceGame);
      } else {
        // No game active in UI or service, refresh to empty board state
        await handleRefreshBoard(null);
      }
    } catch (err: any) {
      if (blockchainService) { // Update network even on connect error
        setNetworkIdentifier(blockchainService.getNetworkIdentifier());
      }
      setStatus(`Error connecting wallet: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [blockchainService, selectedBlockchain, gameAddr, handleJoinGame, handleRefreshBoard]);


  const handleCreateGame = useCallback(async () => {
    if (!blockchainService || !account) {
      setStatus('Please connect wallet first.');
      return;
    }
    setIsLoading(true);
    setStatus('Creating game transaction...');
    try {
      const newGameAddr = await blockchainService.createGame();
      setGameAddr(newGameAddr); // Update UI state
      await handleRefreshBoard(newGameAddr); // Refresh for the new game
      setIsGameOver(false);
    } catch (err: any) {
      setStatus(`Error creating game: ${err.message}`);
      await handleRefreshBoard(null); // Reset to empty board on error
    } finally {
      setIsLoading(false);
    }
  }, [blockchainService, account, handleRefreshBoard]);

  const handleMakeMove = useCallback(async () => {
    const currentGameInService = blockchainService?.getGameAddress();
    if (!blockchainService || !account || !currentGameInService || isGameOver) {
      setStatus(isGameOver ? 'Game is over.' : 'Connect wallet and join/create a game first.');
      return;
    }
    const row = parseInt(rowInput, 10);
    const col = parseInt(colInput, 10);
    if (isNaN(row) || isNaN(col) || row < 0 || row > 2 || col < 0 || col > 2) {
      setStatus('Invalid input: Row and Column must be between 0 and 2.');
      return;
    }
    if (board[row][col] !== blockchainService.getZeroAddress()) {
      setStatus(`Cell [${row}, ${col}] is already taken by ${emojiForAddress(board[row][col])}`);
      return;
    }
    setIsLoading(true);
    setStatus(`Submitting move [${row}, ${col}]...`);
    try {
      await blockchainService.makeMove(row, col);
      setStatus('Move submitted, waiting for confirmation...');
      // After making a move, always refresh the board of the current game
      await handleRefreshBoard(currentGameInService);
    } catch (err: any) {
      setStatus(`Error making move: ${err.message}`);
      await handleRefreshBoard(currentGameInService); // Refresh even on error to get latest state
    } finally {
      setIsLoading(false);
    }
  }, [blockchainService, account, isGameOver, board, rowInput, colInput, handleRefreshBoard]);


  const isCorrectNetwork = useMemo(() => {
    if (!blockchainService || networkIdentifier === null) return false; // Not connected or no network info
    if (selectedBlockchain === 'ethereum') {
      return networkIdentifier === ETH_EXPECTED_CHAIN_ID;
    }
    if (selectedBlockchain === 'solana') {
      return networkIdentifier === SOLANA_EXPECTED_NETWORK;
    }
    return false; // Should not happen
  }, [blockchainService, selectedBlockchain, networkIdentifier]);

  return (
      <div className="min-h-screen bg-black text-[#00cc66] font-mono flex items-center justify-center p-4">
        <div className="relative bg-black border border-[#00cc66] p-6 rounded-lg shadow-[0_0_10px_#00cc66] w-full max-w-sm sm:max-w-md">
          <div className="absolute bottom-2 left-2">
            <button onClick={() => setShowStats(true)} title="View Stats">
              {/*<img src="bar_chart.png" alt="Stats" className="w-4 h-4 filter hover:drop-shadow-[0_0_4px_#00cc66] transition" />*/}

              <img
                  src={`${process.env.PUBLIC_URL}/bar_chart.png`}
                  alt="Stats"
                  className="w-4 h-4 filter hover:drop-shadow-[0_0_4px_#00cc66] transition"
              />
            </button>
          </div>
          <div className="absolute bottom-2 right-2">
            <button onClick={() => setShowInstructions(true)} title="How to Play" className="text-[#00cc66]/50 hover:drop-shadow-[0_0_4px_#00cc66] transition text-sm font-mono">?</button>
          </div>

          <h1 className="text-2xl font-bold mb-4 text-center animate-pulse">Tic‑Tac‑Toe</h1>

          <div className="mb-4 flex justify-center space-x-2">
            <button
                onClick={() => setSelectedBlockchain('ethereum')}
                disabled={isLoading}
                className={`px-3 py-1 rounded border ${selectedBlockchain === 'ethereum' ? 'bg-[#00cc66] text-black border-[#00cc66]' : 'border-[#00cc66] text-[#00cc66] hover:bg-[#00cc66]/20'} disabled:opacity-50`}
            >
              Ethereum
            </button>
            <button
                onClick={() => setSelectedBlockchain('solana')}
                disabled={isLoading}
                className={`px-3 py-1 rounded border ${selectedBlockchain === 'solana' ? 'bg-[#00cc66] text-black border-[#00cc66]' : 'border-[#00cc66] text-[#00cc66] hover:bg-[#00cc66]/20'} disabled:opacity-50`}
            >
              Solana
            </button>
          </div>

          <div className="mb-4 p-3 bg-black border border-[#00cc66] rounded">
            {blockchainService && account ? (
                <>
                  <p>Connected: <span className="font-mono text-sm">{shortenAddress(account)}</span></p>
                  <p>Network: <span className="font-mono text-sm">{networkIdentifier !== null ? networkIdentifier.toString() : 'N/A'}
                    {!isCorrectNetwork && networkIdentifier !== null && (<span className="text-red-500 font-bold"> (WRONG NETWORK!)</span>)}
                            </span></p>
                </>
            ) : selectedBlockchain === 'solana' ? (
                // Solana Wallet Multi Button for connection
                <WalletMultiButton style={{
                  backgroundColor: 'black', border: '1px solid #00cc66', color: '#00cc66',
                  width: '100%', justifyContent: 'center', fontSize: '0.875rem',
                  fontFamily: 'Menlo, Courier New, monospace', transition: 'background-color 0.2s, color 0.2s'
                }} />
            ) : (
                // Ethereum connect button
                <button
                    onClick={handleConnect}
                    disabled={isLoading || !blockchainService}
                    className="w-full border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition disabled:opacity-50"
                >
                  {isLoading ? 'Connecting…' : 'Connect Ethereum Wallet'}
                </button>
            )}
            {!blockchainService && <p className="text-red-500 text-xs mt-1 text-center">Service for {selectedBlockchain} not available.</p>}
          </div>

          {blockchainService && account && isCorrectNetwork && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-center gap-2 items-center">
                  <button
                      onClick={handleCreateGame}
                      disabled={isLoading}
                      className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition flex-shrink-0 w-full sm:w-auto disabled:opacity-50"
                  >
                    {isLoading ? 'Creating…' : 'Create Game'}
                  </button>
                  <span className="text-sm my-1 sm:my-0">OR</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-2 items-stretch">
                  <input
                      type="text"
                      value={gameAddr}
                      onChange={(e) => setGameAddr(e.target.value)}
                      placeholder="Enter Game Address"
                      className="border border-[#00cc66] bg-black text-[#00cc66] placeholder-[#00cc66]/50 p-2 rounded font-mono flex-grow disabled:opacity-50"
                      disabled={isLoading}
                  />
                  <button
                      onClick={() => handleJoinGame(gameAddr)}
                      disabled={!gameAddr || isLoading || !blockchainService.isValidAddress(gameAddr)}
                      className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition flex-shrink-0 disabled:opacity-50"
                  >
                    {isLoading ? 'Joining…' : 'Join Game'}
                  </button>
                </div>

                {blockchainService.getGameAddress() && blockchainService.isValidAddress(blockchainService.getGameAddress()!) && (
                    <div className="border-t border-[#00cc66]/50 pt-4 space-y-4">
                      <p className="text-center font-semibold">Game: <span className="font-mono text-sm">{shortenAddress(blockchainService.getGameAddress()!)}</span></p>
                      <div className="grid grid-cols-3 gap-1 mx-auto w-48 h-48 sm:w-60 sm:h-60 border border-[#00cc66] bg-black p-1 rounded">
                        {board.flat().map((cell, idx) => {
                          const r = Math.floor(idx / 3);
                          const c = idx % 3;
                          const isEmpty = cell === blockchainService.getZeroAddress();
                          return (
                              <div
                                  key={idx}
                                  className="flex items-center justify-center bg-black text-[#00cc66] text-3xl sm:text-4xl font-bold border border-[#00cc66]"
                                  title={`Cell [${r},${c}] Owner: ${isEmpty ? 'Empty' : shortenAddress(cell) }`}
                              >
                                {isEmpty ? '-' : emojiForAddress(cell)}
                              </div>
                          );
                        })}
                      </div>

                      {!isGameOver && (
                          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                            <input
                                type="number" min="0" max="2" step="1"
                                value={rowInput} onChange={(e) => setRowInput(e.target.value.replace(/[^0-2]/, ''))}
                                placeholder="Row"
                                className="border border-[#00cc66] bg-black text-[#00cc66] p-2 rounded w-20 text-center disabled:opacity-50"
                                disabled={isLoading}
                            />
                            <input
                                type="number" min="0" max="2" step="1"
                                value={colInput} onChange={(e) => setColInput(e.target.value.replace(/[^0-2]/, ''))}
                                placeholder="Col"
                                className="border border-[#00cc66] bg-black text-[#00cc66] p-2 rounded w-20 text-center disabled:opacity-50"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleMakeMove}
                                disabled={isLoading || isGameOver}
                                className="border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition disabled:opacity-50"
                            >
                              {isLoading ? 'Moving…' : 'Make Move'}
                            </button>
                          </div>
                      )}
                      <button
                          onClick={() => handleRefreshBoard(null)} // Explicitly pass null for manual refresh
                          disabled={isLoading}
                          className="w-full border border-[#00cc66] text-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition disabled:opacity-50"
                      >
                        {isLoading ? 'Refreshing…' : 'Refresh Board'}
                      </button>
                    </div>
                )}
              </div>
          )}
          <p className={`mt-4 text-center text-sm min-h-[20px] ${status.toLowerCase().startsWith('error') ? 'text-red-500' : 'text-[#00cc66]'}`}>
            {status}
          </p>
        </div>
        {showStats && blockchainService && <StatsModal onClose={() => setShowStats(false)} blockchainType={selectedBlockchain} currentAccount={account} networkId={networkIdentifier} />}
        {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} blockchainType={selectedBlockchain} />}
      </div>
  );
}

export default App;