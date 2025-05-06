// src/contracts/abis.ts
//
// // ABI for the TicTacToeFactory contract
// export const FACTORY_ABI = [
//     // Make sure this event signature matches your contract EXACTLY
//     'event GameCreated(address indexed gameAddress, address indexed player1, address indexed player2)',
//     'function createGame() returns (address)' // Assuming it returns the address directly might be simpler if true
//                                               // If it only emits the event, the event parsing is crucial.
// ];
//
// // ABI for the MultiPlayerTicTacToe game contract
// export const GAME_ABI = [
//     'function makeMove(uint8 row, uint8 col)',
//     'function getBoardState() view returns (address[3][3])',
//     'function gameEnded() view returns (bool)',
//     'function winner() view returns (address)',
//     'function lastPlayer() view returns (address)',
//     // Add any other functions/events you interact with from the Kotlin code if needed
//     // e.g., constructor, player1(), player2() if they exist and are needed
// ];
//


export const FACTORY_ABI = [
    'event GameCreated(address indexed gameAddress)', // <-- CORRECTED TO MATCH SOLIDITY
    'function createGame() returns (address)'
];

// ABI for the MultiPlayerTicTacToe game contract (keep as is)
export const GAME_ABI = [
    'function makeMove(uint8 row, uint8 col)',
    'function getBoardState() view returns (address[3][3])',
    'function gameEnded() view returns (bool)',
    'function winner() view returns (address)',
    'function lastPlayer() view returns (address)',
];