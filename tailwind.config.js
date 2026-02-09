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
        'whatsapp-green': '#25D366',
        'glass-border': 'rgba(37, 211, 102, 0.2)',
        'glass-bg': 'rgba(0, 0, 0, 0.7)',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(37, 211, 102, 0.5)',
        'neon-strong': '0 0 20px rgba(37, 211, 102, 0.8)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
