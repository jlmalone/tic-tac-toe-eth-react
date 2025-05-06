
import { ethers } from 'ethers';

export async function connectWallet(): Promise<string[]> {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        return accounts;
    } else {
        throw new Error("MetaMask is not installed.");
    }
}