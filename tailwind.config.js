/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
        fontFamily: {
            sans: ['Inter', 'sans-serif'],
            serif: ['Lora', 'serif'],
        },
        keyframes: {
            'fade-in-up': {
                'from': { opacity: '0', transform: 'translateY(10px)' },
                'to': { opacity: '1', transform: 'translateY(0)' },
            },
            'bounce-sm': {
                '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
                '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
            }
        },
        animation: {
            'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
            'bounce-sm': 'bounce-sm 1s infinite',
        }
    }
  },
  plugins: [],
}
