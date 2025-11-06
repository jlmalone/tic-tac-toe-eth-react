// src/App.test.tsx
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import App from './App';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

// Mock window.ethereum for MetaMask
const mockEthereum = {
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

(window as any).ethereum = mockEthereum;

// Wrapper component with Solana wallet provider
const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wallets = useMemo(() => [], []);

  return (
    <WalletProvider wallets={wallets} autoConnect={false}>
      {children}
    </WalletProvider>
  );
};

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the main title', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );
      expect(screen.getByText('Tic‑Tac‑Toe')).toBeInTheDocument();
    });

    it('should render blockchain selector buttons', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('Solana')).toBeInTheDocument();
    });

    it('should have Ethereum selected by default', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );
      const ethereumButton = screen.getByText('Ethereum');
      expect(ethereumButton).toHaveClass('bg-[#00cc66]');
      expect(ethereumButton).toHaveClass('text-black');
    });

    it('should display initial status message', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );
      // The status text may vary, but should exist
      const statusElements = screen.queryAllByText(/blockchain|wallet|connect/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('UI Elements', () => {
    it('should render stats button', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );
      const statsButton = screen.getByTitle('View Stats');
      expect(statsButton).toBeInTheDocument();
    });

    it('should render instructions button', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );
      const instructionsButton = screen.getByTitle('How to Play');
      expect(instructionsButton).toBeInTheDocument();
      expect(instructionsButton).toHaveTextContent('?');
    });

    it('should render connect wallet button for Ethereum initially', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );
      expect(screen.getByText('Connect Ethereum Wallet')).toBeInTheDocument();
    });

    it('should have matrix-themed styling', () => {
      const { container } = render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Check for black background
      const mainDiv = container.querySelector('.bg-black');
      expect(mainDiv).toBeInTheDocument();

      // Check for green text color
      const greenText = container.querySelector('.text-\\[\\#00cc66\\]');
      expect(greenText).toBeInTheDocument();
    });
  });

  describe('Wallet Connection UI', () => {
    it('should display wallet connection area', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // The connection area exists with min-height
      const connectionArea = document.querySelector('.min-h-\\[76px\\]');
      expect(connectionArea).toBeInTheDocument();
    });

    it('should not display game controls before wallet connection', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Should not show game controls like "Create Game"
      expect(screen.queryByText('Create Game')).not.toBeInTheDocument();
    });

    it('should not display game board initially', () => {
      const { container } = render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Game board has a 3x3 grid
      const gameBoard = container.querySelector('.grid-cols-3');
      expect(gameBoard).not.toBeInTheDocument();
    });
  });

  describe('Blockchain Selector', () => {
    it('should render both blockchain options as buttons', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      const ethereumBtn = screen.getByRole('button', { name: /ethereum/i });
      const solanaBtn = screen.getByRole('button', { name: /solana/i });

      expect(ethereumBtn).toBeInTheDocument();
      expect(solanaBtn).toBeInTheDocument();
    });

    it('should apply correct styles to selected blockchain', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      const ethereumBtn = screen.getByText('Ethereum');
      // Selected button has green background
      expect(ethereumBtn.className).toContain('bg-[#00cc66]');
      expect(ethereumBtn.className).toContain('text-black');
    });

    it('should apply correct styles to unselected blockchain', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      const solanaBtn = screen.getByText('Solana');
      // Unselected button has border but no background fill
      expect(solanaBtn.className).toContain('border-[#00cc66]');
      expect(solanaBtn.className).toContain('text-[#00cc66]');
    });
  });

  describe('Accessibility', () => {
    it('should have title attributes on icon buttons', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      const statsButton = screen.getByTitle('View Stats');
      const helpButton = screen.getByTitle('How to Play');

      expect(statsButton).toBeInTheDocument();
      expect(helpButton).toBeInTheDocument();
    });

    it('should have descriptive button text', () => {
      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Buttons should have clear, descriptive text
      expect(screen.getByText('Connect Ethereum Wallet')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('Solana')).toBeInTheDocument();
    });
  });

  describe('Status Messages', () => {
    it('should display status text area', () => {
      const { container } = render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Status area has min-height class
      const statusArea = container.querySelector('.min-h-\\[20px\\]');
      expect(statusArea).toBeInTheDocument();
    });

    it('should have status text styling', () => {
      const { container } = render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Status text is centered and has text-sm class
      const statusArea = container.querySelector('.text-center.text-sm');
      expect(statusArea).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should have centered layout', () => {
      const { container } = render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      const mainContainer = container.querySelector('.flex.items-center.justify-center');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have proper border and shadow styling', () => {
      const { container } = render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      const card = container.querySelector('.border.border-\\[\\#00cc66\\]');
      expect(card).toBeInTheDocument();
    });

    it('should be responsive with max-width', () => {
      const { container } = render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      const card = container.querySelector('.max-w-sm');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should not crash when rendering', () => {
      expect(() => {
        render(
          <AppWrapper>
            <App />
          </AppWrapper>
        );
      }).not.toThrow();
    });

    it('should handle missing window.ethereum gracefully', () => {
      const originalEthereum = (window as any).ethereum;
      delete (window as any).ethereum;

      expect(() => {
        render(
          <AppWrapper>
            <App />
          </AppWrapper>
        );
      }).not.toThrow();

      (window as any).ethereum = originalEthereum;
    });
  });
});
