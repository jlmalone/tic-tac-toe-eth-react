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

    // Configure Jest for ES modules
    if (env === 'test') {
        config.transformIgnorePatterns = [
            '/node_modules/(?!(react-markdown|remark-gfm|micromark|unist-util-stringify-position|mdast-util-to-string|trim-lines|trough|unified|bail|is-plain-obj|mdast-util-to-hast|hast-util-whitespace|hast-util-raw|hast-util-to-jsx-runtime|property-information|space-separated-tokens|comma-separated-tokens|hast-util-parse-selector|zwitch|html-void-elements|estree-util-is-identifier-name|estree-util-build-jsx|estree-util-to-js|astring|periscopic|estree-walker|is-reference|acorn|acorn-jsx|estree-util-visit|devlop|mdast-util-gfm|mdast-util-gfm-autolink-literal|mdast-util-gfm-footnote|mdast-util-gfm-strikethrough|mdast-util-gfm-table|mdast-util-gfm-task-list-item|ccount|markdown-table|mdast-util-from-markdown|mdast-util-to-markdown|decode-named-character-reference|character-entities|micromark-util-combine-extensions|micromark-util-chunked|micromark-util-decode-numeric-character-reference|micromark-util-decode-string|micromark-util-normalize-identifier|micromark-util-resolve-all|micromark-util-sanitize-uri|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|micromark-extension-gfm|micromark-extension-gfm-autolink-literal|micromark-extension-gfm-footnote|micromark-extension-gfm-strikethrough|micromark-extension-gfm-table|micromark-extension-gfm-tagfilter|micromark-extension-gfm-task-list-item|micromark-core-commonmark|micromark-factory-destination|micromark-factory-label|micromark-factory-space|micromark-factory-title|micromark-factory-whitespace|micromark-util-character|micromark-util-classify-character|micromark-util-html-tag-name|micromark-util-encode|micromark-util-events-to-acorn|micromark-util-sanitize-uri|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|unist-util-position|unist-util-visit|unist-util-visit-parents|unist-util-is|unist-util-remove-position|vfile|vfile-message|web-namespaces|hastscript|hast-util-parse-selector|space-separated-tokens|comma-separated-tokens|property-information|hast-util-whitespace|zwitch|html-void-elements|style-to-object|inline-style-parser|hast-util-from-parse5|parse5|entities|longest-streak|mdast-util-phrasing|mdast-util-find-and-replace|escape-string-regexp|character-entities-html4|character-entities-legacy|@types/)/.+\\.(js|jsx|mjs|cjs|ts|tsx)$',
            '^.+\\.module\\.(css|sass|scss)$',
        ];
    }

    // Important: return the modified config
    return config;
};