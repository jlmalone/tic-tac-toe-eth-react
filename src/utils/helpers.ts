// src/utils/helpers.ts
import { ethers } from 'ethers'; // Keep for Ethereum's ZeroAddress and keccak256
// Import SystemProgram for SOLANA_EMPTY_CELL_FILLER_STRING check if needed elsewhere,
// or rely on solanaConfig.ts for the actual constant value.
import { SystemProgram } from '@solana/web3.js';
// Utility function to generate an emoji based on address string
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

// Helper to shorten addresses for display
export function shortenAddress(addr: string | null | undefined): string {
    if (!addr) return "";
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

