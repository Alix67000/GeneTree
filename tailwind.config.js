/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D5A3D',
          light: '#4A7C59',
        },
        accent: '#D4A853',
        background: '#FAF7F2',
        surface: '#FFFFFF',
        'text-primary': '#3D3028',
        'text-secondary': '#7A6E62',
        error: '#C44536',
        success: '#5B8A72',
        border: '#E8E2D9',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        avatar: '9999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(61, 48, 40, 0.08)',
      }
    },
  },
  plugins: [],
}
