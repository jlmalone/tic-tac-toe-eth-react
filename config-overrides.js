// config-overrides.js
const webpack = require('webpack');

module.exports = function override(config, env) {
    // Add fallbacks for Node.js core modules
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "assert": require.resolve("assert/"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "url": require.resolve("url/"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser") // Fallback for general 'process' imports
    };

    // Add ProvidePlugin for globals like Buffer and process
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser', // Makes 'process' available globally
            Buffer: ['buffer', 'Buffer'],  // Makes 'Buffer' available globally
        }),
    ]);

    // ---- START: ADDED/MODIFIED SECTION ----
    // Explicitly alias 'process/browser' to the resolved path of the polyfill.
    // This helps with direct imports like `import ... from 'process/browser'`.
    config.resolve.alias = {
        ...config.resolve.alias,
        'process/browser': require.resolve('process/browser'),
    };

    // Add a rule to handle .mjs files from dependencies if they are causing issues
    // Some Solana/Web3 libraries might use .mjs and omit extensions in imports.
    config.module.rules.push({
        test: /\.m?js$/, // Apply to .js and .mjs files
        resolve: {
            fullySpecified: false, // Allow omitting .js or .mjs extension in imports from these files
        },
    });
    // ---- END: ADDED/MODIFIED SECTION ----

    // Important: return the modified config
    return config;
};