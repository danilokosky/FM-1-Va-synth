/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#a9efd7',
        'accent-dim': '#68b89e',
        'slate-hw': '#22282a',
        'slate-bezel': '#161b1e',
        'lcd-bg': '#0b1414',
        'lcd-lit': '#a9efd7',
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Liberation Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
