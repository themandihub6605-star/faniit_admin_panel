import type { Config } from 'tailwindcss';
import { colors, typography, radius, shadows, breakpoints, spacing } from './src/styles/theme';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: breakpoints,
    extend: {
      colors: {
        orange: colors.orange,
        pink: colors.pink,
        yellow: colors.yellow,
        navy: colors.navy,
        cream: colors.cream,
        teal: colors.teal,
        success: colors.success,
        danger: colors.danger,
        ink: colors.navy,
      },
      fontFamily: {
        display: typography.fontDisplay.split(',').map((f) => f.trim().replace(/'/g, '')),
        body: typography.fontBody.split(',').map((f) => f.trim().replace(/'/g, '')),
      },
      fontSize: typography.scale,
      borderRadius: radius,
      boxShadow: shadows,
      spacing: {
        section: spacing.section.y,
        'section-mobile': spacing.section.yMobile,
        gutter: spacing.gutter,
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF6A1F 0%, #F9436E 60%, #EC2A78 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
