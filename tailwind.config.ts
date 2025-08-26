import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Enhanced Lovecraftian color palette
        'cosmic-void': 'hsl(0, 0%, 6.7%)',
        'deep-black': 'hsl(0, 0%, 3.9%)',
        'blood-burgundy': 'hsl(0, 100%, 27.3%)',
        'dark-crimson': 'hsl(0, 71.4%, 15.3%)',
        'aged-gold': 'hsl(43, 74.4%, 49.0%)',
        'eldritch-green': 'hsl(120, 25.0%, 25.1%)',
        'bone-white': 'hsl(60, 29.4%, 96.1%)',
        'aged-parchment': 'hsl(45, 37.5%, 86.3%)',
        'charcoal': 'hsl(0, 0%, 10.9%)',
        'dark-stone': 'hsl(0, 0%, 17.3%)',
        
        // Additional mystic colors
        'mystic-purple': 'hsl(280, 39.5%, 25.1%)',
        'shadow-blue': 'hsl(220, 20%, 15%)',
        'ember-orange': 'hsl(15, 85%, 45%)',
        'ghost-silver': 'hsl(210, 15%, 85%)',

        // Shadcn UI compatible colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'cinzel': ['Cinzel', 'serif'],
        'crimson': ['Crimson Text', 'serif'],
        'source': ['Source Sans Pro', 'sans-serif'],
        sans: ['Source Sans Pro', 'sans-serif'],
        serif: ['Crimson Text', 'serif'],
        mono: ['monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'dice-roll': 'diceRoll 1s ease-in-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(90deg) scale(1.1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '75%': { transform: 'rotate(270deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      boxShadow: {
        'eldritch': '0 0 20px rgba(218, 165, 32, 0.3)',
        'sanity-critical': '0 0 15px rgba(139, 0, 0, 0.7)',
        'gothic': '0 4px 8px rgba(0, 0, 0, 0.4), 0 0 12px rgba(218, 165, 32, 0.2)',
      },
      backgroundImage: {
        'parchment': 'linear-gradient(135deg, hsl(0, 0%, 10.9%) 0%, hsl(0, 0%, 17.3%) 50%, hsl(0, 0%, 10.9%) 100%)',
        'gothic-border': 'linear-gradient(45deg, hsl(43, 74.4%, 49.0%), hsl(0, 100%, 27.3%), hsl(43, 74.4%, 49.0%))',
      },
      textShadow: {
        'sm': '1px 1px 2px rgba(0, 0, 0, 0.5)',
        'md': '2px 2px 4px rgba(0, 0, 0, 0.5)',
        'lg': '3px 3px 6px rgba(0, 0, 0, 0.7)',
      },
      screens: {
        'xs': '475px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom plugin for text shadows
    function({ addUtilities }: any) {
      const newUtilities = {
        '.text-shadow-sm': {
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-md': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '3px 3px 6px rgba(0, 0, 0, 0.7)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;
