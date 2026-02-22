import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the complex modules to avoid import issues in tests
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

jest.mock('remark-gfm', () => {
  return {};
});

jest.mock('./services/index', () => ({
  BlockchainType: {
    ETHEREUM: 'ethereum',
    SOLANA: 'solana',
  },
  EthereumService: class MockEthereumService {},
  SolanaService: class MockSolanaService {},
  getBlockchainService: jest.fn().mockReturnValue({
    getZeroAddress: () => '0x0000000000000000000000000000000000000000',
    getNetworkIdentifier: () => 'ethereum',
    isValidAddress: () => true,
    getGameAddress: () => '',
    connectWallet: jest.fn(),
    createGame: jest.fn(),
    makeMove: jest.fn(),
    getBoardState: jest.fn(),
    getGameStatus: jest.fn(),
  }),
}));

jest.mock('./SolanaWalletProviderWrapper', () => {
  return function MockSolanaWalletProviderWrapper({ children }: { children: React.ReactNode }) {
    return <div data-testid="solana-wallet-provider">{children}</div>;
  };
});

import App from './App';

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  test('renders main title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Tic‑Tac‑Toe/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders blockchain selection buttons', () => {
    render(<App />);
    const buttons = screen.getAllByText(/Ethereum/i);
    expect(buttons.length).toBeGreaterThan(0);
    const solanaButton = screen.getByText(/Solana/i);
    expect(solanaButton).toBeInTheDocument();
  });

  test('renders app components', () => {
    render(<App />);
    // Just verify the app renders without the complex wallet provider test
    expect(screen.getByText(/Tic‑Tac‑Toe/i)).toBeInTheDocument();
  });

  test('renders initial status message', () => {
    render(<App />);
    const statusElement = screen.getByText(/Service for ethereum not ready/i);
    expect(statusElement).toBeInTheDocument();
  });

  test('renders stats and instructions buttons', () => {
    render(<App />);
    const statsButton = screen.getByTitle('View Stats');
    const instructionsButton = screen.getByTitle('How to Play');
    expect(statsButton).toBeInTheDocument();
    expect(instructionsButton).toBeInTheDocument();
  });
});
