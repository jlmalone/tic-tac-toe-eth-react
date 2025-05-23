// src/components/StatsModal.tsx
import React, {useEffect, useRef, useState} from 'react';
import { ethers } from 'ethers';
import { FACTORY_ABI, GAME_ABI } from '../contracts/abis';
import { CONTRACT_ADDRESSES, EXPECTED_CHAIN_ID, ZERO_ADDRESS as ETH_ZERO_ADDRESS } from '../contracts/addresses';
import { emojiForAddress, shortenAddress } from '../utils/helpers';
import { BlockchainType } from '../services/index'; // Only need BlockchainType now
import { IBlockchainService } from '../services/blockchainServiceTypes'; // Import IBlockchainService
import { SOLANA_NETWORK_NAME, SOLANA_EMPTY_CELL_FILLER_STRING } from '../solanaConfig';
// import SegmentedDialLoader from './S';
import SolanaService from "../services/solanaService";
import SegmentedDialLoader from "./SegmentedDialLoader"; // Still needed for casting if calling specific methods

interface GameRecord {
    address: string;
    winner: string;
    ended?: boolean;
}

interface StatsModalProps {
    onClose: () => void;
    blockchainType: BlockchainType;
    currentAccount: string | null;
    networkId: string | number | null;
    blockchainService: IBlockchainService | null; // Added prop
}

// --- quick toggle at the top of StatsModal.tsx ---
const DEBUG_MIN_LOADER   = true;   // flip to `false` to disable
const MIN_LOADER_MS      = 8000;   // 8 seconds

// ..........................................................



const StatsModal: React.FC<StatsModalProps> = ({
                                                   onClose,
                                                   blockchainType,
                                                   currentAccount,
                                                   networkId,
                                                   blockchainService // Destructure the new prop
                                               }) => {
    const [games, setGames] = useState<GameRecord[]>([]);
    // const [loading, setLoading] = useState(true);

    const [loading, setLoading]         = useState(true);
    const loadStartedAt = useRef<number>(Date.now());

// helper: call **instead** of setLoading(false)
    const finishLoading = () => {
        const elapsed = Date.now() - loadStartedAt.current;
        const wait = DEBUG_MIN_LOADER ? Math.max(0, MIN_LOADER_MS - elapsed) : 0;
        setTimeout(() => setLoading(false), wait);
    };



    const [error, setError] = useState<string | null>(null);
    const [explorerBase, setExplorerBase] = useState<string>(
        blockchainType === 'ethereum' ? 'https://sepolia.etherscan.io' : `https://explorer.solana.com/?cluster=${SOLANA_NETWORK_NAME}`
    );

    useEffect(() => {
        setExplorerBase(
            blockchainType === 'ethereum' ? 'https://sepolia.etherscan.io' : `https://explorer.solana.com/?cluster=${networkId || SOLANA_NETWORK_NAME}`
        );

        async function fetchHistory() {
            if (!blockchainService) { // Check if service is available
                setError("Blockchain service is not available to fetch history.");
                // setLoading(false);
                finishLoading();
                return;
            }

            // whenever you start a fetch
            loadStartedAt.current = Date.now();
            setLoading(true);
            setError(null);
            setGames([]);

            if (blockchainType === 'ethereum') {
                // ... (Ethereum fetching logic remains the same, it uses window.ethereum directly)
                if (!window.ethereum) {
                    setError("MetaMask is not installed. Cannot fetch Ethereum game history.");
                    // setLoading(false);
                    finishLoading();
                    return;
                }
                const chainIdNum = Number(networkId);
                if (chainIdNum !== EXPECTED_CHAIN_ID) {
                    setError(`Connect to Ethereum Sepolia network (ID: ${EXPECTED_CHAIN_ID}) to see game history. Currently on ${chainIdNum || 'unknown'}.`);
                    // setLoading(false);
                    finishLoading();
                    return;
                }
                const provider = new ethers.BrowserProvider(window.ethereum);
                const factoryAddress = CONTRACT_ADDRESSES[chainIdNum]?.factoryAddress;
                if (!factoryAddress) {
                    setError('No factory configured for this Ethereum network.');
                    // setLoading(false);
                    finishLoading();
                    return;
                }
                try {
                    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
                    const filter = factory.filters.GameCreated();
                    const logs = await factory.queryFilter(filter, 0, 'latest');

                    const records: GameRecord[] = [];
                    for (const log of logs) {
                        const parsed = factory.interface.parseLog({ topics: Array.from(log.topics), data: log.data });
                        if (!parsed || !parsed.args) continue;
                        const gameAddr = parsed.args.gameAddress as string;
                        const gameContract = new ethers.Contract(gameAddr, GAME_ABI, provider);
                        let winner = ETH_ZERO_ADDRESS;
                        let ended = false;
                        try {
                            ended = await gameContract.gameEnded();
                            if (ended) winner = await gameContract.winner();
                        } catch (e) { console.warn(`Could not fetch winner/status for ETH game ${gameAddr}: ${(e as Error).message}`); }
                        records.push({ address: gameAddr, winner: winner === ETH_ZERO_ADDRESS ? '' : winner, ended });
                    }
                    setGames(records.reverse());
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch Ethereum game history.');
                }

            } else if (blockchainType === 'solana') {
                const solServiceInstance = blockchainService as SolanaService; // Cast the passed service

                if (solServiceInstance && typeof solServiceInstance.getAllSolanaGamesWithStatus === 'function') {
                    try {
                        const allGamesFromService = await solServiceInstance.getAllSolanaGamesWithStatus();
                        setGames(allGamesFromService);
                        if (allGamesFromService.length === 0) {
                            setError("No Solana games found on-chain for this program.");
                        }
                    } catch (err: any) {
                        setError(err.message || "Failed to fetch Solana game history from the blockchain.");
                    }
                } else {
                    setError("Solana service not properly initialized or history function is missing.");
                }
            }
            // setLoading(false);
            finishLoading();
        }

        if ((blockchainType === 'ethereum' && networkId === EXPECTED_CHAIN_ID && currentAccount) ||
            (blockchainType === 'solana' && networkId === SOLANA_NETWORK_NAME && currentAccount)) {
            (async () => {
                try {
                    await fetchHistory();
                } catch(e) {
                    console.error("Error in fetchHistory IIFE", e);
                    setError((e as Error).message || "An unexpected error occurred fetching history.");
                    // setLoading(false);
                    finishLoading();
                }
            })();
        } else if (!currentAccount) {
            setError(`Connect your ${blockchainType} wallet to view history.`);
            // setLoading(false);
            finishLoading();
        } else if (blockchainType === 'ethereum' && networkId !== EXPECTED_CHAIN_ID) {
            setError(`Connect to Ethereum Sepolia (ID: ${EXPECTED_CHAIN_ID}) for stats. Currently on ${networkId || 'unknown'}.`);
            // setLoading(false);
            finishLoading();
        } else if (blockchainType === 'solana' && networkId !== SOLANA_NETWORK_NAME ) {
            setError(`Connect to Solana ${SOLANA_NETWORK_NAME} for stats. Currently on ${networkId || 'unknown'}.`);
            // setLoading(false);
            finishLoading();
        } else {
            setError("Stats not available for the current selection.");
            // setLoading(false);
            finishLoading();
        }
    }, [blockchainType, currentAccount, networkId, blockchainService]); // Added blockchainService to dependency array

    // ... (getDisplayAddress and return JSX remain the same)
    const getDisplayAddress = (winnerAddress: string, gameEndedInput?: boolean) => {
        const isGameReallyEnded = gameEndedInput === true;

        if (!winnerAddress ||
            (blockchainType === 'ethereum' && winnerAddress === ETH_ZERO_ADDRESS) ||
            (blockchainType === 'solana' && winnerAddress === SOLANA_EMPTY_CELL_FILLER_STRING)) {
            return isGameReallyEnded ? 'Draw' : 'In Progress / No Winner Yet';
        }
        return (
            <a
                href={`${explorerBase}/${blockchainType === 'ethereum' ? 'address' : 'account'}/${winnerAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center space-x-1"
            >
                <span>{emojiForAddress(winnerAddress)}</span>
                <span>{shortenAddress(winnerAddress)}</span>
            </a>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 text-[#00cc66] font-mono p-4 z-50 overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-black border border-[#00cc66] p-4 rounded-lg shadow-[0_0_10px_#00cc66]">
                <h2 className="text-xl font-bold mb-4 text-center">🕹️ Game History ({blockchainType})</h2>

                {loading && <SegmentedDialLoader />}
                {/*{ text={blockchainType === 'solana' ? "SCANNING CHAIN..." : "FETCHING EVENTS..."}}*/}
                {!loading && error && <p className="text-center text-red-500">{error}</p>}

                {!loading && !error && games.length === 0 && (
                    <p className="text-center">
                        {blockchainType === 'ethereum' ? "No games found on Ethereum Sepolia." : "No Solana games found for this program on-chain."}
                    </p>
                )}

                {!loading && !error && games.length > 0 && (
                    <div className="overflow-auto max-h-96">
                        <table className="w-full border border-[#00cc66] mb-4">
                            <thead>
                            <tr>
                                <th className="border border-[#00cc66] p-2">#</th>
                                <th className="border border-[#00cc66] p-2">Game Address</th>
                                <th className="border border-[#00cc66] p-2">Outcome</th>
                            </tr>
                            </thead>
                            <tbody>
                            {games.map((rec, i) => (
                                <tr key={rec.address}>
                                    <td className="border border-[#00cc66] p-2 text-center">{i + 1}</td>
                                    <td className="border border-[#00cc66] p-2">
                                        <a
                                            href={`${explorerBase}/${blockchainType === 'ethereum' ? 'address' : 'account'}/${rec.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline"
                                        >
                                            {shortenAddress(rec.address)}
                                        </a>
                                    </td>
                                    <td className="border border-[#00cc66] p-2">
                                        {getDisplayAddress(rec.winner, rec.ended)}
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