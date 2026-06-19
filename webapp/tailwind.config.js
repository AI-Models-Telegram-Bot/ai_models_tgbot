/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Single accent — warm amber. Used sparingly (CTA, active, focus).
        brand: {
          primary: 'oklch(0.83 0.125 78 / <alpha-value>)',
          'primary-dark': 'oklch(0.74 0.12 72 / <alpha-value>)',
          'primary-light': 'oklch(0.90 0.09 85 / <alpha-value>)',
          secondary: 'oklch(0.72 0.085 35 / <alpha-value>)',
          accent: 'oklch(0.83 0.125 78 / <alpha-value>)',
        },
        // Warm-tinted neutral surfaces (hue ~75). Never pure black.
        surface: {
          bg: 'oklch(0.165 0.006 75 / <alpha-value>)',
          secondary: 'oklch(0.205 0.007 75 / <alpha-value>)',
          card: 'oklch(0.225 0.008 75 / <alpha-value>)',
          elevated: 'oklch(0.275 0.009 75 / <alpha-value>)',
        },
        content: {
          primary: 'oklch(0.965 0.004 80 / <alpha-value>)',
          secondary: 'oklch(0.79 0.006 80 / <alpha-value>)',
          tertiary: 'oklch(0.605 0.008 80 / <alpha-value>)',
        },
        // Hairline border tokens (translucent, fixed alpha).
        border: 'oklch(0.97 0.004 80 / 0.09)',
        'border-strong': 'oklch(0.97 0.004 80 / 0.16)',
        // Semantic — muted, harmonized.
        success: 'oklch(0.72 0.09 155 / <alpha-value>)',
        warning: 'oklch(0.80 0.10 75 / <alpha-value>)',
        error: 'oklch(0.645 0.13 25 / <alpha-value>)',
        // Category markers — desaturated into one register.
        audio: {
          primary: 'oklch(0.74 0.07 165 / <alpha-value>)',
          'primary-dark': 'oklch(0.66 0.065 165 / <alpha-value>)',
          'primary-light': 'oklch(0.82 0.06 165 / <alpha-value>)',
          surface: 'oklch(0.185 0.01 165 / <alpha-value>)',
          'surface-card': 'oklch(0.225 0.012 165 / <alpha-value>)',
          'surface-elevated': 'oklch(0.275 0.014 165 / <alpha-value>)',
        },
        image: {
          primary: 'oklch(0.71 0.085 300 / <alpha-value>)',
          'primary-dark': 'oklch(0.63 0.08 300 / <alpha-value>)',
          'primary-light': 'oklch(0.80 0.07 300 / <alpha-value>)',
          surface: 'oklch(0.185 0.012 300 / <alpha-value>)',
          'surface-card': 'oklch(0.225 0.014 300 / <alpha-value>)',
          'surface-elevated': 'oklch(0.275 0.016 300 / <alpha-value>)',
        },
        video: {
          primary: 'oklch(0.74 0.095 50 / <alpha-value>)',
          'primary-dark': 'oklch(0.66 0.09 48 / <alpha-value>)',
          'primary-light': 'oklch(0.82 0.075 55 / <alpha-value>)',
          surface: 'oklch(0.185 0.012 50 / <alpha-value>)',
          'surface-card': 'oklch(0.225 0.014 50 / <alpha-value>)',
          'surface-elevated': 'oklch(0.275 0.016 50 / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Onest', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Unbounded', 'Onest', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        // One restrained vertical wash for page backgrounds. No neon gradients.
        'gradient-dark': 'linear-gradient(180deg, oklch(0.165 0.006 75) 0%, oklch(0.19 0.007 75) 100%)',
      },
      boxShadow: {
        // Soft neutral elevation. Legacy neon/gold/category keys are remapped to
        // these so any lingering `shadow-neon`/`shadow-gold` degrades gracefully.
        'card': '0 1px 2px oklch(0 0 0 / 0.30), 0 6px 20px oklch(0 0 0 / 0.32)',
        'card-hover': '0 2px 6px oklch(0 0 0 / 0.34), 0 12px 32px oklch(0 0 0 / 0.42)',
        'elevated': '0 8px 40px oklch(0 0 0 / 0.50)',
        'neon': '0 1px 2px oklch(0 0 0 / 0.30), 0 6px 20px oklch(0 0 0 / 0.32)',
        'neon-strong': '0 2px 6px oklch(0 0 0 / 0.34), 0 12px 32px oklch(0 0 0 / 0.42)',
        'gold': '0 1px 2px oklch(0 0 0 / 0.30), 0 6px 20px oklch(0 0 0 / 0.32)',
        'audio-neon': '0 1px 2px oklch(0 0 0 / 0.30), 0 6px 20px oklch(0 0 0 / 0.32)',
        'audio-glow': '0 2px 6px oklch(0 0 0 / 0.34), 0 12px 32px oklch(0 0 0 / 0.42)',
        'image-neon': '0 1px 2px oklch(0 0 0 / 0.30), 0 6px 20px oklch(0 0 0 / 0.32)',
        'image-glow': '0 2px 6px oklch(0 0 0 / 0.34), 0 12px 32px oklch(0 0 0 / 0.42)',
        'video-neon': '0 1px 2px oklch(0 0 0 / 0.30), 0 6px 20px oklch(0 0 0 / 0.32)',
        'video-glow': '0 2px 6px oklch(0 0 0 / 0.34), 0 12px 32px oklch(0 0 0 / 0.42)',
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slideDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
