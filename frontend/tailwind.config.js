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
          primary: '#3B82F6',   // Vibrant Blue (Blue-500)
          secondary: '#0EA5E9', // Bright Sky Blue (Sky-500)
          accent: '#38BDF8',    // Light Accent (Sky-400)
          bg: '#F4F9FF',        // Very soft, cool blue-tinted background
          text: '#1E293B',      // Deep slate for readable text
          muted: '#64748B'      // Soft slate for secondary text
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(14, 165, 233, 0.05), 0 2px 4px -1px rgba(14, 165, 233, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(14, 165, 233, 0.1), 0 4px 6px -2px rgba(14, 165, 233, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}