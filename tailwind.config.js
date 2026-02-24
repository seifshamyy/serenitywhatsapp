/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#000000',
        'whatsapp-green': '#10b981', // Emerald 500
        'buongo-blue': '#1d4ed8',   // Blue 700
        'serenity-teal': '#164E48',
        'serenity-peach': '#D7A799',
        'serenity-light': '#F2F6F5',
        'glass-border': 'rgba(16, 185, 129, 0.2)',
        'glass-bg': 'rgba(0, 0, 0, 0.7)',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(16, 185, 129, 0.5)',
        'neon-strong': '0 0 20px rgba(16, 185, 129, 0.8)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
