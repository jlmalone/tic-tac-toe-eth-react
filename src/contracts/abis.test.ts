// src/contracts/abis.test.ts

import { FACTORY_ABI, GAME_ABI } from './abis';

describe('Contract ABIs', () => {
  
  describe('FACTORY_ABI', () => {
    test('is defined and is an array', () => {
      expect(FACTORY_ABI).toBeDefined();
      expect(Array.isArray(FACTORY_ABI)).toBe(true);
      expect(FACTORY_ABI.length).toBeGreaterThan(0);
    });

    test('contains createGame function signature', () => {
      const createGameFunction = FACTORY_ABI.find(
        item => typeof item === 'string' && item.includes('createGame')
      );
      expect(createGameFunction).toBeDefined();
      expect(createGameFunction).toContain('function createGame()');
      expect(createGameFunction).toContain('returns (address)');
    });

    test('contains GameCreated event signature', () => {
      const gameCreatedEvent = FACTORY_ABI.find(
        item => typeof item === 'string' && item.includes('GameCreated')
      );
      expect(gameCreatedEvent).toBeDefined();
      expect(gameCreatedEvent).toContain('event GameCreated');
      expect(gameCreatedEvent).toContain('address indexed gameAddress');
    });

    test('has correct number of ABI entries', () => {
      expect(FACTORY_ABI).toHaveLength(2); // createGame function + GameCreated event
    });

    test('all ABI entries are valid strings', () => {
      FACTORY_ABI.forEach(entry => {
        expect(typeof entry).toBe('string');
        expect(entry.length).toBeGreaterThan(0);
      });
    });

    test('function signature includes return type', () => {
      const createGameFunction = FACTORY_ABI.find(
        item => typeof item === 'string' && item.includes('createGame')
      );
      expect(createGameFunction).toContain('returns (address)');
    });
  });

  describe('GAME_ABI', () => {
    test('is defined and is an array', () => {
      expect(GAME_ABI).toBeDefined();
      expect(Array.isArray(GAME_ABI)).toBe(true);
      expect(GAME_ABI.length).toBeGreaterThan(0);
    });

    test('contains makeMove function signature', () => {
      const makeMoveFunction = GAME_ABI.find(
        item => typeof item === 'string' && item.includes('makeMove')
      );
      expect(makeMoveFunction).toBeDefined();
      expect(makeMoveFunction).toContain('function makeMove(uint8 row, uint8 col)');
    });

    test('contains getBoardState function signature', () => {
      const getBoardStateFunction = GAME_ABI.find(
        item => typeof item === 'string' && item.includes('getBoardState')
      );
      expect(getBoardStateFunction).toBeDefined();
      expect(getBoardStateFunction).toContain('view');
      expect(getBoardStateFunction).toContain('returns (address[3][3])');
    });

    test('contains game state functions', () => {
      const requiredFunctions = ['lastPlayer', 'winner', 'gameEnded'];
      requiredFunctions.forEach(funcName => {
        const func = GAME_ABI.find(
          item => typeof item === 'string' && item.includes(funcName)
        );
        expect(func).toBeDefined();
        expect(func).toContain('view');
      });
    });

    test('has correct number of ABI entries', () => {
      expect(GAME_ABI).toHaveLength(5); // makeMove, getBoardState, gameEnded, winner, lastPlayer
    });

    test('all ABI entries are valid strings', () => {
      GAME_ABI.forEach(entry => {
        expect(typeof entry).toBe('string');
        expect(entry.length).toBeGreaterThan(0);
      });
    });

    test('view functions are properly marked', () => {
      const viewFunctions = GAME_ABI.filter(
        item => typeof item === 'string' && item.includes('view')
      );
      
      const expectedViewFunctions = [
        'getBoardState', 'lastPlayer', 'winner', 'gameEnded'
      ];
      
      expectedViewFunctions.forEach(funcName => {
        const func = viewFunctions.find(f => f.includes(funcName));
        expect(func).toBeDefined();
      });
    });

    test('makeMove function is non-payable (no view modifier)', () => {
      const makeMove = GAME_ABI.find(
        item => typeof item === 'string' && item.includes('makeMove')
      );
      expect(makeMove).toBeDefined();
      expect(makeMove).not.toContain('view');
      expect(makeMove).not.toContain('payable');
    });
  });

  describe('ABI Compatibility', () => {
    test('ABIs are valid JSON-serializable objects', () => {
      expect(() => JSON.stringify(FACTORY_ABI)).not.toThrow();
      expect(() => JSON.stringify(GAME_ABI)).not.toThrow();
    });

    test('ABIs contain expected interface elements', () => {
      const factoryFunctions = FACTORY_ABI.filter(item => item.includes('function'));
      const factoryEvents = FACTORY_ABI.filter(item => item.includes('event'));
      const gameFunctions = GAME_ABI.filter(item => item.includes('function'));
      
      expect(factoryFunctions.length).toBeGreaterThan(0);
      expect(factoryEvents.length).toBeGreaterThan(0);
      expect(gameFunctions.length).toBeGreaterThan(0);
    });

    test('function signatures have valid Solidity types', () => {
      const allABIs = [...FACTORY_ABI, ...GAME_ABI];
      const functions = allABIs.filter(item => item.includes('function'));
      
      functions.forEach(func => {
        // Should contain valid Solidity types
        expect(func).toMatch(/function\s+\w+\s*\(/); // function name(
        if (func.includes('returns')) {
          expect(func).toMatch(/returns\s*\(/); // returns (
        }
      });
    });

    test('events have proper indexed parameters', () => {
      const allEvents = [...FACTORY_ABI, ...GAME_ABI].filter(
        item => item.includes('event')
      );
      
      allEvents.forEach(event => {
        // Should contain event keyword and valid structure
        expect(event).toMatch(/event\s+\w+\s*\(/); // event EventName(
        if (event.includes('indexed')) {
          expect(event).toMatch(/\w+\s+indexed\s+\w+/); // type indexed paramName
        }
      });
    });
  });

  describe('Smart Contract Integration', () => {
    test('Factory ABI supports game creation workflow', () => {
      const createGame = FACTORY_ABI.find(
        item => item.includes('createGame')
      );
      const gameCreated = FACTORY_ABI.find(
        item => item.includes('GameCreated')
      );
      
      expect(createGame).toBeDefined();
      expect(gameCreated).toBeDefined();
      
      // Should return address of created game
      expect(createGame).toContain('returns (address)');
      // Event should emit the game address
      expect(gameCreated).toContain('address indexed gameAddress');
    });

    test('Game ABI supports complete game flow', () => {
      const makeMove = GAME_ABI.find(
        item => item.includes('makeMove')
      );
      const getBoardState = GAME_ABI.find(
        item => item.includes('getBoardState')
      );
      const gameEnded = GAME_ABI.find(
        item => item.includes('gameEnded')
      );
      
      expect(makeMove).toBeDefined();
      expect(getBoardState).toBeDefined();
      expect(gameEnded).toBeDefined();
      
      // makeMove should accept row and col
      expect(makeMove).toContain('uint8 row');
      expect(makeMove).toContain('uint8 col');
      
      // getBoardState should return 2D array of addresses
      expect(getBoardState).toContain('returns (address[3][3])');
      
      // gameEnded should return boolean
      expect(gameEnded).toContain('returns (bool)');
    });

    test('ABI format is compatible with ethers.js', () => {
      // Human-readable ABI format should be compatible with ethers.js
      const allABIs = [...FACTORY_ABI, ...GAME_ABI];
      allABIs.forEach(abi => {
        expect(typeof abi).toBe('string');
        expect(abi).toMatch(/^(function|event|constructor)\s/);
      });
    });
  });
});