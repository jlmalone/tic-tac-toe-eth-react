# Tic-Tac-Toe Blockchain Ecosystem

> **Flagship project: tic-tac-toe-eth-react** (this repo)
> Live demo: https://jlmalone.github.io/tic-tac-toe-eth-react

## Ecosystem Members

| Project | Path | Platform | Chain | Blockchain Lib | Status |
|---------|------|----------|-------|----------------|--------|
| **tic-tac-toe-eth-react** (flagship) | `~/WebstormProjects/tic-tac-toe-eth-react/` | React 19 + TypeScript | ETH Sepolia | ethers.js v6 | Live (GitHub Pages) |
| tic-tac-toe-smart-contract | `~/tic-tac-toe-smart-contract/` | Hardhat + Solidity | ETH Sepolia | Hardhat/ethers | Deployed |
| tic_tac_toe_android | `~/StudioProjects/tic_tac_toe_android/` | Android Jetpack Compose | ETH Sepolia | Web3j 5.0 | Working, tested |
| tic_tac_toe_ios_ethereum | `~/ios_code/tic_tac_toe_ios_ethereum/` | SwiftUI | ETH Sepolia | Web3.swift | Working, tested |
| tic_tac_toe_compose | `~/IdeaProjects/tic_tac_toe_compose/` | Kotlin Compose Desktop | ETH Sepolia | Web3j 5.0 | **BROKEN** |
| tic-tac-toe-cli | `~/IdeaProjects/tic-tac-toe-cli/` | Kotlin Mosaic TUI | ETH Sepolia | Web3j 5.0 | New |
| tic-tac-toe-sol | `~/RustroverProjects/tic-tac-toe-sol/` | Anchor/Rust | Solana Devnet | @coral-xyz/anchor | Deployed |

## Shared Contract Addresses

### Ethereum Sepolia Testnet
- **Factory:** `0xa0B53DbDb0052403E38BBC31f01367aC6782118E`
- **Game Implementation:** `0x340AC014d800Ac398Af239Cebc3a376eb71B0353`

### Hardhat Local Network
- **Factory:** `0x4A679253410272dd5232B3Ff7cF5dbB88f295319`
- **Game Implementation:** `0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f`

### Solana Devnet
- **Program ID:** `C18ERJ5zzEm5sanmVq5TELPg3KRe1ZB2Bsjf6GKNEaKx`

## ABI Sharing Pattern

All 5 Ethereum clients use the same Factory + Game ABIs from the smart contract project. The contract interfaces are:

**Factory ABI:**
- `createGame() returns (address)` — deploys a new game via EIP-1167 minimal proxy
- `event GameCreated(address indexed gameAddress)`

**Game ABI:**
- `makeMove(uint8 row, uint8 col)` — place a move on-chain
- `getBoardState() view returns (address[3][3])` — read board state
- `gameEnded() view returns (bool)` — check if game is over
- `winner() view returns (address)` — get winner address
- `lastPlayer() view returns (address)` — get last player

Each platform implements these via its own library:
| Platform | Library | ABI Source |
|----------|---------|------------|
| React Web | ethers.js v6 | `src/contracts/abis.ts` (human-readable ABI strings) |
| Android | Web3j 5.0 | Generated Java wrappers from Solidity |
| iOS | Web3.swift | Manual ABI encoding in BlockchainService |
| Compose Desktop | Web3j 5.0 | Same as Android |
| CLI (Mosaic TUI) | Web3j 5.0 | Raw ABI encoding in BlockchainService |

## Matrix Theme Adoption

| Platform | Matrix Theme | Notes |
|----------|-------------|-------|
| React Web | Yes | Tailwind-based Matrix green (#00ff41) theming |
| Android | Yes | `TicTacToeMatrixTheme` in Compose Material3 |
| iOS | Partial | Basic styling, no full Matrix treatment |
| Compose Desktop | Yes | Matrix theming applied before broken state |
| CLI (Mosaic TUI) | Yes | Matrix green Color(0,255,0) on black terminal |
| Solana | N/A | Backend program only, no UI |

## Priority: tic_tac_toe_compose is BROKEN

The Compose Desktop client is in a broken state (last commit message: "Totally broken state"). This needs investigation and fixing as a priority. The project uses:
- Kotlin 2.1.0
- Jetbrains Compose 1.7.3
- Web3j 5.0.0
- dotenv-kotlin 6.4.1

Likely issues: dependency version conflicts, Compose API changes, or Web3j integration breakage.

## Solana Branch (React Web)

The React web project has an experimental `solana` branch with:
- Solana wallet adapter integration
- Anchor program client via IDL
- Parallel blockchain service architecture (`ethereumService.ts` / `solanaService.ts`)
- Extensive Node.js polyfills for Solana libs in browser

**Status:** Incomplete, not merged to main. The branch has Solana dependencies in package.json but the integration is WIP.

## Test Coverage

| Platform | Testing Framework | Coverage |
|----------|------------------|----------|
| Smart Contract | Mocha/Chai + Hardhat | Contract logic, factory pattern, gas reporting |
| React Web | Jest + React Testing Library | ABI validation, address config, helpers |
| Android | JUnit + Mockk + Kover | Blockchain unit tests |
| iOS | XCTest | Comprehensive unit tests |
| Compose Desktop | None | No test directory (tests untracked) |
| CLI (Mosaic TUI) | None | No tests yet |
| Solana | ts-mocha | Anchor test suite |

## Security Notes

- **iOS:** Stores RPC URLs and private keys in `Info.plist` — **NOT production-ready**. Keys are readable in the app bundle.
- **Android:** Uses `.env` file for key management — better than iOS but still not production-grade.
- **React Web:** Uses MetaMask for key management — properly delegated to wallet.
- **Smart Contracts:** Reentrancy protection, input validation, access control implemented.
- **Solana:** Wallet delegation via Solana CLI keypair.

## Roadmap

1. **Fix Compose Desktop** — Investigate and resolve broken state
2. **KMP code sharing** — Share Kotlin code between Android and Compose Desktop (Web3j service, game logic)
3. **Cross-chain bridge** — Connect Ethereum and Solana game state
4. **Tournament system** — Multi-game brackets with on-chain results
5. **Merge Solana branch** — Complete React web dual-chain support
6. **Production key management** — Move all clients to proper wallet delegation
