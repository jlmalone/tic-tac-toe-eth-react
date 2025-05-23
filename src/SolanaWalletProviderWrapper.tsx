// src/SolanaWalletProviderWrapper.tsx
import React, { FC, useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    // Add other wallets you want to support: LedgerWalletAdapter, TorusWalletAdapter, etc.
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SOLANA_RPC_ENDPOINT, SOLANA_NETWORK_NAME } from './solanaConfig';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

interface SolanaWalletProviderWrapperProps {
    children: ReactNode;
}

const SolanaWalletProviderWrapper: FC<SolanaWalletProviderWrapperProps> = ({ children }) => {
    const network = SOLANA_NETWORK_NAME as WalletAdapterNetwork; // e.g., WalletAdapterNetwork.Devnet
    const endpoint = useMemo(() => SOLANA_RPC_ENDPOINT, []);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            // Add other wallet adapters here if desired
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default SolanaWalletProviderWrapper;