// src/services/blockchain.ts
import {
    ethers,
    BrowserProvider,
    Contract,
    Signer,
    TransactionResponse,
    TransactionReceipt,
    Log,
    Overrides, // Use Overrides for both read and write operations
    InterfaceAbi,
    AddressLike,
    BigNumberish,
    BaseContract,
    resolveAddress
} from 'ethers';
import { FACTORY_ABI, GAME_ABI } from '../contracts/abis';
import { CONTRACT_ADDRESSES, EXPECTED_CHAIN_ID, ZERO_ADDRESS } from '../contracts/addresses';

// Type definition for the GameCreated event structure
interface GameCreatedEventArgs {
    gameAddress: string;
    player1: string;
    player2: string;
}
interface GameCreatedEventLog extends Log { // Not strictly used if directly parsing, but good for context
    args: GameCreatedEventArgs;
}

// Define an interface for your Game Contract for better type safety
interface GameContract extends BaseContract {
    makeMove(row: BigNumberish, col: BigNumberish, overrides?: Overrides): Promise<TransactionResponse>;
    getBoardState(overrides?: Overrides): Promise<AddressLike[][]>;
    gameEnded(overrides?: Overrides): Promise<boolean>;
    winner(overrides?: Overrides): Promise<string>;
    lastPlayer(overrides?: Overrides): Promise<string>;
    connect(signerOrProvider: Signer | BrowserProvider | null): GameContract;
    getAddress(): Promise<string>;
    interface: ethers.Interface;
}


let provider: BrowserProvider | null = null;
let signer: Signer | null = null;
let factoryContract: Contract | null = null;
let gameContract: GameContract | null = null;
let currentAccount: string | null = null;
let currentChainId: number | null = null;

export async function connectWallet(): Promise<string> {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install it to use this app.');
    }
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        currentAccount = await signer.getAddress();
        const network = await provider.getNetwork();
        currentChainId = Number(network.chainId);

        console.log("Connected Account:", currentAccount);
        console.log("Connected Chain ID:", currentChainId);

        if (currentChainId !== EXPECTED_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ethers.toBeHex(EXPECTED_CHAIN_ID) }],
                });
                provider = new ethers.BrowserProvider(window.ethereum);
                signer = await provider.getSigner();
                currentAccount = await signer.getAddress();
                const newNetwork = await provider.getNetwork();
                currentChainId = Number(newNetwork.chainId);
                console.log("Switched to Chain ID:", currentChainId);
                if (currentChainId !== EXPECTED_CHAIN_ID) {
                    throw new Error(`Switch to network ${EXPECTED_CHAIN_ID} failed or was rejected.`);
                }
            } catch (switchError: any) {
                console.error("Failed to switch network:", switchError);
                if (switchError.code === 4902) {
                    throw new Error(`Network ${EXPECTED_CHAIN_ID} not found in MetaMask. Please add it manually.`);
                }
                throw new Error(`Please switch your wallet to the correct network (Chain ID: ${EXPECTED_CHAIN_ID}). Original error: ${switchError.message}`);
            }
        }
        const factoryAddress = CONTRACT_ADDRESSES[currentChainId]?.factoryAddress;
        if (!factoryAddress) {
            throw new Error(`Unsupported network (Chain ID: ${currentChainId}). No factory address configured.`);
        }
        factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI as InterfaceAbi, signer);
        console.log("Factory Contract Initialized:", await factoryContract.getAddress());
        return currentAccount;
    } catch (error: any) {
        console.error("Wallet connection failed:", error);
        currentAccount = null;
        currentChainId = null;
        signer = null;
        provider = null;
        throw new Error(`Wallet connection failed: ${error.message || 'Unknown error'}`);
    }
}


export async function createGame(): Promise<string> {
    if (!signer) throw new Error('Wallet not connected or signer not available.');
    if (!factoryContract) throw new Error('Factory contract not initialized.');
    if (!factoryContract.interface) throw new Error('Factory contract interface not available for event parsing.');

    console.log("Attempting to create game...");
    try {
        const tx: TransactionResponse = await (factoryContract as any).createGame();
        console.log("Create game transaction sent:", tx.hash);
        const receipt: TransactionReceipt | null = await tx.wait();
        console.log("Transaction receipt:", receipt);

        if (!receipt) throw new Error("Transaction failed: No receipt received.");
        if (receipt.status !== 1) {
            console.error("Transaction reverted:", receipt);
            throw new Error("Game creation transaction failed (reverted). Check console.");
        }

        const gameCreatedEventName = 'GameCreated';
        const gameCreatedEventFragment = factoryContract.interface.getEvent(gameCreatedEventName);
        if (!gameCreatedEventFragment) {
            throw new Error(`Event "${gameCreatedEventName}" not found in factory contract ABI.`);
        }
        const gameCreatedTopic = gameCreatedEventFragment.topicHash;

        // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
        // THE FIX IS HERE:
        const factoryAddressLower = (await factoryContract.getAddress()).toLowerCase(); // Get address beforehand

        const gameCreatedLog = receipt.logs.find(
            log => log.address.toLowerCase() === factoryAddressLower &&
                log.topics[0] === gameCreatedTopic
        );
        // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        if (!gameCreatedLog) {
            console.error("GameCreated event not found in transaction logs from factory.", {
                logs: receipt.logs,
                expectedTopic: gameCreatedTopic,
                factoryAddress: factoryAddressLower
            });
            throw new Error("Could not find GameCreated event in the transaction logs from factory.");
        }

        const parsedLog = factoryContract.interface.parseLog({ topics: Array.from(gameCreatedLog.topics), data: gameCreatedLog.data });
        if (!parsedLog) throw new Error("Failed to parse GameCreated event log.");

        const eventArgs = parsedLog.args as unknown as GameCreatedEventArgs;
        const newGameAddress = eventArgs?.gameAddress;

        if (!newGameAddress || !ethers.isAddress(newGameAddress)) {
            console.error("Extracted game address is invalid:", newGameAddress, "Parsed Log Args:", eventArgs);
            throw new Error("Failed to extract a valid game address from the event.");
        }

        console.log(`Game created! Address: ${newGameAddress}, Player1: ${eventArgs.player1}, Player2: ${eventArgs.player2}`);
        await setGameAddress(newGameAddress);
        return newGameAddress;
    } catch (error: any) {
        console.error("Failed to create game:", error);
        const reason = (error.data?.message || error.reason || error.message || "Unknown error");
        throw new Error(`Failed to create game: ${reason}`);
    }
}

export async function setGameAddress(address: string | null): Promise<void> {
    const activeProvider = provider;
    if (!activeProvider) {
        console.warn("Provider not available for setting game address. Wallet might be disconnected.");
        gameContract = null;
        return;
    }
    if (address && ethers.isAddress(address)) {
        const contractSignerOrProvider = signer ?? activeProvider;
        gameContract = new ethers.Contract(
            address,
            GAME_ABI as InterfaceAbi,
            contractSignerOrProvider
        ) as unknown as GameContract;
        console.log("Game contract initialized for address:", await gameContract.getAddress());
    } else {
        gameContract = null;
        console.log("Game address cleared.");
    }
}

export async function makeMove(row: number, col: number): Promise<TransactionReceipt> {
    if (!gameContract) throw new Error('Game not joined. Cannot make a move.');
    if (!signer) throw new Error('Wallet disconnected or signer not available. Cannot make a move.');
    const gameContractWithSigner = gameContract.connect(signer) as unknown as GameContract;
    console.log(`Attempting move at [${row}, ${col}] on ${await gameContractWithSigner.getAddress()}`);
    try {
        const tx: TransactionResponse = await gameContractWithSigner.makeMove(row, col);
        console.log("Make move transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Make move receipt:", receipt);
        if (!receipt || receipt.status !== 1) {
            console.error("Move transaction failed or reverted:", receipt);
            throw new Error("Move transaction failed or reverted. Check console.");
        }
        return receipt;
    } catch (error: any) {
        console.error("Failed to make move:", error);
        const reason = (error.data?.message || error.reason || error.message || "Unknown error");
        throw new Error(`Failed to make move: ${reason}`);
    }
}

export async function getBoardState(): Promise<string[][]> {
    if (!gameContract) {
        console.warn("No game contract set, returning empty board.");
        return Array(3).fill(null).map(() => Array(3).fill(ZERO_ADDRESS));
    }
    if (!gameContract.runner || (!gameContract.runner.provider && !(gameContract.runner as Signer).provider)) {
        throw new Error("Game contract has no provider to fetch board state. Connect wallet properly.");
    }
    console.log("Fetching board state...");
    try {
        const boardResult = await gameContract.getBoardState();
        console.log("Raw board state from contract:", boardResult);
        if (!Array.isArray(boardResult) || boardResult.length !== 3 || !boardResult.every(row => Array.isArray(row) && row.length === 3)) {
            console.error("Invalid board state format received:", boardResult);
            throw new Error("Received invalid board state format from contract.");
        }
        const processedBoard = boardResult.map(row =>
            row.map(cellAddrLike => {
                const cellStr = typeof cellAddrLike === 'string' ? cellAddrLike : resolveAddress(cellAddrLike as any); // Cast cellAddrLike to any if resolveAddress complains
                if (!ethers.isAddress(cellStr)) {
                    console.warn(`Invalid address string in board state: ${cellStr}`);
                    return ZERO_ADDRESS;
                }
                return ethers.getAddress(cellStr).toLowerCase();
            })
        );
        console.log("Processed board state:", processedBoard);
        return processedBoard;
    } catch (error: any) {
        console.error("Failed to get board state:", error);
        throw new Error(`Failed to get board state: ${error.message || 'Unknown error'}`);
    }
}

export async function isGameEnded(): Promise<boolean> {
    if (!gameContract) throw new Error('Game not joined. Cannot check if ended.');
    if (!gameContract.runner) throw new Error("Game contract has no runner. Connect wallet properly.");
    return await gameContract.gameEnded();
}

export async function getWinner(): Promise<string> {
    if (!gameContract) throw new Error('Game not joined. Cannot get winner.');
    if (!gameContract.runner) throw new Error("Game contract has no runner. Connect wallet properly.");
    const winnerAddress = await gameContract.winner();
    if (!ethers.isAddress(winnerAddress)) return ZERO_ADDRESS;
    return ethers.getAddress(winnerAddress).toLowerCase();
}

export async function getLastPlayer(): Promise<string> {
    if (!gameContract) throw new Error('Game not joined. Cannot get last player.');
    if (!gameContract.runner) throw new Error("Game contract has no runner. Connect wallet properly.");
    const lastPlayerAddress = await gameContract.lastPlayer();
    if (!ethers.isAddress(lastPlayerAddress)) return ZERO_ADDRESS;
    return ethers.getAddress(lastPlayerAddress).toLowerCase();
}

if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('MetaMask accountsChanged:', accounts);
        if (accounts.length === 0) {
            console.log("All accounts disconnected by user.");
            currentAccount = null;
            signer = null;
            window.location.reload();
        } else if (accounts[0] !== currentAccount) {
            console.log("Account switched. Reloading for simplicity...");
            window.location.reload();
        }
    });
    window.ethereum.on('chainChanged', (chainIdHex: string) => {
        console.log('MetaMask chainChanged:', chainIdHex);
        console.log("Network changed. Reloading for simplicity...");
        window.location.reload();
    });
}

export const getSigner = () => signer;
export const getProvider = () => provider;
export const getCurrentAccount = () => currentAccount;
export const getCurrentChainId = () => currentChainId;
export const getGameContractInstance = () => gameContract;
export const getFactoryContractInstance = () => factoryContract;