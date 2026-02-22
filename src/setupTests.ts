// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfills for Node.js test environment
import { TextDecoder, TextEncoder } from 'util';

// Add TextDecoder and TextEncoder to global scope for tests
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

// Mock for crypto.subtle for tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn(),
    },
    getRandomValues: jest.fn(),
  },
});

// Mock for performance.now() if not available
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
  } as any;
}
