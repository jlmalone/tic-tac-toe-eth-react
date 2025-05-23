import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import SolanaWalletProviderWrapper from './SolanaWalletProviderWrapper'; // Import the wrapper

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <SolanaWalletProviderWrapper> {/* Wrap App with Solana providers */}
            <App />
        </SolanaWalletProviderWrapper>
    </React.StrictMode>
);