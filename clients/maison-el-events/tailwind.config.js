/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v('brand'), soft: v('brand-soft'), deep: v('brand-deep') },
        champagne: { DEFAULT: v('champagne'), deep: v('champagne-deep') },
        ivoire: '#F8F2EC',
        cream: '#FFFCF8',
        brun: { DEFAULT: '#30231F', 2: '#5C4A43', 3: '#8A766D' },
        line: '#E7DACB',
        ok: '#2F6B4F',
        warn: '#8A5A12',
        danger: '#9B2C2C',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        script: ['Allura', '"Snell Roundhand"', 'cursive'],
      },
      boxShadow: {
        soft: '0 18px 40px -28px rgba(48,35,31,.45)',
        lift: '0 24px 60px -30px rgba(48,35,31,.55)',
      },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
};
