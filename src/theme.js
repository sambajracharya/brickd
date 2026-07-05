// Brick'd design system. Every screen pulls colors/spacing/effects from
// here — change the look in one place, not nine.
//
// Aesthetic: premium dark health app (Oasis/Whoop-style). Near-black
// blue-tinted base, translucent "glass" cards with hairline borders,
// one restrained emerald accent, score shown as colored rings.

export const colors = {
  // Background
  bg: '#0B0F14', // near-black with a blue tint
  bgTop: '#131B26', // top of the ambient gradient wash

  // Glass surfaces
  glass: 'rgba(255, 255, 255, 0.055)',
  glassBorder: 'rgba(255, 255, 255, 0.09)',
  glassPressed: 'rgba(255, 255, 255, 0.10)',

  // Text
  text: '#F4F6F8',
  textSecondary: '#9AA4B2',
  textTertiary: '#5F6B78',

  // Accent (used sparingly)
  accent: '#34D399',
  accentDim: 'rgba(52, 211, 153, 0.14)',
  accentBorder: 'rgba(52, 211, 153, 0.35)',

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
  tabBar: 'rgba(15, 19, 26, 0.94)',
  hairline: 'rgba(255, 255, 255, 0.06)',
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

export function scoreColor(score) {
  if (score >= 60) return colors.scoreHigh;
  if (score >= 30) return colors.scoreMid;
  return colors.scoreLow;
}

// The signature surface: translucent card with a hairline border.
export const glassCard = {
  backgroundColor: colors.glass,
  borderColor: colors.glassBorder,
  borderWidth: 1,
  borderRadius: radius.card,
  padding: spacing.card,
};

// Translucent pill chip.
export const chip = {
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderWidth: 1,
  borderRadius: radius.chip,
  paddingHorizontal: 10,
  paddingVertical: 4,
};

export const chipText = {
  color: colors.textSecondary,
  fontSize: 12,
  fontWeight: '600',
};

// Section micro-label: small caps, letter-spaced.
export const sectionLabel = {
  color: colors.textTertiary,
  fontSize: 11,
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: 1.6,
};

// Screen titles.
export const screenTitle = {
  color: colors.text,
  fontSize: 28,
  fontWeight: '800',
  letterSpacing: -0.5,
};

export const screenSubtitle = {
  color: colors.textSecondary,
  fontSize: 13,
  marginTop: 4,
  lineHeight: 18,
};

// Primary action button.
export const buttonPrimary = {
  backgroundColor: colors.accent,
  borderRadius: radius.button,
  paddingHorizontal: 24,
  paddingVertical: 13,
  alignItems: 'center',
};

export const buttonPrimaryText = {
  color: '#06281C',
  fontWeight: '800',
  fontSize: 14,
  letterSpacing: 0.2,
};

// Text input on glass.
export const input = {
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderColor: colors.glassBorder,
  borderWidth: 1,
  color: colors.text,
  paddingHorizontal: 16,
  paddingVertical: 13,
  borderRadius: radius.input,
  fontSize: 15,
};
