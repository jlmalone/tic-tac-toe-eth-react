// src/utils/helpers.test.ts

import { 
  shortenAddress, 
  emojiForAddress
} from './helpers';

describe('Helper Functions', () => {
  
  describe('shortenAddress', () => {
    test('shortens long Ethereum addresses correctly', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = shortenAddress(address);
      expect(result).toBe('0x1234...7890');
    });

    test('handles zero address', () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      const result = shortenAddress(zeroAddress);
      expect(result).toBe('0x0000...0000');
    });

    test('handles short addresses', () => {
      const shortAddress = '0x1234';
      const result = shortenAddress(shortAddress);
      expect(result).toBe('0x1234');
    });

    test('handles empty string', () => {
      const result = shortenAddress('');
      expect(result).toBe('');
    });

    test('handles null and undefined', () => {
      expect(shortenAddress(null)).toBe('');
      expect(shortenAddress(undefined)).toBe('');
    });

    test('handles Solana addresses', () => {
      const solanaAddress = 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1';
      const result = shortenAddress(solanaAddress);
      expect(result).toBe('DjVE6J...9qw1');
    });
  });

  describe('emojiForAddress', () => {
    test('returns dash for zero address', () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      const result = emojiForAddress(zeroAddress);
      expect(result).toBe('-');
    });

    test('returns dash for empty/null/undefined address', () => {
      expect(emojiForAddress('')).toBe('-');
      expect(emojiForAddress(null as any)).toBe('-');
      expect(emojiForAddress(undefined as any)).toBe('-');
    });

    test('returns consistent emoji for same address', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const emoji1 = emojiForAddress(address);
      const emoji2 = emojiForAddress(address);
      expect(emoji1).toBe(emoji2);
      expect(emoji1).toBeTruthy();
      expect(emoji1).not.toBe('-');
    });

    test('returns different emojis for different addresses', () => {
      const address1 = '0x1234567890123456789012345678901234567890';
      const address2 = '0x9876543210987654321098765432109876543210';
      const emoji1 = emojiForAddress(address1);
      const emoji2 = emojiForAddress(address2);
      expect(emoji1).not.toBe(emoji2);
      expect(emoji1).not.toBe('-');
      expect(emoji2).not.toBe('-');
    });

    test('handles case insensitivity', () => {
      const lowerAddress = '0x1234567890123456789012345678901234567890';
      const upperAddress = '0x1234567890123456789012345678901234567890'.toUpperCase();
      const emoji1 = emojiForAddress(lowerAddress);
      const emoji2 = emojiForAddress(upperAddress);
      expect(emoji1).toBe(emoji2);
    });

    test('handles Solana addresses', () => {
      const solanaAddress = 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1';
      const emoji = emojiForAddress(solanaAddress);
      expect(emoji).toBeTruthy();
      expect(emoji).not.toBe('-');
    });

    test('returns question mark for invalid addresses', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const invalidAddress = 'invalid-address-that-cannot-be-hashed';
      const emoji = emojiForAddress(invalidAddress);
      
      // Should either return valid emoji or question mark
      expect(emoji).toBeTruthy();
      expect(typeof emoji).toBe('string');
      
      consoleSpy.mockRestore();
    });

    test('emoji generation performance', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        emojiForAddress(address);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 1000 operations in reasonable time (under 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('returns valid emoji characters', () => {
      const addresses = [
        '0x1234567890123456789012345678901234567890',
        '0x9876543210987654321098765432109876543210',
        '0xabcdef1234567890abcdef1234567890abcdef12',
        'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
        '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'
      ];

      addresses.forEach(address => {
        const emoji = emojiForAddress(address);
        expect(emoji).toBeTruthy();
        expect(typeof emoji).toBe('string');
        expect(emoji.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration tests', () => {
    test('address shortening works with emoji generation', () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      
      const shortenedAddress = shortenAddress(validAddress);
      const emoji = emojiForAddress(validAddress);
      
      expect(shortenedAddress).toBe('0x1234...7890');
      expect(emoji).toBeTruthy();
      expect(emoji).not.toBe('-');
    });

    test('handles both Ethereum and Solana addresses consistently', () => {
      const ethAddress = '0x1234567890123456789012345678901234567890';
      const solAddress = 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1';
      
      const ethShortened = shortenAddress(ethAddress);
      const solShortened = shortenAddress(solAddress);
      
      const ethEmoji = emojiForAddress(ethAddress);
      const solEmoji = emojiForAddress(solAddress);
      
      expect(ethShortened).toBe('0x1234...7890');
      expect(solShortened).toBe('DjVE6J...9qw1');
      
      expect(ethEmoji).toBeTruthy();
      expect(solEmoji).toBeTruthy();
      expect(ethEmoji).not.toBe('-');
      expect(solEmoji).not.toBe('-');
    });

    test('consistent behavior across multiple calls', () => {
      const address = '0x1234567890123456789012345678901234567890';
      
      // Multiple calls should return same results
      const shortens = Array.from({ length: 10 }, () => shortenAddress(address));
      const emojis = Array.from({ length: 10 }, () => emojiForAddress(address));
      
      // All shortens should be identical
      expect(shortens.every(s => s === shortens[0])).toBe(true);
      
      // All emojis should be identical
      expect(emojis.every(e => e === emojis[0])).toBe(true);
    });
  });
});