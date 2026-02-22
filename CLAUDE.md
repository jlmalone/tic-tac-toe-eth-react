# CLAUDE.md — tic-tac-toe-eth-react

> **Flagship** of the Tic-Tac-Toe Blockchain Ecosystem.
> See [ECOSYSTEM.md](ECOSYSTEM.md) for full inventory of all 6 projects.

## Ecosystem Members

| Project | Path | Chain | Status |
|---------|------|-------|--------|
| **tic-tac-toe-eth-react** (this repo) | `~/WebstormProjects/tic-tac-toe-eth-react/` | ETH Sepolia | Live |
| tic-tac-toe-smart-contract | `~/tic-tac-toe-smart-contract/` | ETH Sepolia | Deployed |
| tic_tac_toe_android | `~/StudioProjects/tic_tac_toe_android/` | ETH Sepolia | Working |
| tic_tac_toe_ios_ethereum | `~/ios_code/tic_tac_toe_ios_ethereum/` | ETH Sepolia | Working |
| tic_tac_toe_compose | `~/IdeaProjects/tic_tac_toe_compose/` | ETH Sepolia | **BROKEN** |
| tic-tac-toe-sol | `~/RustroverProjects/tic-tac-toe-sol/` | Solana Devnet | Deployed |

## Tech Stack

- **React 19** + TypeScript
- **ethers.js v6** for Ethereum interaction
- **Tailwind CSS 3** for styling (Matrix green theme)
- **react-app-rewired** for webpack overrides (Node.js polyfills for Solana libs)
- **Jest** + React Testing Library for testing
- **gh-pages** for deployment

## Live Demo

https://jlmalone.github.io/tic-tac-toe-eth-react

Requires MetaMask wallet connected to Sepolia testnet.

## Contract Integration

**Factory (Sepolia):** `0xa0B53DbDb0052403E38BBC31f01367aC6782118E`
**Game Implementation:** `0x340AC014d800Ac398Af239Cebc3a376eb71B0353`
**Factory (Hardhat Local):** `0x4A679253410272dd5232B3Ff7cF5dbB88f295319`

ABI definitions: `src/contracts/abis.ts` (human-readable ethers.js format)
Address config: `src/contracts/addresses.ts`

## Build & Run

```bash
npm install
npm start          # Development server
npm test           # Run tests
npm run build      # Production build
npm run deploy     # Deploy to GitHub Pages
```

## Key Files

- `src/contracts/abis.ts` — Factory + Game ABI definitions
- `src/contracts/addresses.ts` — Chain-specific contract addresses
- `src/services/ethereumService.ts` — MetaMask + ethers.js integration
- `src/services/solanaService.ts` — Anchor/Solana integration (WIP)
- `config-overrides.js` — Webpack overrides for Node.js polyfills

## Solana Branch

Branch `solana` has experimental dual-chain support:
- Solana wallet adapter packages installed
- IDL at `src/services/idl/tic_tac_toe_sol.json`
- Program ID: `C18ERJ5zzEm5sanmVq5TELPg3KRe1ZB2Bsjf6GKNEaKx`
- **Status:** Incomplete, not merged to main

## Game Flow

1. Connect MetaMask wallet
2. Create game via `factory.createGame()` (deploys new proxy contract)
3. Share game address with opponent
4. Join game via contract address
5. Make moves with `makeMove(row, col)` — on-chain transactions
6. Board state read via `getBoardState()`
7. Win/draw detection via `gameEnded()` + `winner()`
