const { colors } = require('@nermai/theme/colors');
const { spacing } = require('@nermai/theme/spacing');
const { radius } = require('@nermai/theme/radius');
const { typography } = require('@nermai/theme/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        background: colors.background,
        surface: colors.surface,
        surfaceHighlight: colors.surfaceHighlight,
        
        primary: {
          DEFAULT: colors.primary,
          foreground: colors.primaryForeground,
        },
        accent: {
          DEFAULT: colors.accent,
          foreground: colors.accentForeground,
        },
        destructive: {
          DEFAULT: colors.destructive,
          foreground: colors.destructiveForeground,
        },
        muted: {
          DEFAULT: colors.muted,
          foreground: colors.mutedForeground,
        },
        
        border: colors.border,
        input: colors.input,
        ring: colors.ring,
        
        textPrimary: colors.textPrimary,
        textSecondary: colors.textSecondary,
        textInverse: colors.textInverse,
        
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
      },
      borderRadius: {
        none: `${radius.none}px`,
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        xl: `${radius.xl}px`,
        full: `${radius.full}px`,
      }
    },
  },
  plugins: [],
}

