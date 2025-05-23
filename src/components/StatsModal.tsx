// src/components/StatsModal.tsx
import React, {useEffect, useState} from 'react';
import {ethers} from 'ethers';
import {FACTORY_ABI, GAME_ABI} from '../contracts/abis';
import {CONTRACT_ADDRESSES, EXPECTED_CHAIN_ID, ZERO_ADDRESS as ETH_ZERO_ADDRESS} from '../contracts/addresses';
import {emojiForAddress, shortenAddress} from '../utils/helpers';
import {BlockchainType} from '../services';
import {SOLANA_NETWORK_NAME, SOLANA_EMPTY_CELL_FILLER_STRING} from '../solanaConfig';

interface GameRecord {
    address: string;
    winner: string;
}

interface StatsModalProps {
    onClose: () => void;
    blockchainType: BlockchainType;
    currentAccount: string | null;
    networkId: string | number | null;
}

const StatsModal: React.FC<StatsModalProps> = ({onClose, blockchainType, currentAccount, networkId}) => {
    const [games, setGames] = useState<GameRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [explorerBase, setExplorerBase] = useState<string>(
        blockchainType === 'ethereum' ? 'https://sepolia.etherscan.io' : `https://explorer.solana.com/?cluster=${SOLANA_NETWORK_NAME}`
    );

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            setError(null);
            setGames([]);

            if (blockchainType === 'ethereum') {
                if (!window.ethereum) {
                    setError("MetaMask is not installed. Cannot fetch Ethereum game history.");
                    setLoading(false);
                    return;
                }
                const chainIdNum = Number(networkId);

                if (chainIdNum !== EXPECTED_CHAIN_ID) {
                    setError(`Connect to Ethereum Sepolia network (ID: ${EXPECTED_CHAIN_ID}) to see game history. Currently on ${chainIdNum || 'unknown'}.`);
                    setLoading(false);
                    return;
                }

                const provider = new ethers.BrowserProvider(window.ethereum);
                const base = `https://sepolia.etherscan.io`;
                setExplorerBase(base);

                const factoryAddress = CONTRACT_ADDRESSES[chainIdNum]?.factoryAddress;
                if (!factoryAddress) {
                    setError('No factory configured for this Ethereum network.');
                    setLoading(false);
                    return;
                }

                try {
                    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
                    const filter = factory.filters.GameCreated();
                    const logs = await factory.queryFilter(filter, 0, 'latest');
                    const records: GameRecord[] = [];
                    for (const log of logs) {
                        const parsed = factory.interface.parseLog({topics: Array.from(log.topics), data: log.data});
                        if (!parsed || !parsed.args) continue;
                        const gameAddr = parsed.args.gameAddress as string;
                        const gameContract = new ethers.Contract(gameAddr, GAME_ABI, provider);
                        let winner = ETH_ZERO_ADDRESS;
                        try {
                            const ended = await gameContract.gameEnded();
                            if (ended) winner = await gameContract.winner();
                        } catch (e) {
                            console.warn(`Could not fetch winner for game ${gameAddr}: ${(e as Error).message}`);
                        }
                        records.push({address: gameAddr, winner: winner === ETH_ZERO_ADDRESS ? '' : winner});
                    }
                    setGames(records.reverse());
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch Ethereum game history.');
                }

            } else if (blockchainType === 'solana') {
                setExplorerBase(`https://explorer.solana.com/?cluster=${networkId || SOLANA_NETWORK_NAME}`);
                setError("Solana game history (via direct chain scan) is not implemented in this version. Games would need to be tracked locally or via an indexer.");
                setGames([]);
            }
            setLoading(false);
        }

        if ((blockchainType === 'ethereum' && networkId === EXPECTED_CHAIN_ID && currentAccount) ||
            (blockchainType === 'solana' && networkId === SOLANA_NETWORK_NAME && currentAccount)) {

            (async () => {
                try {
                    await fetchHistory();
                } catch (e) {
                    console.error("Error during fetchHistory execution:", e);
                }
            })();

        } else if (blockchainType === 'ethereum' && (!currentAccount || networkId !== EXPECTED_CHAIN_ID)) {
            setError(`Connect to Ethereum Sepolia (ID: ${EXPECTED_CHAIN_ID}) for stats. Currently on ${networkId || 'unknown'}.`);
            setLoading(false);
        } else if (blockchainType === 'solana' && (!currentAccount || networkId !== SOLANA_NETWORK_NAME)) {
            setError(`Connect your Solana wallet to ${SOLANA_NETWORK_NAME} to view history (if available).`);
            setLoading(false);
        } else {
            setError("Stats not available for the current selection.");
            setLoading(false);
        }
    }, [blockchainType, currentAccount, networkId]);

    const getDisplayAddress = (addr: string) => {
        if (!addr ||
            (blockchainType === 'ethereum' && addr === ETH_ZERO_ADDRESS) ||
            (blockchainType === 'solana' && addr === SOLANA_EMPTY_CELL_FILLER_STRING)) {
            return 'Draw / No Winner Yet';
        }
        return (
            <a
                href={`${explorerBase}/${blockchainType === 'ethereum' ? 'address' : 'account'}/${addr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center space-x-1"
            >
                <span>{emojiForAddress(addr)}</span>
                <span>{shortenAddress(addr)}</span>
            </a>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 text-[#00cc66] font-mono p-4 z-50 overflow-y-auto">
            <div
                className="max-w-2xl mx-auto bg-black border border-[#00cc66] p-4 rounded-lg shadow-[0_0_10px_#00cc66]">
                <h2 className="text-xl font-bold mb-4 text-center">🕹️ Game History ({blockchainType})</h2>

                {loading && <p className="text-center">Loading history...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}

                {!loading && !error && games.length === 0 && (
                    <p className="text-center">
                        {blockchainType === 'ethereum' ? "No games found on Ethereum Sepolia." : "Solana game history not available in this version."}
                    </p>
                )}

                {!loading && !error && games.length > 0 && (
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
                                // The key should be on the top-level element returned by map, which is <tr>
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
                                        {getDisplayAddress(rec.winner)}
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