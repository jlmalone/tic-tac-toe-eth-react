// src/services/index.ts
import EthereumService from './ethereumService';
import SolanaService from './solanaService';
import { IBlockchainService } from './blockchainServiceTypes';
import { WalletContextState } from '@solana/wallet-adapter-react';

export type BlockchainType = 'ethereum' | 'solana';

let ethServiceInstance: EthereumService | null = null;
let solServiceInstance: SolanaService | null = null;

export const getBlockchainService = (
    type: BlockchainType,
    solanaWalletContext?: WalletContextState // Required only for Solana initialization
): IBlockchainService => {
    if (type === 'ethereum') {
        if (!ethServiceInstance) {
            ethServiceInstance = new EthereumService();
        }
        return ethServiceInstance;
    } else if (type === 'solana') {
        if (!solanaWalletContext) {
            throw new Error("SolanaWalletContext is required to initialize SolanaService.");
        }
        if (!solServiceInstance) {
            solServiceInstance = new SolanaService(solanaWalletContext);
        } else {
            // Ensure the service always has the latest wallet context
            solServiceInstance.updateWalletState(solanaWalletContext);
        }
        return solServiceInstance;
    }
    throw new Error('Unsupported blockchain type');
};