import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import SolanaWalletProviderWrapper from './SolanaWalletProviderWrapper'; // Import the wrapper
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <SolanaWalletProviderWrapper> {/* Wrap App with Solana providers */}
                <App />
            </SolanaWalletProviderWrapper>
        </ErrorBoundary>
    </React.StrictMode>
);