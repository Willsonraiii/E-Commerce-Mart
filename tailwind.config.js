/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Extra-small breakpoint for phones narrower than an iPhone SE (375px),
      // used to drop secondary bits (inline prices, star rows) on 320–360px.
      screens: { xs: '400px' },
      // Fine-grained steps used by the admin console's glass surfaces
      // (bg-white/6, border-white/12, …). Without these Tailwind drops
      // the utility entirely and inputs fall back to browser defaults.
      opacity: { 2: '0.02', 4: '0.04', 6: '0.06', 8: '0.08', 12: '0.12', 14: '0.14', 18: '0.18' },
      colors: {
        forest: { DEFAULT: '#143528', mid: '#1c4634', deep: '#0b2118' },
        leaf: { DEFAULT: '#2f6b47', bright: '#3d8a58', glow: '#4fd18b' },
        mint: '#e5f3ea',
        cream: { DEFAULT: '#f4efe6', 2: '#ebe3d4' },
        paper: '#fffdf8',
        terracotta: { DEFAULT: '#c45d2c', deep: '#a84c22' },
        gold: { DEFAULT: '#c4962a', soft: '#f3e3b5', bright: '#f0b429' },
        ink: { DEFAULT: '#1a1714', 2: '#4a453e', 3: '#7a7368' },
        line: '#e4dcce',
      },
      fontFamily: {
        display: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
        ui: ['Outfit', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      animation: {
        aurora: 'aurora 18s linear infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        marquee: 'marquee 38s linear infinite',
        float: 'float 7s ease-in-out infinite',
        spotlight: 'spotlight 2s ease .5s 1 forwards',
        'border-spin': 'border-spin 4s linear infinite',
      },
      keyframes: {
        aurora: {
          '0%,100%': { backgroundPosition: '50% 50%, 50% 50%' },
          '50%': { backgroundPosition: '350% 50%, 350% 50%' },
        },
        shimmer: { from: { backgroundPosition: '0 0' }, to: { backgroundPosition: '-200% 0' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(2deg)' },
        },
        spotlight: {
          '0%': { opacity: 0, transform: 'translate(-72%,-62%) scale(.5)' },
          '100%': { opacity: 1, transform: 'translate(-50%,-40%) scale(1)' },
        },
        'border-spin': { '100%': { transform: 'rotate(360deg)' } },
      },
      boxShadow: {
        premium: '0 24px 60px -28px rgba(20,53,40,.5)',
        lift: '0 34px 80px -32px rgba(20,53,40,.62)',
        glowleaf: '0 0 0 1px rgba(79,209,139,.28), 0 18px 50px -20px rgba(79,209,139,.45)',
      },
    },
  },
  plugins: [],
}
