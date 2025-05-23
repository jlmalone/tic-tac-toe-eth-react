// src/services/ethereumService.ts
import {
    ethers,
    BrowserProvider,
    Contract,
    Signer,
    TransactionResponse,
    TransactionReceipt,
    InterfaceAbi,
    AddressLike,
    BaseContract,
    resolveAddress
} from 'ethers';
import { FACTORY_ABI, GAME_ABI } from '../contracts/abis';
import { CONTRACT_ADDRESSES, EXPECTED_CHAIN_ID, ZERO_ADDRESS } from '../contracts/addresses';
import { IBlockchainService, BoardState } from './blockchainServiceTypes';
import { emojiForAddress as ethEmojiForAddress, shortenAddress as ethShortenAddress } from '../utils/helpers';

interface GameCreatedEventArgs {
    gameAddress: string;
}

interface GameContract extends BaseContract {
    makeMove(row: ethers.BigNumberish, col: ethers.BigNumberish, overrides?: ethers.Overrides): Promise<TransactionResponse>;
    getBoardState(overrides?: ethers.Overrides): Promise<AddressLike[][]>;
    gameEnded(overrides?: ethers.Overrides): Promise<boolean>;
    winner(overrides?: ethers.Overrides): Promise<string>;
    lastPlayer(overrides?: ethers.Overrides): Promise<string>;
    connect(signerOrProvider: Signer | BrowserProvider | null): GameContract;
    getAddress(): Promise<string>;
    interface: ethers.Interface;
}

class EthereumService implements IBlockchainService {
    private provider: BrowserProvider | null = null;
    private signer: Signer | null = null;
    private factoryContract: Contract | null = null;
    private gameContract: GameContract | null = null;
    private currentAccount: string | null = null;
    private currentChainId: number | null = null;
    private currentGameAddress: string | null = null;

    private accountChangedCallback: ((account: string | null) => void) | null = null;
    private networkChangedCallback: ((network: string | number | null) => void) | null = null;

    constructor() {
        this.initializeListeners();
    }

    private initializeListeners() {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', this.handleAccountsChanged);
            window.ethereum.on('chainChanged', this.handleChainChanged);
        }
    }

    private handleAccountsChanged = async (accounts: string[]) => {
        console.log('ETH: MetaMask accountsChanged:', accounts);
        if (accounts.length === 0) {
            this.resetConnectionState();
            if (this.accountChangedCallback) this.accountChangedCallback(null);
        } else if (accounts[0].toLowerCase() !== this.currentAccount?.toLowerCase()) {
            // Re-initialize with the new account
            await this.connectWallet().catch(err => console.error("Error re-connecting on account change:", err));
        }
    };

    private handleChainChanged = async (chainIdHex: string) => {
        console.log('ETH: MetaMask chainChanged:', chainIdHex);
        const newChainId = parseInt(chainIdHex, 16);
        if (newChainId !== this.currentChainId) {
            // Re-initialize with the new chain
            await this.connectWallet().catch(err => console.error("Error re-connecting on chain change:", err));
        }
    };

    onAccountChanged(callback: (account: string | null) => void): void {
        this.accountChangedCallback = callback;
    }
    onNetworkChanged(callback: (network: string | number | null) => void): void {
        this.networkChangedCallback = callback;
    }
    cleanupListeners(): void {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
            window.ethereum.removeListener('chainChanged',this.handleChainChanged);
        }
    }

    private resetConnectionState() {
        this.provider = null;
        this.signer = null;
        this.factoryContract = null;
        this.gameContract = null;
        this.currentAccount = null;
        this.currentChainId = null;
        this.currentGameAddress = null;
    }

    async connectWallet(): Promise<string> {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed.');
        }
        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await this.provider.send('eth_requestAccounts', []);
            if (accounts.length === 0) throw new Error("No accounts found.");

            this.signer = await this.provider.getSigner();
            this.currentAccount = await this.signer.getAddress();
            const network = await this.provider.getNetwork();
            this.currentChainId = Number(network.chainId);

            if (this.networkChangedCallback) this.networkChangedCallback(this.currentChainId);
            if (this.accountChangedCallback) this.accountChangedCallback(this.currentAccount);


            if (this.currentChainId !== EXPECTED_CHAIN_ID) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: ethers.toBeHex(EXPECTED_CHAIN_ID) }],
                    });
                    // After switch, re-fetch signer, account, and network
                    this.signer = await this.provider.getSigner();
                    this.currentAccount = await this.signer.getAddress();
                    const newNetwork = await this.provider.getNetwork();
                    this.currentChainId = Number(newNetwork.chainId);
                    if (this.networkChangedCallback) this.networkChangedCallback(this.currentChainId);
                    if (this.accountChangedCallback) this.accountChangedCallback(this.currentAccount);
                } catch (switchError: any) {
                    if (switchError.code === 4902) throw new Error(`Network ${EXPECTED_CHAIN_ID} not found in MetaMask.`);
                    throw new Error(`Please switch to network ${EXPECTED_CHAIN_ID}. Current: ${this.currentChainId}`);
                }
            }

            if (this.currentChainId !== EXPECTED_CHAIN_ID) {
                throw new Error(`Failed to switch to expected network ${EXPECTED_CHAIN_ID}. Connected to ${this.currentChainId}.`);
            }

            const factoryAddress = CONTRACT_ADDRESSES[this.currentChainId]?.factoryAddress;
            if (!factoryAddress) {
                throw new Error(`Unsupported network (Chain ID: ${this.currentChainId}). No factory address.`);
            }
            this.factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI as InterfaceAbi, this.signer);
            if (this.currentGameAddress) {
                await this.setGameAddress(this.currentGameAddress); // Re-initialize game contract if one was active
            }
            return this.currentAccount;
        } catch (error: any) {
            this.resetConnectionState();
            if (this.accountChangedCallback) this.accountChangedCallback(null);
            if (this.networkChangedCallback) this.networkChangedCallback(null);
            throw error;
        }
    }

    async disconnectWallet(): Promise<void> {
        // MetaMask doesn't have a programmatic disconnect. We clear state.
        this.resetConnectionState();
        if (this.accountChangedCallback) this.accountChangedCallback(null);
        if (this.networkChangedCallback) this.networkChangedCallback(null);
        console.log("Ethereum wallet state cleared. User needs to disconnect from MetaMask extension.");
    }

    async createGame(): Promise<string> {
        if (!this.signer || !this.factoryContract) throw new Error('Wallet not connected or factory not initialized.');

        const tx: TransactionResponse = await (this.factoryContract as any).createGame();
        const receipt: TransactionReceipt | null = await tx.wait();

        if (!receipt || receipt.status !== 1) {
            throw new Error("Game creation transaction failed.");
        }

        const gameCreatedEventName = 'GameCreated';
        const gameCreatedEventFragment = this.factoryContract.interface.getEvent(gameCreatedEventName);
        if (!gameCreatedEventFragment) throw new Error(`Event "${gameCreatedEventName}" not found in ABI.`);

        const gameCreatedTopic = gameCreatedEventFragment.topicHash;
        const factoryAddressLower = (await this.factoryContract.getAddress()).toLowerCase();

        const gameCreatedLog = receipt.logs.find(
            log => log.address.toLowerCase() === factoryAddressLower && log.topics[0] === gameCreatedTopic
        );

        if (!gameCreatedLog) throw new Error("Could not find GameCreated event.");
        const parsedLog = this.factoryContract.interface.parseLog({ topics: Array.from(gameCreatedLog.topics), data: gameCreatedLog.data });
        if (!parsedLog) throw new Error("Failed to parse GameCreated event log.");

        const eventArgs = parsedLog.args as unknown as GameCreatedEventArgs;
        const newGameAddress = eventArgs?.gameAddress;

        if (!newGameAddress || !ethers.isAddress(newGameAddress)) {
            throw new Error("Failed to extract valid game address from event.");
        }
        await this.setGameAddress(newGameAddress);
        return newGameAddress;
    }

    async joinGame(gameId: string): Promise<void> {
        if (!ethers.isAddress(gameId)) throw new Error("Invalid Ethereum game address format.");
        await this.setGameAddress(gameId);
    }

    async setGameAddress(address: string | null): Promise<void> {
        this.currentGameAddress = address;
        if (address && ethers.isAddress(address) && (this.signer || this.provider)) {
            const contractSignerOrProvider = this.signer ?? this.provider;
            if (!contractSignerOrProvider) throw new Error("No signer or provider available for game contract.");
            this.gameContract = new ethers.Contract(
                address,
                GAME_ABI as InterfaceAbi,
                contractSignerOrProvider
            ) as unknown as GameContract;
        } else {
            this.gameContract = null;
        }
    }

    getGameAddress(): string | null {
        return this.currentGameAddress;
    }

    async makeMove(row: number, col: number): Promise<void> {
        if (!this.gameContract || !this.signer) throw new Error('Game not joined or wallet disconnected.');
        const gameContractWithSigner = this.gameContract.connect(this.signer) as unknown as GameContract;
        const tx: TransactionResponse = await gameContractWithSigner.makeMove(row, col);
        const receipt = await tx.wait();
        if (!receipt || receipt.status !== 1) {
            throw new Error("Move transaction failed.");
        }
    }

    async getBoardState(gameId?: string): Promise<BoardState> {
        const contractToUse = gameId ?
            (new ethers.Contract(gameId, GAME_ABI as InterfaceAbi, this.provider ?? (this.signer?.provider))) as unknown as GameContract
            : this.gameContract;

        if (!contractToUse) return Array(3).fill(null).map(() => Array(3).fill(this.getZeroAddress()));
        if (!contractToUse.runner || (!contractToUse.runner.provider && !(contractToUse.runner as Signer).provider)) {
            throw new Error("Game contract has no provider for board state.");
        }

        const boardResult = await contractToUse.getBoardState();
        return boardResult.map(rowArray =>
            rowArray.map(cellAddrLike => {
                const cellStr = typeof cellAddrLike === 'string' ? cellAddrLike : resolveAddress(cellAddrLike as any);
                return ethers.isAddress(cellStr) ? ethers.getAddress(cellStr).toLowerCase() : this.getZeroAddress();
            })
        );
    }

    async isGameEnded(gameId?: string): Promise<boolean> {
        const contractToUse = gameId ?
            (new ethers.Contract(gameId, GAME_ABI as InterfaceAbi, this.provider ?? (this.signer?.provider))) as unknown as GameContract
            : this.gameContract;
        if (!contractToUse) throw new Error('Game contract not available.');
        if (!contractToUse.runner) throw new Error("Game contract has no runner.");
        return contractToUse.gameEnded();
    }

    async getWinner(gameId?: string): Promise<string> {
        const contractToUse = gameId ?
            (new ethers.Contract(gameId, GAME_ABI as InterfaceAbi, this.provider ?? (this.signer?.provider))) as unknown as GameContract
            : this.gameContract;
        if (!contractToUse) throw new Error('Game contract not available.');
        if (!contractToUse.runner) throw new Error("Game contract has no runner.");
        const winnerAddress = await contractToUse.winner();
        return ethers.isAddress(winnerAddress) ? ethers.getAddress(winnerAddress).toLowerCase() : this.getZeroAddress();
    }

    getCurrentAccount = () => this.currentAccount;
    getNetworkIdentifier = () => this.currentChainId;
    getExplorerBaseUrl = () => this.currentChainId === EXPECTED_CHAIN_ID ? 'https://sepolia.etherscan.io' : 'https://etherscan.io';
    getZeroAddress = () => ZERO_ADDRESS;
    isValidAddress = (address: string) => ethers.isAddress(address);
    shortenAddress = (address: string) => ethShortenAddress(address);
    emojiForAddress = (address: string) => ethEmojiForAddress(address);
}

export default EthereumService;