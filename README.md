# 🧠 Tic-Tac-Toe ETH React

A fully decentralized, Ethereum-based multiplayer Tic-Tac-Toe game with a React + TypeScript + TailwindCSS frontend. Connect your MetaMask wallet, start or join a blockchain-backed game, and play with real transaction-based moves stored immutably on-chain.

### ⚙️ Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Blockchain Interaction:** Ethers.js (v6)
- **Smart Contracts:** Solidity (deployed on Sepolia + Hardhat)
- **UI Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library

---

## 🚀 Features

- 🎮 Create or join Tic-Tac-Toe games deployed as individual smart contracts
- 🔗 Fully on-chain game logic (moves, turns, win conditions)
- 🦊 Wallet-based authentication (MetaMask)
- 🧱 Contract interactions powered by `ethers.js`
- 🔎 Address obfuscation via emoji representation
- 🧪 Includes a basic test suite scaffold

---

## 🛠️ Getting Started

### 🔧 Prerequisites

- Node.js ≥ 16.x
- Yarn or npm
- MetaMask installed
- Access to Sepolia ETH (e.g., [via faucet](https://sepoliafaucet.com/))

### 📦 Install dependencies

```bash
npm install
# or
yarn install
```

### 🏗️ Run locally

```bash
npm start
# or
yarn start
```

### 🧪 Run tests

```bash
npm test
```

---

## 🧬 Project Structure

```text
tic-tac-toe-eth-react/
├── public/                 # Static HTML & assets
├── src/
│   ├── App.tsx            # Main game UI and state logic
│   ├── contracts/
│   │   ├── abis.ts        # Factory & Game ABIs
│   │   └── addresses.ts   # Factory addresses & chain config
│   ├── services/
│   │   └── blockchain.ts  # Ethers interaction logic
│   ├── utils/
│   │   └── helpers.ts     # Emoji mapping, address formatting
│   └── index.tsx          # App entry point
├── tailwind.config.js     # Tailwind CSS setup
├── tsconfig.json          # TypeScript compiler settings
├── postcss.config.js      # PostCSS for Tailwind
└── package.json           # Project metadata & scripts
```

---

## 🧠 How It Works

Each game is an independent smart contract deployed via a `TicTacToeFactory`. Moves are submitted on-chain with `makeMove(row, col)`, and board state is fetched in real-time using `getBoardState()`.

### ✅ Chain Supported

- **Sepolia (Testnet)** — `chainId: 11155111`
- **Local Hardhat** — `chainId: 31337` (customizable)

### 🔒 Contracts

You’ll find addresses in:

```ts
// src/contracts/addresses.ts
export const CONTRACT_ADDRESSES = {
  11155111: { factoryAddress: '0xa0B53DbDb0052403E38BBC31f01367aC6782118E' },
  31337:    { factoryAddress: '0xReplaceWithYourLocalFactoryAddress' }
};
```

---

## 🧪 Example Game Flow

1. **Connect Wallet** – MetaMask prompts user to connect.
2. **Create Game** – Deploys new game contract via `factory.createGame()`.
3. **Join Game** – Any player can input the contract address to join.
4. **Make Move** – Submits `makeMove(row, col)` transaction.
5. **View Board** – Fetched from `getBoardState()`.
6. **Game Ends** – Result fetched via `gameEnded()` + `winner()`.

---

## 📸 UI Snapshot (example)

```
🧠   Tic-Tac-Toe on Blockchain
[ Connect Wallet ]

🟦🟩🟥   ← board state shown with emojis
Row: [0]  Col: [2]
[ Make Move ]
```

---

## 💡 Developer Notes

- Built to be integrated later with Kotlin Multiplatform UI (browser/desktop).
- Uses address hashing to assign consistent emoji avatars per user.
- Modular blockchain interface (`services/blockchain.ts`) for flexibility.
- Aggressively reloads on `accountsChanged` and `chainChanged` for MetaMask simplicity.

---

## 🧠 Future Plans

- ✅ Replace `web3j` with full `ethers.js` browser support
- 🌐 Support other chains (Polygon, Arbitrum, etc.)
- 🖼️ Add profile pictures via ENS / NFT avatars
- 📜 Game history with timestamped moves

---

## 🧠 Credits

Built by [@jlmalone](https://github.com/jlmalone) — part of a broader project to explore decentralized multiplayer logic, game state finality, and UI/UX for smart contract-based experiences.

---

## 📄 License

MIT




# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
