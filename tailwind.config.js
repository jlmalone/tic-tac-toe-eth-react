// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {

        extend: {
            colors: {
                matrix: {
                    green: '#00cc66',  // darker Matrix green
                    black: '#000000',
                },
            },
            fontFamily: {
                mono: ['Menlo', 'Courier New', 'monospace'],
            },
            boxShadow: {
                matrix: '0 0 10px #00cc66',
            },
            animation: {
                flicker: 'flicker 20s infinite',
            },
            keyframes: {
                flicker: {
                    '0%, 100%': { opacity: 0.97 },
                    '50%': { opacity: 1 },
                },
            },
        }
    },
    plugins: [ require('@tailwindcss/typography'),],
}
