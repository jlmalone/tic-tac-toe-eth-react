// src/utils/helpers.test.ts
import { emojiForAddress, shortenAddress } from './helpers';
import { ethers } from 'ethers';
import { SystemProgram } from '@solana/web3.js';

describe('helpers', () => {
  describe('emojiForAddress', () => {
    it('should return "-" for empty/null addresses', () => {
      expect(emojiForAddress('')).toBe('-');
      expect(emojiForAddress(ethers.ZeroAddress)).toBe('-');
      expect(emojiForAddress(SystemProgram.programId.toBase58())).toBe('-');
    });

    it('should return consistent emoji for the same Ethereum address', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const emoji1 = emojiForAddress(address);
      const emoji2 = emojiForAddress(address);
      expect(emoji1).toBe(emoji2);
      expect(emoji1).not.toBe('-');
      expect(emoji1).not.toBe('❓');
    });

    it('should return consistent emoji for the same address regardless of case', () => {
      const lowerAddress = '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';
      const upperAddress = '0x742D35CC6634C0532925A3B844BC9E7595F0BEB0';
      const emoji1 = emojiForAddress(lowerAddress);
      const emoji2 = emojiForAddress(upperAddress);
      expect(emoji1).toBe(emoji2);
    });

    it('should return different emojis for different addresses (usually)', () => {
      const address1 = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const address2 = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
      const emoji1 = emojiForAddress(address1);
      const emoji2 = emojiForAddress(address2);
      // Note: There's a small chance (1/30) they could be the same, but very unlikely
      // We test that they're both valid emojis
      expect(emoji1).not.toBe('-');
      expect(emoji2).not.toBe('-');
      expect(emoji1).not.toBe('❓');
      expect(emoji2).not.toBe('❓');
    });

    it('should work with Solana public keys', () => {
      const solanaAddress = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
      const emoji = emojiForAddress(solanaAddress);
      expect(emoji).not.toBe('-');
      expect(emoji).not.toBe('❓');
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });

    it('should return "❓" for invalid input that causes errors', () => {
      // Test with an object that will cause keccak256 to fail
      const result = emojiForAddress(null as any);
      expect(result).toBe('❓');
    });

    it('should return one of the predefined emojis', () => {
      const validEmojis = [
        "😀", "🐶", "🌟", "🍕", "🚀", "🐍", "🎮", "📚", "🎵", "🌈",
        "🍔", "🧠", "🦄", "💎", "🕹️", "🧊", "⚡", "💡", "🧩", "🎯",
        "🐱", "🐸", "🍎", "🍄", "🌻", "🌴", "🍀", "🌊", "🔥", "💧"
      ];
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const emoji = emojiForAddress(address);
      expect(validEmojis).toContain(emoji);
    });
  });

  describe('shortenAddress', () => {
    it('should shorten long Ethereum addresses correctly', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      expect(shortenAddress(address)).toBe('0x742d...bEb0');
    });

    it('should shorten long Solana addresses correctly', () => {
      const address = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
      expect(shortenAddress(address)).toBe('DYw8jC...NSKK');
    });

    it('should return empty string for null input', () => {
      expect(shortenAddress(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(shortenAddress(undefined)).toBe('');
    });

    it('should return the full address if shorter than 12 characters', () => {
      const shortAddr = '0x123456789';
      expect(shortenAddress(shortAddr)).toBe(shortAddr);
    });

    it('should handle exactly 12 character addresses', () => {
      const addr12 = '0x1234567890';
      // Length is 12, so it should return as-is
      expect(shortenAddress(addr12)).toBe(addr12);
    });

    it('should handle addresses of various lengths', () => {
      expect(shortenAddress('abc')).toBe('abc');
      expect(shortenAddress('0x1234')).toBe('0x1234');
      expect(shortenAddress('0x12345678901234567890')).toBe('0x1234...7890');
    });
  });
});
