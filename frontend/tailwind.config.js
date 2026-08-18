/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        prime: {
          primary: '#1A73E8',   // Superwise Vibrant Blue
          secondary: '#4285F4', // Lighter Blue Hover
          bg: '#F8F9FA',        // Very light gray background
          text: '#3C4043',      // Dark slate text
          muted: '#80868B',     // Gray for secondary text
          border: '#DADCE0'     // Soft borders
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 6px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}