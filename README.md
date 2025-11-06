# 🧠 Tic-Tac-Toe Multi-Chain React DApp

A fully decentralized, multi-chain multiplayer Tic-Tac-Toe game supporting both **Ethereum** (Sepolia testnet) and **Solana** (Devnet). Built with React 19, TypeScript, and TailwindCSS featuring a Matrix-inspired hacker aesthetic.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://jlmalone.github.io/tic-tac-toe-eth-react/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
  - [Running Tests](#running-tests)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Supported Networks](#supported-networks)
- [Smart Contracts](#smart-contracts)
- [Example Game Flow](#example-game-flow)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

---

## 🎯 Overview

This project demonstrates a truly decentralized Tic-Tac-Toe game where:
- **Game state is stored entirely on-chain** (no centralized servers)
- **Each game is an independent smart contract/program**
- **Supports multiple blockchains** through a unified abstraction layer
- **Players interact directly with blockchain** using their wallets
- **All moves are immutable transactions** recorded on-chain

The project showcases modern web3 development practices including:
- Service abstraction pattern for multi-chain support
- Wallet adapter integration (MetaMask, Phantom, Solflare)
- Type-safe blockchain interactions with TypeScript
- Responsive UI with Tailwind CSS
- Error boundaries and comprehensive error handling

---

## ✨ Features

### Core Features
- 🎮 **Multi-Chain Support**: Switch seamlessly between Ethereum and Solana
- 🔗 **Fully On-Chain**: All game logic, moves, and state stored on blockchain
- 🦊 **Wallet Integration**: MetaMask (Ethereum), Phantom & Solflare (Solana)
- 🎨 **Matrix Theme**: Retro hacker aesthetic with glowing green effects
- 👤 **Emoji Avatars**: Consistent hash-based emoji representation for addresses
- 📊 **Game History**: View all your past games and results
- 📖 **Instructions**: Built-in guides for both Ethereum and Solana

### Technical Features
- ⚡ **React 19** with TypeScript and strict mode
- 🎨 **Tailwind CSS** for responsive, utility-first styling
- 🔄 **Real-time Updates**: Board state fetched directly from blockchain
- 🛡️ **Error Boundaries**: Graceful error handling and recovery
- 📝 **Comprehensive Documentation**: JSDoc comments throughout codebase
- ✅ **Type Safety**: Full TypeScript coverage with strict checking
- 🧪 **Testing Infrastructure**: Jest + React Testing Library setup

---

## 🌐 Live Demo

**Play now:** [https://jlmalone.github.io/tic-tac-toe-eth-react/](https://jlmalone.github.io/tic-tac-toe-eth-react/)

### Quick Start:
1. Install [MetaMask](https://metamask.io/) (for Ethereum) or [Phantom](https://phantom.app/) (for Solana)
2. Get testnet funds:
   - Ethereum: [Sepolia Faucet](https://sepoliafaucet.com/)
   - Solana: [Solana Devnet Faucet](https://faucet.solana.com/)
3. Select your blockchain and connect wallet
4. Create or join a game
5. Make moves and enjoy!

---

## ⚙️ Tech Stack

### Frontend
- **React** 19.1.0 - Modern UI library with latest features
- **TypeScript** 4.9.5 - Type-safe development
- **Tailwind CSS** 3.3.0 - Utility-first CSS framework
- **React Testing Library** - Component testing

### Ethereum Integration
- **ethers.js** 6.13.7 - Ethereum wallet & contract interaction
- **Network:** Sepolia Testnet (Chain ID: 11155111)
- **Smart Contracts:** Solidity-based Factory + Game contracts

### Solana Integration
- **@coral-xyz/anchor** 0.31.1 - Solana framework
- **@solana/web3.js** 1.98.2 - Solana blockchain interaction
- **@solana/wallet-adapter-react** 0.15.35 - Wallet integration
- **Network:** Devnet
- **Smart Contracts:** Anchor/Rust-based programs

### Build Tools
- **react-app-rewired** - Custom webpack configuration
- **PostCSS** + **Autoprefixer** - CSS processing
- **Node.js polyfills** - Browser compatibility for Web3 dependencies

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** ≥ 16.x (v18+ recommended)
- **npm** or **yarn** package manager
- **Git** for version control

For Ethereum development:
- [MetaMask](https://metamask.io/) browser extension
- Sepolia testnet ETH ([get from faucet](https://sepoliafaucet.com/))

For Solana development:
- [Phantom](https://phantom.app/) or [Solflare](https://solflare.com/) wallet
- Solana Devnet SOL ([get from faucet](https://faucet.solana.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jlmalone/tic-tac-toe-eth-react.git
   cd tic-tac-toe-eth-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Optional: Configure Solana RPC endpoint**

   Create a `.env` file in the project root (optional):
   ```bash
   REACT_APP_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
   ```

### Running Locally

Start the development server:

```bash
npm start
# or
yarn start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Running Tests

```bash
npm test
# or
yarn test
```

For coverage report:
```bash
npm test -- --coverage
```

---

## 🏗️ Architecture

### Service Abstraction Pattern

The project uses a **blockchain-agnostic service layer** that abstracts away chain-specific implementation details:

```
┌─────────────────────────────────────────────────────┐
│              React UI (App.tsx)                     │
│  - State Management                                 │
│  - User Interactions                                │
│  - Board Rendering                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│         IBlockchainService (Interface)               │
│  - connectWallet()                                   │
│  - createGame() / joinGame()                         │
│  - makeMove(row, col)                                │
│  - getBoardState()                                   │
└────────────┬─────────────────────┬───────────────────┘
             │                     │
    ┌────────▼────────┐   ┌────────▼────────┐
    │ EthereumService │   │  SolanaService  │
    │  ethers.js v6   │   │ Anchor Framework│
    └────────┬────────┘   └────────┬────────┘
             │                     │
    ┌────────▼────────┐   ┌────────▼────────┐
    │  Ethereum       │   │  Solana         │
    │  Sepolia        │   │  Devnet         │
    │  Testnet        │   │                 │
    └─────────────────┘   └─────────────────┘
```

### Key Design Decisions

1. **Single Interface, Multiple Implementations**: `IBlockchainService` defines common operations (connect, create game, make move) that both Ethereum and Solana services implement.

2. **Factory Pattern**: `getBlockchainService(type)` returns the appropriate service instance based on selected blockchain.

3. **Emoji Avatars**: Uses keccak256 hashing to generate consistent, user-friendly emoji representations of addresses.

4. **Error Boundaries**: React Error Boundary component catches and displays errors gracefully without crashing the entire app.

5. **Component Separation**: Modal components (Stats, Instructions) keep the main App component focused on game logic.

---

## 🧠 How It Works

### Ethereum Flow

1. **Factory Contract** deploys individual game contracts
2. **Game Contract** manages board state, turn logic, and win conditions
3. **Moves** submitted as transactions with `makeMove(row, col)`
4. **Board State** fetched via `getBoardState()` returning 3x3 address array
5. **Zero Address** (`0x000...000`) represents empty cells

### Solana Flow

1. **Program** deployed on Solana (Rust/Anchor)
2. **Game Accounts** created with unique keypairs
3. **Instructions** sent to program for `initialize()` and `make_move()`
4. **Board State** stored in on-chain account data structure
5. **System Program ID** used as placeholder for empty cells

### Multi-Chain Abstraction

Both implementations expose identical interfaces:
```typescript
interface IBlockchainService {
  connectWallet(): Promise<string>;
  createGame(): Promise<string>;
  joinGame(gameId: string): Promise<void>;
  makeMove(row: number, col: number): Promise<void>;
  getBoardState(gameId?: string): Promise<BoardState>;
  isGameEnded(gameId?: string): Promise<boolean>;
  getWinner(gameId?: string): Promise<string>;
  // ... utility methods
}
```

This allows the UI to work identically regardless of the underlying blockchain.

---

## 📁 Project Structure

```
tic-tac-toe-eth-react/
├── public/                      # Static assets
│   ├── index.html               # HTML entry point
│   ├── manifest.json            # PWA manifest
│   └── *.png                    # UI assets (icons, logos)
│
├── src/
│   ├── App.tsx                  # Main application component (450 lines)
│   ├── index.tsx                # React DOM entry + providers
│   ├── App.css                  # Additional styles
│   ├── index.css                # Global styles + Tailwind directives
│   │
│   ├── components/              # React UI components
│   │   ├── ErrorBoundary.tsx    # Error boundary for crash recovery
│   │   ├── StatsModal.tsx       # Game history viewer
│   │   ├── InstructionsModal.tsx # How-to-play guide
│   │   ├── MatrixLoader.tsx     # Matrix-style loading animation
│   │   └── SegmentedDialLoader.tsx # Circular progress loader
│   │
│   ├── contracts/               # Ethereum contract interfaces
│   │   ├── abis.ts              # Factory & Game ABIs
│   │   └── addresses.ts         # Contract addresses & chain config
│   │
│   ├── services/                # Blockchain abstraction layer
│   │   ├── blockchainServiceTypes.ts  # IBlockchainService interface
│   │   ├── ethereumService.ts         # Ethereum implementation
│   │   ├── solanaService.ts           # Solana implementation
│   │   ├── index.ts                   # Service factory
│   │   └── idl/
│   │       └── tic_tac_toe_sol.json   # Solana program IDL
│   │
│   ├── utils/
│   │   └── helpers.ts           # Utility functions (emoji, shorten address)
│   │
│   ├── target/
│   │   └── types/tic_tac_toe_sol.ts   # Generated Anchor TypeScript types
│   │
│   ├── types/
│   │   └── window.d.ts          # Window.ethereum type definitions
│   │
│   ├── solanaConfig.ts          # Solana network configuration
│   ├── SolanaWalletProviderWrapper.tsx  # Solana wallet adapter setup
│   ├── App.test.tsx             # Test suite
│   └── setupTests.ts            # Jest configuration
│
├── config-overrides.js          # Webpack overrides (Node.js polyfills)
├── tailwind.config.js           # Tailwind theme customization
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # TypeScript compiler options
├── package.json                 # Dependencies & scripts
└── README.md                    # This file
```

---

## 🌐 Supported Networks

### Ethereum

- **Network:** Sepolia Testnet
- **Chain ID:** 11155111
- **Explorer:** [https://sepolia.etherscan.io](https://sepolia.etherscan.io)
- **Faucet:** [https://sepoliafaucet.com](https://sepoliafaucet.com)
- **Factory Contract:** `0xa0B53DbDb0052403E38BBC31f01367aC6782118E`

### Solana

- **Network:** Devnet
- **Identifier:** `"devnet"`
- **Explorer:** [https://explorer.solana.com/?cluster=devnet](https://explorer.solana.com/?cluster=devnet)
- **Faucet:** [https://faucet.solana.com](https://faucet.solana.com)
- **Program ID:** `C18ERJ5zzEm5sanmVq5TELPg3KRe1ZB2Bsjf6GKNEaKx`

---

## 🔒 Smart Contracts

### Ethereum Contracts

Located in separate repository (Solidity source code not included here):

**Factory Contract:**
- `createGame()` - Deploys new game contract
- Emits `GameCreated(address indexed gameAddress)` event

**Game Contract:**
- `makeMove(uint8 row, uint8 col)` - Submit player move
- `getBoardState()` - Returns 3x3 address array
- `gameEnded()` - Check if game is complete
- `winner()` - Get winner address (or zero address for draw)
- `lastPlayer()` - Get last player who moved

### Solana Program

Anchor-based Rust program (source code in separate repository):

**Instructions:**
- `initialize()` - Create new game account
- `make_move(row: u8, col: u8)` - Submit player move

**Game Account:**
```rust
pub struct Game {
    pub board: [Pubkey; 9],      // 3x3 grid of player public keys
    pub game_ended: bool,         // Game completion flag
    pub winner: Pubkey,           // Winner's public key
    pub last_player: Pubkey,      // Last player who moved
}
```

---

## 🧪 Example Game Flow

### Creating a Game

```
1. User clicks "Create Game" button
   ↓
2. App calls blockchainService.createGame()
   ↓
3. Blockchain-specific implementation:
   - Ethereum: Factory deploys new game contract
   - Solana: Program creates new game account with keypair
   ↓
4. Service returns new game address/pubkey
   ↓
5. App updates UI with game address and empty board
```

### Making a Move

```
1. User enters row/col (0-2) and clicks "Make Move"
   ↓
2. App validates input and checks cell is empty
   ↓
3. App calls blockchainService.makeMove(row, col)
   ↓
4. Blockchain transaction/instruction submitted
   ↓
5. Wait for confirmation
   ↓
6. App calls getBoardState() to refresh board
   ↓
7. Check isGameEnded() and getWinner()
   ↓
8. Update UI with new board state and game status
```

---

## 👨‍💻 Development

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** with React/Jest configurations
- **Prettier** (recommended for formatting)
- **JSDoc comments** for public APIs

### Key Files to Understand

1. **src/services/blockchainServiceTypes.ts** - Service interface definition
2. **src/services/index.ts** - Service factory and singleton management
3. **src/services/ethereumService.ts** - Ethereum implementation
4. **src/services/solanaService.ts** - Solana implementation
5. **src/App.tsx** - Main UI and game state management

### Adding a New Blockchain

To add support for a new blockchain:

1. Create new service implementing `IBlockchainService`
2. Add blockchain type to `BlockchainType` union in `services/index.ts`
3. Update `getBlockchainService()` factory function
4. Add UI toggle button in `App.tsx`
5. Add configuration file similar to `solanaConfig.ts`

---

## 📦 Deployment

### GitHub Pages

This project is configured for GitHub Pages deployment:

```bash
npm run build        # Build production bundle
npm run deploy       # Deploy to gh-pages branch
```

The `predeploy` script automatically builds before deployment.

### Custom Domain

Update `homepage` in `package.json`:
```json
{
  "homepage": "https://yourdomain.com"
}
```

### Environment Variables

For production, set:
- `REACT_APP_SOLANA_RPC_ENDPOINT` - Custom Solana RPC endpoint (optional)

---

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

1. Read the code review findings in git commit history
2. Follow TypeScript strict mode conventions
3. Add tests for new features
4. Update documentation as needed
5. Ensure `npm test` passes

---

## 💡 Future Enhancements

Potential improvements and features:

- ✅ ~~Multi-chain support (Ethereum + Solana)~~ **COMPLETED**
- ✅ ~~Error boundaries for crash recovery~~ **COMPLETED**
- ✅ ~~Comprehensive JSDoc documentation~~ **COMPLETED**
- 🔄 Additional blockchain support (Polygon, Arbitrum, etc.)
- 🎨 ENS / SNS name resolution for addresses
- 🖼️ NFT avatars instead of emojis
- 📜 Detailed move history timeline
- 🏆 Leaderboard and statistics tracking
- 🎮 AI opponent mode
- 📱 Progressive Web App (PWA) features
- 🌍 Internationalization (i18n)

---

## 🧠 Credits

**Built by:** [@jlmalone](https://github.com/jlmalone)

**Purpose:** Exploration of decentralized multiplayer game logic, blockchain abstraction patterns, and modern web3 UX/UI design.

**Special Thanks:**
- Ethereum and Solana developer communities
- Anchor framework contributors
- React and TypeScript teams

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/jlmalone/tic-tac-toe-eth-react/issues)
- **Discussions:** [GitHub Discussions](https://github.com/jlmalone/tic-tac-toe-eth-react/discussions)

---

**Made with ❤️ and ☕ for the decentralized web**
