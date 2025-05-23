// src/services/solanaService.ts
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, Idl as AnchorIdl } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { WalletContextState } from '@solana/wallet-adapter-react';

import { IBlockchainService, BoardState } from './blockchainServiceTypes';
import { SOLANA_RPC_ENDPOINT, SOLANA_EXPECTED_NETWORK, SOLANA_TIC_TAC_TOE_PROGRAM_ID, SOLANA_EMPTY_CELL_FILLER_STRING } from '../solanaConfig';
import { emojiForAddress as genericEmojiForAddress, shortenAddress as genericShortenAddress } from '../utils/helpers';

import { TicTacToeSol as TicTacToeIdlType } from '../target/types/tic_tac_toe_sol';
// import idlJsonFromTypes from '../target/types/tic_tac_toe_sol'; // Assuming this exports the IDL object directly
import idlJsonFromFile from './idl/tic_tac_toe_sol.json'; // The actual JSON file

// Use the IDL JSON directly from the file for runtime.
// The TicTacToeIdlType is for TypeScript's static analysis.
const runtimeIdlObject = idlJsonFromFile as unknown as TicTacToeIdlType;

// Ensure the runtimeIdlObject has the program address if needed by older Anchor versions or specific constructor overloads
// The `address` field in your IDL JSON *is* the program ID.
if (!runtimeIdlObject.address) {
    // @ts-ignore
    runtimeIdlObject.address = SOLANA_TIC_TAC_TOE_PROGRAM_ID.toBase58();
}


type TypedProgram = Program<TicTacToeIdlType>;

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

        // Use the constructor signature: new Program(idl, provider?)
        // The programId (SOLANA_TIC_TAC_TOE_PROGRAM_ID) is expected to be part of the IDL (runtimeIdlObject.address)
        // or Anchor will use the `address` field from the IDL.
        this.program = new Program<TicTacToeIdlType>(
            runtimeIdlObject,         // 1st arg: The IDL object (which includes the program address)
            initialReadOnlyProvider // 2nd arg: An AnchorProvider instance
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
            // Re-initialize the program with the new, real provider
            this.program = new Program<TicTacToeIdlType>(
                runtimeIdlObject,
                this.provider // Pass the provider as the second argument
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
                readOnlyProvider // Program instance still needs a provider
            );
        }
    }

    // ... (Rest of the SolanaService class methods: connectWallet, createGame, etc. should be mostly the same)
    // Just ensure that they don't try to pass programId explicitly to a Program constructor if it's not expected.
    // The key is that `this.program` is correctly initialized in constructor and updateProvider.
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
        this.updateProvider(); // CRITICAL: Ensure provider is updated after connection attempt
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
            await this.setGameAddress(gameKeypair.publicKey.toBase58());
            return gameKeypair.publicKey.toBase58();
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
            if (!gameAccount || !Array.isArray(gameAccount.board) || gameAccount.board.length !== 9) {
                console.error("Solana: Fetched game account has invalid board structure", gameAccount);
                return Array(3).fill(null).map(() => Array(3).fill(this.getZeroAddress()));
            }

            const board: string[][] = Array(3).fill(null).map(() => Array(3).fill(this.getZeroAddress()));
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const cellPlayerPubkey = gameAccount.board[r * 3 + c] as PublicKey | null;
                    board[r][c] = cellPlayerPubkey ? cellPlayerPubkey.toBase58() : this.getZeroAddress();
                }
            }
            return board;
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
        } catch {
            return false;
        }
    }

    async getWinner(gameId?: string): Promise<string> {
        const targetGamePkStr = gameId || this.currentGamePublicKey?.toBase58();
        if (!targetGamePkStr || !this.isValidAddress(targetGamePkStr)) return this.getZeroAddress();
        try {
            const gameAccount = await this.program.account.game.fetch(new PublicKey(targetGamePkStr));
            const winnerPubkey = gameAccount.winner as PublicKey | null;
            return winnerPubkey ? winnerPubkey.toBase58() : this.getZeroAddress();
        } catch {
            return this.getZeroAddress();
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

// Re-define ClientSideAnchorWallet here as it was defined inside the class before
interface ClientSideAnchorWallet {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}

export default SolanaService;