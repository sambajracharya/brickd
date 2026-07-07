// Brick'd design system. Two palettes (dark/light); buildTheme(mode)
// produces every color and reusable style token for that mode. Screens
// never hardcode colors — they call useTheme() (src/store/theme.js).

const darkColors = {
  // Background — near true black with a faint blue tint
  bg: '#04060A',
  bgTop: '#0A0F16',

  // Glass surfaces
  glass: 'rgba(255, 255, 255, 0.055)',
  glassBorder: 'rgba(255, 255, 255, 0.09)',

  // Text
  text: '#F4F6F8',
  textSecondary: '#9AA4B2',
  textTertiary: '#5F6B78',

  // Accent (used sparingly)
  accent: '#34D399',
  accentDim: 'rgba(52, 211, 153, 0.14)',
  accentBorder: 'rgba(52, 211, 153, 0.35)',
  onAccent: '#06281C',

  // Semantic
  warn: '#FBBF24',
  warnDim: 'rgba(251, 191, 36, 0.10)',
  warnBorder: 'rgba(251, 191, 36, 0.30)',
  danger: '#F87171',
  heart: '#FB7185',

  // Score scale
  scoreHigh: '#34D399',
  scoreMid: '#FBBF24',
  scoreLow: '#FB923C',

  // Chrome
  tabBar: 'rgba(8, 11, 16, 0.96)',
  hairline: 'rgba(255, 255, 255, 0.06)',
  inputBg: 'rgba(255, 255, 255, 0.06)',
  ringBg: 'rgba(255, 255, 255, 0.03)',
};

const lightColors = {
  // Background — crisp white
  bg: '#FFFFFF',
  bgTop: '#F3F6FA',

  // "Glass" on white = soft gray cards with hairline borders
  glass: 'rgba(10, 20, 30, 0.035)',
  glassBorder: 'rgba(10, 20, 30, 0.08)',

  // Text
  text: '#0B1220',
  textSecondary: '#57636F',
  textTertiary: '#8B95A1',

  // Accent — darker emerald for contrast on white
  accent: '#059669',
  accentDim: 'rgba(5, 150, 105, 0.09)',
  accentBorder: 'rgba(5, 150, 105, 0.30)',
  onAccent: '#FFFFFF',

  // Semantic
  warn: '#B45309',
  warnDim: 'rgba(180, 83, 9, 0.07)',
  warnBorder: 'rgba(180, 83, 9, 0.25)',
  danger: '#DC2626',
  heart: '#E11D48',

  // Score scale — darker tones so they read on white
  scoreHigh: '#059669',
  scoreMid: '#D97706',
  scoreLow: '#EA580C',

  // Chrome
  tabBar: 'rgba(255, 255, 255, 0.97)',
  hairline: 'rgba(10, 20, 30, 0.08)',
  inputBg: 'rgba(10, 20, 30, 0.04)',
  ringBg: 'rgba(10, 20, 30, 0.02)',
};

export const radius = {
  card: 20,
  input: 14,
  chip: 999, // full pill
  button: 14,
};

export const spacing = {
  screen: 20,
  card: 18,
};

export function buildTheme(mode) {
  const colors = mode === 'light' ? lightColors : darkColors;

  return {
    mode,
    colors,
    radius,
    spacing,

    scoreColor(score) {
      if (score >= 60) return colors.scoreHigh;
      if (score >= 30) return colors.scoreMid;
      return colors.scoreLow;
    },

    // The signature surface: translucent card with a hairline border.
    glassCard: {
      backgroundColor: colors.glass,
      borderColor: colors.glassBorder,
      borderWidth: 1,
      borderRadius: radius.card,
      padding: spacing.card,
    },

    // Borderless pill — quiet metadata, not a bubble.
    chip: {
      backgroundColor: colors.inputBg,
      borderRadius: radius.chip,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },

    chipText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },

    // Tinted callout (warnings, disclaimers) — background only, no border.
    warnBox: {
      backgroundColor: colors.warnDim,
      borderRadius: 14,
      padding: 14,
    },

    sectionLabel: {
      color: colors.textTertiary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.6,
    },

    screenTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.5,
    },

    screenSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },

    buttonPrimary: {
      backgroundColor: colors.accent,
      borderRadius: radius.button,
      paddingHorizontal: 24,
      paddingVertical: 13,
      alignItems: 'center',
    },

    buttonPrimaryText: {
      color: colors.onAccent,
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 0.2,
    },

    input: {
      backgroundColor: colors.inputBg,
      borderColor: colors.glassBorder,
      borderWidth: 1,
      color: colors.text,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderRadius: radius.input,
      fontSize: 15,
    },
  };
}
