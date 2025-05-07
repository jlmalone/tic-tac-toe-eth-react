// src/components/InstructionsModal.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface InstructionsModalProps {
    onClose: () => void;
}

const markdown = `
# Tic-Tac-Toe
## ❔ How to Play Tic-Tac-Toe on the Blockchain

This is a decentralized version of Tic-Tac-Toe built on the Ethereum Sepolia testnet. Each game is deployed as a smart contract and lives permanently on the blockchain.

## ✅ Steps to Get Started

1. **Install MetaMask** if you haven't already. It's required to interact with Ethereum-based apps.  
   👉 [https://metamask.io](https://metamask.io)

2. **Get Sepolia Testnet ETH**  
   Visit a faucet like:  
   👉 [https://cloud.google.com/application/web3/faucet/ethereum/sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

3. **Connect your wallet** by clicking the **Connect Wallet** button in the app.

4. **Create or Join a Game**  
   - Click **Create Game** to deploy a new game contract  
   - Or paste in a contract address and click **Join Game**

5. **Make Your Move**  
   - Use the input fields to choose a row and column  
   - Moves are executed as Ethereum transactions and confirmed on‑chain

6. **Victory**  
   - Once a player wins or all cells are filled, the game ends.  
   - You can refresh the board or start a new game at any time.

## 💡 Tips

- Use MetaMask on desktop for best results.  
- Each action (creating, joining, moving) is an Ethereum transaction.  
- You can play with anyone else using the same contract address.

## Resources

- Source Code: [https://github.com/jlmalone/tic-tac-toe-eth-react/](https://github.com/jlmalone/tic-tac-toe-eth-react))


Happy hacking 🤖
`;

const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
        <div className="flex flex-col bg-black border border-[#00cc66] rounded-lg shadow-[0_0_10px_#00cc66] w-full max-w-2xl max-h-[80vh]">

            {/* Scrollable markdown area */}
            <div className="overflow-y-auto p-6 prose prose-invert prose-lg text-[#00cc66]">
                <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>

            {/* Footer with always‑visible Close */}
            <div className="p-4 bg-black border-t border-[#00cc66] flex justify-end">
                <button
                    onClick={onClose}
                    className="text-sm border border-[#00cc66] px-4 py-2 rounded hover:bg-[#00cc66] hover:text-black transition"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
);

export default InstructionsModal;
