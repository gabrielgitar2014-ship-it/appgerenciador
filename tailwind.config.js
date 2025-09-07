/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        // ✅ VELOCIDADE ALTERADA PARA 0.1s
        'fade-in-down': 'fade-in-down 0.2s ease-out' 
      }
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
};