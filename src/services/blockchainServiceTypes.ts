// src/services/blockchainServiceTypes.ts
export type BoardState = string[][]; // Array of player identifiers (ETH address or SOL PubKey string)

export interface IBlockchainService {
    connectWallet: () => Promise<string>;
    disconnectWallet?: () => Promise<void>;
    createGame: () => Promise<string>; // Returns game address/ID
    joinGame: (gameId: string) => Promise<void>;
    makeMove: (row: number, col: number) => Promise<void>;
    getBoardState: (gameId?: string) => Promise<BoardState>;
    isGameEnded: (gameId?: string) => Promise<boolean>;
    getWinner: (gameId?: string) => Promise<string>; // Returns winner's identifier or empty/zero

    getCurrentAccount: () => string | null;
    getNetworkIdentifier: () => string | number | null; // ETH: Chain ID (number), SOL: Network name (string)
    getExplorerBaseUrl: () => string;
    getZeroAddress: () => string; // ETH: 0x000..., SOL: Placeholder for empty cell
    isValidAddress: (address: string) => boolean;
    shortenAddress: (address: string) => string;
    emojiForAddress: (address: string) => string;

    setGameAddress: (address: string | null) => Promise<void>;
    getGameAddress: () => string | null;

    onAccountChanged: (callback: (account: string | null) => void) => void;
    onNetworkChanged: (callback: (network: string | number | null) => void) => void;
    cleanupListeners: () => void;
}