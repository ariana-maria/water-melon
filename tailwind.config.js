/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wm: {
          dark:  '#0F2419',
          green: '#1A3A2A',
          mid:   '#2D6A4F',
          sage:  '#7DAA83',
          cream: '#FAF6F0',
          warm:  '#F0EBE3',
          coral: '#E85D4A',
          pink:  '#F4A5AC',
          gold:  '#D4A853',
          muted: '#8A8070',
        },
      },
    },
  },
  plugins: [],
}
