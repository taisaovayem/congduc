/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        temple: {
          header: '#2c1810',
          cream: '#f7ebd8',
          paper: '#f5f0e6',
          ink: '#3d2b1f',
          gold: '#e8c030',
          bronze: '#c9940f',
        },
      },
      keyframes: {
        flameFlicker: {
          '0%': { transform: 'scale(1) translateY(0)', opacity: '0.95' },
          '100%': { transform: 'scale(1.08, 1.15) translateY(-1px)', opacity: '1' },
        },
        smokeWispA: {
          '0%': { transform: 'translate(0, 8px) scale(0.35, 0.25)', opacity: '0' },
          '8%': { opacity: '0.88' },
          '22%': {
            transform: 'translate(-7px, -18px) scale(0.85, 1.05) skewX(-4deg)',
            opacity: '0.9',
          },
          '42%': {
            transform: 'translate(9px, -48px) scale(1, 1.25) skewX(5deg)',
            opacity: '0.78',
          },
          '62%': {
            transform: 'translate(-6px, -78px) scale(1.05, 1.45) skewX(-3deg)',
            opacity: '0.58',
          },
          '82%': {
            transform: 'translate(5px, -108px) scale(1.1, 1.6) skewX(2deg)',
            opacity: '0.32',
          },
          '100%': { transform: 'translate(-2px, -128px) scale(1.15, 1.75)', opacity: '0' },
        },
        smokeWispB: {
          '0%': { transform: 'translate(0, 6px) scale(0.3, 0.2)', opacity: '0' },
          '10%': { opacity: '0.85' },
          '28%': {
            transform: 'translate(8px, -22px) scale(0.9, 1.1) skewX(6deg)',
            opacity: '0.88',
          },
          '48%': {
            transform: 'translate(-10px, -52px) scale(1, 1.35) skewX(-6deg)',
            opacity: '0.72',
          },
          '68%': {
            transform: 'translate(7px, -86px) scale(1.08, 1.55) skewX(4deg)',
            opacity: '0.5',
          },
          '100%': { transform: 'translate(-4px, -132px) scale(1.12, 1.85)', opacity: '0' },
        },
        smokeWispC: {
          '0%': { transform: 'translate(0, 10px) scale(0.4, 0.28)', opacity: '0' },
          '12%': { opacity: '0.9' },
          '30%': { transform: 'translate(-9px, -28px) scale(0.88, 1.15) skewX(-5deg)' },
          '50%': {
            transform: 'translate(6px, -58px) scale(0.98, 1.4) skewX(3deg)',
            opacity: '0.75',
          },
          '70%': {
            transform: 'translate(-8px, -92px) scale(1.05, 1.62) skewX(-4deg)',
            opacity: '0.48',
          },
          '100%': { transform: 'translate(3px, -124px) scale(1.1, 1.8)', opacity: '0' },
        },
      },
      animation: {
        'flame-flicker': 'flameFlicker 0.45s ease-in-out infinite alternate',
        'smoke-a': 'smokeWispA 4.2s ease-in-out infinite',
        'smoke-b': 'smokeWispB 4.8s ease-in-out infinite',
        'smoke-c': 'smokeWispC 5.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
