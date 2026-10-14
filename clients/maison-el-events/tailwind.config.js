/** @type {import('tailwindcss').Config} */
// « Luxe discret » : nuit océane, or champagne, albâtre. Titres Cormorant Garamond, texte Inter.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#070F17',      // toile nuit (remplace le noir pur partout)
        brand: { DEFAULT: v('brand'), soft: v('brand-soft'), deep: v('brand-deep') },
        champagne: { DEFAULT: v('champagne'), deep: v('champagne-deep') },
        navy: { DEFAULT: '#070F17', card: '#0E1B28', surface: '#132435' },
        gold: { DEFAULT: v('brand'), light: '#DFBE88', dark: '#A57D43' },
        alabaster: '#FAF8F5',
        parchment: '#F4EFEA',
        ink: { DEFAULT: '#121A21', muted: '#626E7B' },
        cream: '#070F17',      // fond général
        ivoire: '#0B1520',
        panel: '#0E1B28',
        brun: { DEFAULT: '#FFFFFF', 2: '#BAC2CA', 3: '#8592A0' },
        line: '#1F2E3D',
        smoke: '#8592A0',
        charcoal: '#132435',
        frost: '#DFBE88',      // filets dorés (utilisés à faible opacité)
        ash: '#BAC2CA',
        ok: '#5CC48A',
        warn: '#E8B04B',
        danger: '#FF6B6B',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', '"Segoe UI"', 'system-ui', 'sans-serif'],
        script: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: { ctl: '6px', card: '12px', box: '20px' },
      boxShadow: {
        soft: '0 4px 12px rgba(0,0,0,.06)', lift: '0 12px 30px rgba(0,0,0,.12)', lg: '0 20px 45px rgba(0,0,0,.22)',
        gold: '0 8px 25px rgba(197,155,95,.28)', deep: '0 16px 36px rgba(0,0,0,.45)',
      },
      maxWidth: { site: '1320px' },
      transitionTimingFunction: { lux: 'cubic-bezier(.16,1,.3,1)' },
    },
  },
  plugins: [],
};
