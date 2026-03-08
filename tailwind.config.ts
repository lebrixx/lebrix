import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Game Colors
        'game-dark': "hsl(var(--game-dark))",
        'game-darker': "hsl(var(--game-darker))",
        'text-primary': "hsl(var(--text-primary))",
        'text-secondary': "hsl(var(--text-secondary))",
        'text-muted': "hsl(var(--text-muted))",
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          glow: "hsl(var(--secondary-glow))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          glow: "hsl(var(--success-glow))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          glow: "hsl(var(--danger-glow))",
        },
        
        // Wheel Colors
        'wheel-base': "hsl(var(--wheel-base))",
        'wheel-segment': "hsl(var(--wheel-segment))",
        'wheel-border': "hsl(var(--wheel-border))",
        'green-zone': "hsl(var(--green-zone))",
        'green-zone-glow': "hsl(var(--green-zone-glow))",
        
        // UI Elements
        'button-bg': "hsl(var(--button-bg))",
        'button-border': "hsl(var(--button-border))",
        'button-hover': "hsl(var(--button-hover))",
        'button-active': "hsl(var(--button-active))",
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "spin-wheel": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "var(--glow-primary)" },
          "50%": { boxShadow: "var(--glow-primary), var(--glow-primary)" },
        },
        "pulse-zone": {
          "0%, 100%": { 
            transform: "scale(1)",
            opacity: "0.8" 
          },
          "50%": { 
            transform: "scale(1.05)",
            opacity: "1" 
          }
        },
        "success-flash": {
          "0%": { boxShadow: "var(--glow-success)" },
          "50%": { boxShadow: "var(--glow-success), 0 0 60px hsl(var(--success) / 0.9)" },
          "100%": { boxShadow: "var(--glow-success)" },
        },
        "danger-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "podium-subtle": {
          "0%, 100%": { borderColor: "hsl(var(--primary) / 0.3)" },
          "50%": { borderColor: "hsl(var(--primary) / 0.6)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "circle-flash": {
          "0%": { filter: "brightness(1)", transform: "scale(1)" },
          "50%": { filter: "brightness(2) saturate(1.5)", transform: "scale(1.02)" },
          "100%": { filter: "brightness(1)", transform: "scale(1)" },
        },
        "particle-burst": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "scale(1.5) rotate(360deg)", opacity: "0" },
        },
        "trail-fade": {
          "0%": { opacity: "0.8", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.3)" },
        },
        "animated-gradient": {
          "0%": { background: "linear-gradient(45deg, hsl(var(--primary)), hsl(var(--secondary)))" },
          "25%": { background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--success)))" },
          "50%": { background: "linear-gradient(225deg, hsl(var(--success)), hsl(var(--primary)))" },
          "75%": { background: "linear-gradient(315deg, hsl(var(--primary)), hsl(var(--secondary)))" },
          "100%": { background: "linear-gradient(45deg, hsl(var(--primary)), hsl(var(--secondary)))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-wheel": "spin-wheel var(--spin-speed) linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-zone": "pulse-zone var(--pulse-zone-duration) ease-in-out infinite",
        "success-flash": "success-flash 0.6s ease-out",
        "danger-shake": "danger-shake 0.6s ease-out",
        "float": "float 3s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "podium-subtle": "podium-subtle 6s ease-in-out infinite",
        "scale-in": "scale-in 0.3s ease-out",
        "circle-flash": "circle-flash 0.15s ease-out",
        "particle-burst": "particle-burst 0.4s ease-out",
        "trail-fade": "trail-fade 0.3s ease-out",
        "animated-gradient": "animated-gradient var(--bg-animation-duration) ease-in-out infinite",
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-game': 'var(--gradient-game)',
        'gradient-wheel': 'var(--gradient-wheel)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-danger': 'var(--gradient-danger)',
      },
      boxShadow: {
        'glow-primary': 'var(--glow-primary)',
        'glow-success': 'var(--glow-success)',
        'glow-danger': 'var(--glow-danger)',
        'card': 'var(--shadow-card)',
        'wheel': 'var(--shadow-wheel)',
      },
      transitionTimingFunction: {
        'smooth': 'var(--transition-smooth)',
        'bounce': 'var(--transition-bounce)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
