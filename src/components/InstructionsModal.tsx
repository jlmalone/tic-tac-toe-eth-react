// src/components/InstructionsModal.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlockchainType } from '../services/index'; // Corrected import path
import { SOLANA_NETWORK_NAME } from '../solanaConfig';

interface InstructionsModalProps {
    onClose: () => void;
    blockchainType: BlockchainType;
}

const ethMarkdown = `
# Tic-Tac-Toe
## ❔ How to Play Tic-Tac-Toe on the Blockchain (Ethereum)

This is a decentralized version of Tic-Tac-Toe built on the **Ethereum Sepolia testnet**. Each game is deployed as a smart contract and lives permanently on the blockchain.

## ✅ Steps to Get Started

1. **Install MetaMask** if you haven't already. It's required to interact with Ethereum-based apps.
   🦊 [Metamask](https://metamask.io)

2. **Get Sepolia Testnet ETH**
   Visit a faucet like:
   🚰 [Google Crypto Testnet Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

3. **Connect your wallet** by clicking the **Connect Wallet** button in the app (when Ethereum is selected).

4. **Create or Join a Game**
   - Click **Create Game** to deploy a new game contract.
   - Or paste in a contract address and click **Join Game**.

5. **Make Your Move**
   - Use the input fields to choose a row and column.
   - Moves are executed as Ethereum transactions and confirmed on‑chain.

6. **Victory**
   - Once a player wins or all cells are filled, the game ends.
   - You can refresh the board or start a new game at any time.

## 💡 Tips

- Use MetaMask on desktop for best results.
- Each action (creating, joining, moving) is an Ethereum transaction.
- You can play with anyone else using the same contract address.

## 🤖 Resources
- [![GitHub Octocat](octocat.png)](https://github.com/jlmalone/tic-tac-toe-eth-react/) GitHub: [Source Code](https://github.com/jlmalone/tic-tac-toe-eth-react)
`;

const solMarkdownTemplate = (networkName: string) => `
# Tic-Tac-Toe
## ❔ How to Play Tic-Tac-Toe on the Blockchain (Solana)

This is a decentralized version of Tic-Tac-Toe built on the **Solana ${networkName}**. Each game is represented by an on-chain account.

## ✅ Steps to Get Started

1. **Install a Solana Wallet** like Phantom or Solflare.
   👻 [Phantom Wallet](https://phantom.app/)
   ☀️ [Solflare Wallet](https://solflare.com/)

2. **Get ${networkName === 'devnet' ? 'Devnet' : networkName} SOL** (if using devnet/testnet)
   Visit a faucet like:
   🚰 [Solana Faucet](https://solfaucet.com/) (select ${networkName})

3. **Connect your wallet** by clicking the **Connect Wallet / Select Wallet** button in the app (when Solana is selected).

4. **Create or Join a Game**
   - Click **Create Game** to initialize a new game account.
   - Or paste in a game account address (Public Key) and click **Join Game**.

5. **Make Your Move**
   - Use the input fields to choose a row and column.
   - Moves are executed as Solana transactions and confirmed on‑chain.

6. **Victory**
   - Once a player wins or all cells are filled, the game ends.
   - You can refresh the board or start a new game at any time.

## 💡 Tips

- Each action (creating, joining, moving) is a Solana transaction.
- You can play with anyone else using the same game account address.

## 🤖 Resources
- [![GitHub Octocat](octocat.png)](https://github.com/jlmalone/tic-tac-toe-eth-react/) GitHub: [Source Code](https://github.com/jlmalone/tic-tac-toe-eth-react)
`;

const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose, blockchainType }) => {
    const markdownContent = blockchainType === 'ethereum' ? ethMarkdown : solMarkdownTemplate(SOLANA_NETWORK_NAME);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="flex flex-col bg-black border border-[#00cc66] rounded-lg shadow-[0_0_10px_#00cc66] w-full max-w-2xl max-h-[80vh]">
                <div
                    className="
                      overflow-y-auto p-6
                      prose prose-invert prose-lg
                      text-[#00cc66]
                      [&_h1]:text-[#00cc66] [&_h1]:font-bold
                      [&_h2]:text-[#00cc66] [&_h2]:font-semibold
                      [&_h3]:text-[#00cc66]
                      [&_p]:text-[#00cc66]
                      [&_li]:text-[#00cc66]
                      [&_a]:text-[#00cc66] [&_a]:hover:underline
                    "
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            img: ({ node, ...props }) => (
                                <img
                                    alt={props.alt || 'octocat'}
                                    {...props}
                                    className="inline w-9 h-9 filter hover:drop-shadow-[0_0_4px_#00cc66] mr-1"
                                />
                            ),
                            a: ({ node, ...props }) => (
                                <a {...props} /> // Tailwind prose handles link styling
                            ),
                        }}
                    >
                        {markdownContent}
                    </ReactMarkdown>
                </div>

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
};

export default InstructionsModal;