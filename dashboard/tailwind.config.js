/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
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
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
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
        /*blue: {
          100: "#a5e1ff",
          200: "#4bc3ff",
          300: "#00a0f1",
          400: "#006597",
          500: "#00293d",
          600: "#002131",
          700: "#001825",
          800: "#001018",
          900: "#00080c",
        },
        red: {
          100: "#f7d2d2",
          200: "#efa5a5",
          300: "#e77878",
          400: "#df4b4b",
          500: "#d02525",
          600: "#a61d1d",
          700: "#7d1616",
          800: "#530f0f",
          900: "#2a0707",
        },
        orange: {
          100: "#ffe5ca",
          200: "#ffcc95",
          300: "#ffb260",
          400: "#ff982b",
          500: "#f77f00",
          600: "#c46500",
          700: "#934c00",
          800: "#623300",
          900: "#311900",
        },
        yellow: {
          100: "#fff5e3",
          200: "#ffecc6",
          300: "#ffe2aa",
          400: "#fed98d",
          500: "#fecf72",
          600: "#feb728",
          700: "#db9301",
          800: "#926201",
          900: "#493100",
        },
        eggshell: {
          100: "#fbfaf2",
          200: "#f8f4e6",
          300: "#f4efd9",
          400: "#f1e9cc",
          500: "#ede4bf",
          600: "#dac77d",
          700: "#c7ab3a",
          800: "#867226",
          900: "#433913",
        },*/
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
