// src/solanaConfig.ts
import { PublicKey, SystemProgram } from '@solana/web3.js';

// --- Network Configuration ---
export const SOLANA_NETWORK_NAME = "devnet"; // Matches WalletAdapterNetwork values
export const SOLANA_RPC_ENDPOINT = process.env.REACT_APP_SOLANA_RPC_ENDPOINT || `https://api.${SOLANA_NETWORK_NAME}.solana.com`;
export const SOLANA_EXPECTED_NETWORK = SOLANA_NETWORK_NAME; // For display and checks

// --- Program IDs ---
// !!! IMPORTANT: REPLACE WITH YOUR *ACTUAL* DEPLOYED PROGRAM ID !!!
export const SOLANA_TIC_TAC_TOE_PROGRAM_ID = new PublicKey(
    "C18ERJ5zzEm5sanmVq5TELPg3KRe1ZB2Bsjf6GKNEaKx" // YOUR PROGRAM ID
);

// Placeholder for empty cells on the frontend board (uses a known system address)
export const SOLANA_EMPTY_CELL_FILLER_STRING = SystemProgram.programId.toBase58();