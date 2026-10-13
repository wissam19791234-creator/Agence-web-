/** @type {import('tailwindcss').Config} */
// Système « atelier éditorial » : toile noire, typographie blanche, un seul accent corail.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v('brand'), soft: v('brand-soft'), deep: v('brand-deep') },
        champagne: { DEFAULT: v('champagne'), deep: v('champagne-deep') },
        cream: '#000000',      // toile (Obsidian)
        ivoire: '#0E0E0E',     // fond discret
        panel: '#0A0A0A',      // panneaux de l'espace pro
        brun: { DEFAULT: '#FFFFFF', 2: '#A3A3A3', 3: '#808080' },
        line: '#333333',       // Graphite
        smoke: '#808080',
        ok: '#5CC48A',
        warn: '#E8B04B',
        danger: '#FF6B6B',
      },
      fontFamily: {
        serif: ['Tinos', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        script: ['Tinos', '"Times New Roman"', 'Times', 'serif'],
      },
      boxShadow: { soft: 'none', lift: '0 0 0 1px #333333' },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
};
