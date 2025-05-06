// src/utils/helpers.ts
import { ethers } from 'ethers';

// Utility function to generate an emoji based on address hash
export function emojiForAddress(addr: string): string {
    if (!addr || addr === ethers.ZeroAddress) return '-'; // Handle null/zero address

    const emojis = [
        "😀", "🐶", "🌟", "🍕", "🚀", "🐍", "🎮", "📚", "🎵", "🌈",
        "🍔", "🧠", "🦄", "💎", "🕹️", "🧊", "⚡", "💡", "🧩", "🎯"
    ];
    try {
        // Ensure address is checksummed before hashing if necessary, though lowercase is used below
        const lowerAddr = addr.toLowerCase();
        // Hash the lowercase address bytes
        const hash = ethers.keccak256(ethers.toUtf8Bytes(lowerAddr));
        // Use a byte from the hash to pick an emoji
        const index = parseInt(hash.slice(2, 4), 16) % emojis.length;
        return emojis[index];
    } catch (error) {
        console.error("Error generating emoji for address:", addr, error);
        return '❓'; // Return a fallback emoji on error
    }
}

// Helper to shorten addresses for display
export function shortenAddress(addr: string | null | undefined): string {
    if (!addr) return "";
    if (addr.length < 12) return addr; // Avoid errors on short strings
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}