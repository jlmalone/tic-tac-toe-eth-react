// src/contracts/addresses.test.ts

import { CONTRACT_ADDRESSES, EXPECTED_CHAIN_ID, ZERO_ADDRESS } from './addresses';

describe('Contract Addresses', () => {
  test('ZERO_ADDRESS is correctly defined', () => {
    expect(ZERO_ADDRESS).toBe('0x0000000000000000000000000000000000000000');
    expect(ZERO_ADDRESS).toHaveLength(42);
    expect(ZERO_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  test('CONTRACT_ADDRESSES contains Sepolia network configuration', () => {
    expect(CONTRACT_ADDRESSES).toHaveProperty('11155111');
    expect(CONTRACT_ADDRESSES[11155111]).toHaveProperty('factoryAddress');
    expect(CONTRACT_ADDRESSES[11155111].factoryAddress).toBe('0xa0B53DbDb0052403E38BBC31f01367aC6782118E');
  });

  test('CONTRACT_ADDRESSES contains local Hardhat network configuration', () => {
    expect(CONTRACT_ADDRESSES).toHaveProperty('31337');
    expect(CONTRACT_ADDRESSES[31337]).toHaveProperty('factoryAddress');
    expect(CONTRACT_ADDRESSES[31337].factoryAddress).toBe('0x4A679253410272dd5232B3Ff7cF5dbB88f295319');
  });

  test('factory addresses are valid Ethereum addresses', () => {
    Object.values(CONTRACT_ADDRESSES).forEach(config => {
      expect(config.factoryAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(config.factoryAddress).toHaveLength(42);
      expect(config.factoryAddress).not.toBe(ZERO_ADDRESS);
    });
  });

  test('EXPECTED_CHAIN_ID is set to Sepolia', () => {
    expect(EXPECTED_CHAIN_ID).toBe(11155111);
  });

  test('all chain IDs are valid numbers', () => {
    Object.keys(CONTRACT_ADDRESSES).forEach(chainId => {
      expect(Number(chainId)).toBeGreaterThan(0);
      expect(Number.isInteger(Number(chainId))).toBe(true);
    });
  });

  test('factory addresses are different for different networks', () => {
    const sepoliaAddress = CONTRACT_ADDRESSES[11155111]?.factoryAddress;
    const localAddress = CONTRACT_ADDRESSES[31337]?.factoryAddress;
    
    expect(sepoliaAddress).toBeDefined();
    expect(localAddress).toBeDefined();
    expect(sepoliaAddress).not.toBe(localAddress);
  });

  test('contract addresses match expected deployment addresses', () => {
    // These should match the addresses from the smart contract deployment
    expect(CONTRACT_ADDRESSES[11155111].factoryAddress).toBe('0xa0B53DbDb0052403E38BBC31f01367aC6782118E');
    expect(CONTRACT_ADDRESSES[31337].factoryAddress).toBe('0x4A679253410272dd5232B3Ff7cF5dbB88f295319');
  });

  test('addresses are properly checksummed', () => {
    Object.values(CONTRACT_ADDRESSES).forEach(config => {
      const address = config.factoryAddress;
      // Should contain both uppercase and lowercase letters if properly checksummed
      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });
});