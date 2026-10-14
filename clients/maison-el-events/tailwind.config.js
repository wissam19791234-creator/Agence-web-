/** @type {import('tailwindcss').Config} */
// Système « galerie de nuit » : toile noire, typographie blanche, traits givrés,
// boutons charbon au trait fin, accents rose et or tirés des visuels.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v('brand'), soft: v('brand-soft'), deep: v('brand-deep') },
        champagne: { DEFAULT: v('champagne'), deep: v('champagne-deep') },
        cream: '#000000',      // toile
        ivoire: '#0B0B0B',     // fond discret
        panel: '#0A0A0A',      // panneaux de l'espace pro
        brun: { DEFAULT: '#FFFFFF', 2: '#B8BAB9', 3: '#8C8D8E' },
        line: '#2E2E2E',       // filet givré à faible opacité sur noir
        smoke: '#8C8D8E',
        charcoal: '#444345',
        frost: '#E2E2E2',
        ash: '#B8BAB9',
        ok: '#5CC48A',
        warn: '#E8B04B',
        danger: '#FF6B6B',
      },
      fontFamily: {
        serif: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        script: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { ctl: '2px', card: '10px', box: '20px' },
      boxShadow: { soft: 'none', lift: '0 0 0 1px #2E2E2E' },
      maxWidth: { site: '1280px' },
    },
  },
  plugins: [],
};
