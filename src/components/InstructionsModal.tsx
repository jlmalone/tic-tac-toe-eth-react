// src/components/InstructionsModal.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface InstructionsModalProps {
    onClose: () => void;
}

const markdown = `
# ***Tic-Tac-Toe***
&nbsp;
# ❔ How to Play Tic-Tac-Toe on the Blockchain
&nbsp;
This is a decentralized version of Tic-Tac-Toe built on the Ethereum Sepolia testnet. Each game is deployed as a smart contract and lives permanently on the blockchain.
&nbsp;
## ✅ Steps to Get Started
&nbsp;
1. **Install MetaMask** if you haven't already. It's required to interact with Ethereum-based apps.  
   👉 [https://metamask.io](https://metamask.io)
&nbsp;
2. **Get Sepolia Testnet ETH**  
   Visit a faucet like:  
   👉 [https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
&nbsp;
3. **Connect your wallet** by clicking the **Connect Wallet** button in the app.
&nbsp;
4. **Create or Join a Game**  
   - Click **Create Game** to deploy a new game contract  
   - Or paste in a contract address and click **Join Game**
&nbsp;
5. **Make Your Move**  
   - Use the input fields to choose a row and column  
   - Moves are executed as Ethereum transactions and confirmed on‑chain
&nbsp;
6. **Victory**  
   - Once a player wins or all cells are filled, the game ends.  
   - You can refresh the board or start a new game at any time.
&nbsp;
## 💡 Tips
&nbsp;
- Use MetaMask on desktop for best results.  
- Each action (creating, joining, moving) is an Ethereum transaction.  
- You can play with anyone else using the same contract address.
&nbsp;
Happy hacking 🤖
`;

const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 text-[#00cc66] p-4 z-50 overflow-y-auto font-mono">
        <div
            className="
      max-w-2xl mx-auto
      bg-black border border-[#00cc66]
      p-4 rounded-lg
      shadow-[0_0_10px_#00cc66]
      max-h-[80vh]
      overflow-y-auto
    "
        >
            <div className="prose prose-invert text-[#00cc66] max-w-none">
                <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>

            <button
                onClick={onClose}
                className="mt-4 border border-[#00cc66] px-3 py-1 rounded hover:bg-[#00cc66] hover:text-black transition"
            >
                Close
            </button>
        </div>
    </div>
);

export default InstructionsModal;
