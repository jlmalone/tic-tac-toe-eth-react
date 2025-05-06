// src/contracts/addresses.ts

// --- IMPORTANT ---
// REPLACE THESE WITH YOUR ACTUAL DEPLOYED ADDRESSES
// You might load these from environment variables or a config file in a real app
//
// export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
//
// interface ContractAddresses {
//     [chainId: number]: {
//         factoryAddress: string;
//         // Add gameImplementationAddress if needed elsewhere
//     };
// }
//
// export const CONTRACT_ADDRESSES: ContractAddresses = {
//     11155111: { // Sepolia
//         factoryAddress: '0x1234567890123456789012345678901234567890', // <--- REPLACE WITH YOUR ACTUAL SEPOLIA FACTORY ADDRESS
//     },
//     31337: { // Hardhat Local Node
//         // If you also deploy to a local Hardhat node, put that factory address here
//         factoryAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // <--- REPLACE WITH YOUR ACTUAL LOCAL FACTORY ADDRESS
//     }
// };
//
// // export const CONTRACT_ADDRESSES: ContractAddresses = {
// //     11155111: { // Sepolia
// //         factoryAddress: '0xReplaceWithYourSepoliaFactoryAddress', // <--- REPLACE
// //     },
// //     31337: { // Hardhat Local Node
// //         factoryAddress: '0xReplaceWithYourLocalFactoryAddress', // <--- REPLACE
// //     }
// //     // Add other networks if needed
// // };
//
// // Define the chain ID you primarily expect the user to be on
// // You might want to make this dynamic or selectable later
// export const EXPECTED_CHAIN_ID = 11155111; // Default to Sepolia for example



// src/contracts/addresses.ts

// ... (other imports) ...

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

interface ContractAddresses {
    [chainId: number]: {
        factoryAddress: string;
        // Add gameImplementationAddress if needed elsewhere
    };
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
    11155111: { // Sepolia
        factoryAddress: '0xa0B53DbDb0052403E38BBC31f01367aC6782118E', // <--- USE THIS NEW FACTORY ADDRESS
    },
    31337: { // Hardhat Local Node
        // Keep the placeholder or update with your local deploy address
        factoryAddress: '0xReplaceWithYourLocalFactoryAddress', // UPDATE THIS TOO IF YOU DEPLOY LOCALLY
    }
    // ... (other networks)
};

// Define the chain ID you primarily expect the user to be on
export const EXPECTED_CHAIN_ID = 11155111; // Sepolia