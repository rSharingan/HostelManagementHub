export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f9f9fb',
          100: '#f3f3f7',
          200: '#ececf5',
          300: '#d9d9e3',
          400: '#a5a5b8',
          500: '#6b6b7f',
          600: '#48485c',
          700: '#2d2d3d',
          800: '#1a1a25',
          900: '#0f0f15',
        },
        light: {
          50: '#ffffff',
          100: '#f9fafb',
          200: '#f3f4f6',
          300: '#e5e7eb',
          400: '#d1d5db',
          500: '#9ca3af',
          600: '#6b7280',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        neon: {
          cyan: '#00d9ff',
          magenta: '#ff00ff',
          pink: '#ff1493',
          purple: '#9d00ff',
        }
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0f0f15 0%, #1a1a25 50%, #2d2d3d 100%)',
        'gradient-light': 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f3f4f6 100%)',
        'gradient-cyan-magenta': 'linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%)',
        'glow-cyan': 'radial-gradient(circle, rgba(0, 217, 255, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.3), 0 0 40px rgba(0, 217, 255, 0.1)',
        'glow-magenta': '0 0 20px rgba(255, 0, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.1)',
        'glow-pink': '0 0 20px rgba(255, 20, 147, 0.3), 0 0 40px rgba(255, 20, 147, 0.1)',
      },
      animation: {
        'glow': 'glow 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'float-slower': 'float-slower 8s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-in-left': 'slide-in-left 0.6s ease-out forwards',
        'slide-in-up': 'slide-in-up 0.6s ease-out forwards',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 30px rgba(0, 217, 255, 0.5)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 0, 255, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 0, 255, 0.4)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-30px)' },
        },
        'float-slower': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-40px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-in-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-in-left': {
          'from': {
            opacity: '0',
            transform: 'translateX(-30px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'slide-in-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      }
    }
  },
  plugins: [],
};
