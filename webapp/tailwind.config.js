/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#00d4ff',
          'primary-dark': '#0099cc',
          'primary-light': '#66e0ff',
          secondary: '#ff6b9d',
          accent: '#ffd700',
        },
        surface: {
          bg: '#0f0f23',
          secondary: '#1a1a3e',
          card: '#252547',
          elevated: '#2d2d5f',
        },
        content: {
          primary: '#f0f0ff',
          secondary: '#c8c8e4',
          tertiary: '#9898be',
        },
        audio: {
          primary: '#10b981',
          'primary-dark': '#059669',
          'primary-light': '#34d399',
          surface: '#0a1f1a',
          'surface-card': '#122a22',
          'surface-elevated': '#1a3d30',
        },
        image: {
          primary: '#a855f7',
          'primary-dark': '#9333ea',
          'primary-light': '#c084fc',
          surface: '#150f2e',
          'surface-card': '#1e1540',
          'surface-elevated': '#2a1d50',
        },
        video: {
          primary: '#f97316',
          'primary-dark': '#ea580c',
          'primary-light': '#fb923c',
          surface: '#1a0f0a',
          'surface-card': '#2a1a10',
          'surface-elevated': '#3d2518',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
        'gradient-premium': 'linear-gradient(135deg, #ffd700 0%, #ff6b9d 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%)',
      },
      boxShadow: {
        'card': '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,212,255,0.2)',
        'neon': '0 0 20px rgba(0,212,255,0.4)',
        'neon-strong': '0 0 30px rgba(0,212,255,0.6)',
        'gold': '0 0 20px rgba(255,215,0,0.3)',
        'audio-neon': '0 0 20px rgba(16,185,129,0.4)',
        'audio-glow': '0 0 30px rgba(16,185,129,0.6)',
        'image-neon': '0 0 20px rgba(168,85,247,0.4)',
        'image-glow': '0 0 30px rgba(168,85,247,0.6)',
        'video-neon': '0 0 20px rgba(249,115,22,0.4)',
        'video-glow': '0 0 30px rgba(249,115,22,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'particle': 'particle 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,212,255,0.6)' },
        },
        particle: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) translateX(20px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
