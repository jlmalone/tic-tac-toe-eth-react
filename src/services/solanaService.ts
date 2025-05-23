// src/services/solanaService.ts
import * as anchor from "@coral-xyz/anchor";
import { utils as AnchorUtils } from "@coral-xyz/anchor"; // Import utils
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js"; // SystemProgram removed as unused for now
import { WalletContextState } from '@solana/wallet-adapter-react';
import bs58 from "bs58"; // Changed to default import

import { IBlockchainService, BoardState } from './blockchainServiceTypes';
import { SOLANA_RPC_ENDPOINT, SOLANA_EXPECTED_NETWORK, SOLANA_TIC_TAC_TOE_PROGRAM_ID, SOLANA_EMPTY_CELL_FILLER_STRING } from '../solanaConfig';
import { emojiForAddress as genericEmojiForAddress, shortenAddress as genericShortenAddress } from '../utils/helpers';

import { TicTacToeSol as TicTacToeIdlType } from '../target/types/tic_tac_toe_sol';
import idlJsonFromFile from './idl/tic_tac_toe_sol.json';

const runtimeIdlObject = idlJsonFromFile as unknown as TicTacToeIdlType;

const GAME_ACCOUNT_SIZE = 372;
const GAME_ACCOUNT_DISCRIMINATOR_STRING = "Game"; // PascalCase, matching your Rust struct
const discriminatorNamespace = "account"; // Anchor's namespace for account discriminators
const discriminatorInput = `${discriminatorNamespace}:${GAME_ACCOUNT_DISCRIMINATOR_STRING}`;
const hashedDiscriminator = AnchorUtils.sha256.hash(discriminatorInput); // This returns a hex string
const GAME_ACCOUNT_DISCRIMINATOR_BUFFER = Buffer.from(hashedDiscriminator.slice(0, 16), "hex"); // Take first 8 bytes (16 hex chars)


if (!runtimeIdlObject.address) {
    // @ts-ignore
    runtimeIdlObject.address = SOLANA_TIC_TAC_TOE_PROGRAM_ID.toBase58();
}

type TypedProgram = Program<TicTacToeIdlType>;

interface ClientSideAnchorWallet {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}

class SolanaService implements IBlockchainService {
    private connection: Connection;
    private provider: AnchorProvider | null = null;
    private program: TypedProgram;
    private walletContext: WalletContextState;
    private currentGamePublicKey: PublicKey | null = null;

    private accountChangedCallback: ((account: string | null) => void) | null = null;
    private networkChangedCallback: ((network: string | number | null) => void) | null = null;

    constructor(walletContext: WalletContextState) {
        this.connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
        this.walletContext = walletContext;

        const dummyKeypair = Keypair.generate();
        const defaultWallet: ClientSideAnchorWallet = {
            publicKey: dummyKeypair.publicKey,
            signTransaction: async (tx) => { throw new Error("Default wallet cannot sign transactions."); },
            signAllTransactions: async (txs) => { throw new Error("Default wallet cannot sign all transactions."); },
        };
        const initialReadOnlyProvider = new AnchorProvider(this.connection, defaultWallet, { preflightCommitment: "confirmed" });

        this.program = new Program<TicTacToeIdlType>(
            runtimeIdlObject,
            initialReadOnlyProvider
        );
        this.updateProvider();
    }

    public updateWalletState(newWalletContext: WalletContextState) {
        const oldAccount = this.getCurrentAccount();
        this.walletContext = newWalletContext;
        this.updateProvider();
        const newAccount = this.getCurrentAccount();

        if (oldAccount !== newAccount) {
            if (this.accountChangedCallback) this.accountChangedCallback(newAccount);
        }
        if (this.networkChangedCallback) this.networkChangedCallback(this.getNetworkIdentifier());
    }

    private updateProvider() {
        if (this.walletContext.connected && this.walletContext.publicKey && this.walletContext.signTransaction && this.walletContext.signAllTransactions) {
            const anchorCompatibleWallet: ClientSideAnchorWallet = {
                publicKey: this.walletContext.publicKey,
                signTransaction: this.walletContext.signTransaction,
                signAllTransactions: this.walletContext.signAllTransactions,
            };
            this.provider = new AnchorProvider(
                this.connection,
                anchorCompatibleWallet,
                { preflightCommitment: "confirmed" }
            );
            anchor.setProvider(this.provider);
            this.program = new Program<TicTacToeIdlType>(
                runtimeIdlObject,
                this.provider
            );
        } else {
            const dummyKeypair = Keypair.generate();
            const readOnlyWallet: ClientSideAnchorWallet = {
                publicKey: dummyKeypair.publicKey,
                signTransaction: async (tx) => { throw new Error("Read-only wallet cannot sign."); },
                signAllTransactions: async (txs) => { throw new Error("Read-only wallet cannot sign all."); },
            };
            const readOnlyProvider = new AnchorProvider(this.connection, readOnlyWallet, { preflightCommitment: "confirmed" });

            this.provider = null;
            this.program = new Program<TicTacToeIdlType>(
                runtimeIdlObject,
                readOnlyProvider
            );
        }
    }

    async connectWallet(): Promise<string> {
        if (!this.walletContext.connected) {
            try {
                await this.walletContext.connect();
            } catch (e) {
                console.error("Solana connect error:", e);
                throw new Error(`Failed to connect Solana wallet: ${(e as Error).message || "User rejected or error occurred."}`);
            }
        }
        if (!this.walletContext.publicKey) {
            throw new Error("Solana wallet connection failed or public key not available.");
        }
        this.updateProvider();
        if (this.accountChangedCallback) this.accountChangedCallback(this.walletContext.publicKey.toBase58());
        if (this.networkChangedCallback) this.networkChangedCallback(this.getNetworkIdentifier());
        return this.walletContext.publicKey.toBase58();
    }

    async disconnectWallet(): Promise<void> {
        if (this.walletContext.connected) {
            await this.walletContext.disconnect();
        }
        this.currentGamePublicKey = null;
        this.updateProvider();
        if (this.accountChangedCallback) this.accountChangedCallback(null);
    }

    async createGame(): Promise<string> {
        if (!this.provider || !this.provider.publicKey) {
            throw new Error('Solana wallet not connected or provider not initialized for transaction.');
        }
        const gameKeypair = Keypair.generate();
        try {
            const sig = await this.program.methods
                .initialize()
                .accounts({
                    game: gameKeypair.publicKey,
                    player: this.provider.publicKey,
                })
                .signers([gameKeypair])
                .rpc();
            console.log("Solana game created, signature:", sig);
            const newGameAddress = gameKeypair.publicKey.toBase58();
            await this.setGameAddress(newGameAddress);
            return newGameAddress;
        } catch (error: any) {
            console.error("Solana: Failed to create game:", error, error?.logs);
            throw new Error(`Failed to create Solana game: ${error.message || error.toString()}`);
        }
    }

    async joinGame(gameId: string): Promise<void> {
        if (!this.isValidAddress(gameId)) throw new Error("Invalid Solana game address (PublicKey).");
        try {
            const pk = new PublicKey(gameId);
            await this.program.account.game.fetch(pk);
            await this.setGameAddress(gameId);
            console.log(`Solana: Joined game: ${gameId}`);
        } catch (error: any) {
            await this.setGameAddress(null);
            throw new Error(`Failed to join Solana game ${gameId}: Account not found or invalid type. Detail: ${error.message || error.toString()}`);
        }
    }

    async setGameAddress(address: string | null): Promise<void> {
        if (address && this.isValidAddress(address)) {
            this.currentGamePublicKey = new PublicKey(address);
        } else {
            this.currentGamePublicKey = null;
        }
    }

    getGameAddress(): string | null {
        return this.currentGamePublicKey?.toBase58() || null;
    }

    async makeMove(row: number, col: number): Promise<void> {
        if (!this.provider || !this.provider.publicKey || !this.currentGamePublicKey) {
            throw new Error('Solana game not joined or wallet not connected for making a move.');
        }
        try {
            const sig = await this.program.methods
                .makeMove(row, col)
                .accounts({
                    game: this.currentGamePublicKey,
                    player: this.provider.publicKey,
                })
                .rpc();
            console.log("Solana move submitted, signature:", sig);
        } catch (error: any) {
            console.error("Solana: Failed to make move:", error, error?.logs);
            throw new Error(`Failed to make Solana move: ${error.message || error.toString()}`);
        }
    }

    async getBoardState(gameId?: string): Promise<BoardState> {
        const targetGamePkStr = gameId || this.currentGamePublicKey?.toBase58();
        if (!targetGamePkStr || !this.isValidAddress(targetGamePkStr)) {
            return Array(3).fill(null).map(() => Array(3).fill(this.getZeroAddress()));
        }
        const targetGamePk = new PublicKey(targetGamePkStr);
        try {
            const gameAccount = await this.program.account.game.fetch(targetGamePk);
            const boardState: BoardState = Array(3).fill(null).map(() => Array(3).fill(this.getZeroAddress()));
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const cellPlayerPubkey = gameAccount.board[r * 3 + c] as PublicKey | null;
                    boardState[r][c] = cellPlayerPubkey ? cellPlayerPubkey.toBase58() : this.getZeroAddress();
                }
            }
            return boardState;
        } catch (error: any) {
            console.error(`Solana: Failed to get board state for ${targetGamePkStr}:`, error);
            return Array(3).fill(null).map(() => Array(3).fill(this.getZeroAddress()));
        }
    }

    async isGameEnded(gameId?: string): Promise<boolean> {
        const targetGamePkStr = gameId || this.currentGamePublicKey?.toBase58();
        if (!targetGamePkStr || !this.isValidAddress(targetGamePkStr)) return false;
        try {
            const gameAccount = await this.program.account.game.fetch(new PublicKey(targetGamePkStr));
            return gameAccount.gameEnded;
        } catch { return false; }
    }

    async getWinner(gameId?: string): Promise<string> {
        const targetGamePkStr = gameId || this.currentGamePublicKey?.toBase58();
        if (!targetGamePkStr || !this.isValidAddress(targetGamePkStr)) return this.getZeroAddress();
        try {
            const gameAccount = await this.program.account.game.fetch(new PublicKey(targetGamePkStr));
            const winnerPubkey = gameAccount.winner as PublicKey | null;
            return winnerPubkey ? winnerPubkey.toBase58() : this.getZeroAddress();
        } catch { return this.getZeroAddress(); }
    }

    public async getAllSolanaGamesWithStatus(): Promise<Array<{ address: string; winner: string; ended: boolean }>> {
        try {
            console.log("Fetching all Solana game accounts using getProgramAccounts...");
            const accounts = await this.connection.getProgramAccounts(
                SOLANA_TIC_TAC_TOE_PROGRAM_ID,
                {
                    filters: [
                        { dataSize: GAME_ACCOUNT_SIZE },
                        {
                            memcmp: {
                                offset: 0,
                                bytes: bs58.encode(GAME_ACCOUNT_DISCRIMINATOR_BUFFER)
                            }
                        }
                    ]
                }
            );
            console.log(`Found ${accounts.length} potential game accounts.`);

            const gameDetailsPromises = accounts.map(async (accountInfo) => {
                try {
                    const gameData = this.program.coder.accounts.decode("game", accountInfo.account.data);

                    return {
                        address: accountInfo.pubkey.toBase58(),
                        winner: gameData.winner ? (gameData.winner as PublicKey).toBase58() : this.getZeroAddress(),
                        // ended: gameData.gameEnded as boolean
                        ended: gameData.game_ended as boolean
                    };
                } catch (e) {
                    console.warn(`Failed to decode game account ${accountInfo.pubkey.toBase58()}:`, e);
                    return null;
                }
            });

            const resolvedGameDetails = await Promise.all(gameDetailsPromises);
            const validGameDetails = resolvedGameDetails.filter(detail => detail !== null) as Array<{ address: string; winner: string; ended: boolean }>;

            return validGameDetails.sort((a,b) => a.address.localeCompare(b.address));
        } catch (error) {
            console.error("Error fetching Solana game accounts:", error);
            throw new Error("Failed to fetch Solana game history from the blockchain.");
        }
    }

    getCurrentAccount = () => this.walletContext.publicKey?.toBase58() || null;
    getNetworkIdentifier = () => SOLANA_EXPECTED_NETWORK;
    getExplorerBaseUrl = () => `https://explorer.solana.com/?cluster=${SOLANA_EXPECTED_NETWORK}`;
    getZeroAddress = () => SOLANA_EMPTY_CELL_FILLER_STRING;
    isValidAddress = (address: string) => {
        try { new PublicKey(address); return true; }
        catch { return false; }
    };
    shortenAddress = (address: string) => genericShortenAddress(address);
    emojiForAddress = (address: string) => genericEmojiForAddress(address);

    onAccountChanged(callback: (account: string | null) => void): void { this.accountChangedCallback = callback; }
    onNetworkChanged(callback: (network: string | number | null) => void): void { this.networkChangedCallback = callback; }
    cleanupListeners(): void {
        this.accountChangedCallback = null;
        this.networkChangedCallback = null;
    }
}
export default SolanaService;