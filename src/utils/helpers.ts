// src/utils/helpers.ts
import { ethers } from 'ethers'; // Keep for Ethereum's ZeroAddress and keccak256
// Import SystemProgram for SOLANA_EMPTY_CELL_FILLER_STRING check if needed elsewhere,
// or rely on solanaConfig.ts for the actual constant value.
import { SystemProgram } from '@solana/web3.js';

/**
 * Generates a consistent emoji representation for a blockchain address.
 * Uses keccak256 hash to ensure the same address always returns the same emoji.
 *
 * @param addr - The blockchain address (Ethereum or Solana)
 * @returns An emoji character representing the address, or '-' for empty/zero addresses
 *
 * @example
 * emojiForAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0') // Returns: "🌟"
 * emojiForAddress('0x0000000000000000000000000000000000000000') // Returns: "-"
 */
export function emojiForAddress(addr: string): string {
    // For Solana, SOLANA_EMPTY_CELL_FILLER_STRING is used for empty.
    // For Ethereum, ethers.ZeroAddress is used.
    // This function should handle both.
    if (!addr || addr === ethers.ZeroAddress || addr === SystemProgram.programId.toBase58()) {
        return '-';
    }

    const emojis = [
        "😀", "🐶", "🌟", "🍕", "🚀", "🐍", "🎮", "📚", "🎵", "🌈",
        "🍔", "🧠", "🦄", "💎", "🕹️", "🧊", "⚡", "💡", "🧩", "🎯",
        "🐱", "🐸", "🍎", "🍄", "🌻", "🌴", "🍀", "🌊", "🔥", "💧"
    ];
    try {
        // Hash the address string (works for both ETH and SOL addresses)
        const lowerAddr = addr.toLowerCase();
        const hash = ethers.keccak256(ethers.toUtf8Bytes(lowerAddr));
        const index = parseInt(hash.slice(2, 4), 16) % emojis.length;
        return emojis[index];
    } catch (error) {
        console.error("Error generating emoji for address:", addr, error);
        return '❓';
    }
}

/**
 * Shortens a blockchain address for display purposes.
 * Keeps the first 6 and last 4 characters with ellipsis in between.
 *
 * @param addr - The full blockchain address to shorten
 * @returns Shortened address string, or empty string if addr is null/undefined
 *
 * @example
 * shortenAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0') // Returns: "0x742d...bEb0"
 * shortenAddress(null) // Returns: ""
 */
export function shortenAddress(addr: string | null | undefined): string {
    if (!addr) return "";
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

