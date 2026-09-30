// Design tokens for the app. Every screen pulls colors/spacing/type from
// here instead of hardcoding values, so the whole app stays visually
// consistent and easy to re-theme later.

export const colors = {
  ink: '#14171C',        // primary text, headers
  bone: '#F1EFE9',       // app background (warm paper, not stark white)
  card: '#FFFFFF',       // card surfaces on top of bone
  emerald: '#1F5C46',    // primary action: Try-On, Sign up, Log in
  emeraldDark: '#153F31',
  gold: '#C9A227',       // favourites / save accent
  clay: '#8A8578',       // muted secondary text, borders
  clayLight: '#E4E0D6',  // hairline borders, dividers
  error: '#B3402A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

// Two type families with distinct jobs:
// - serif ("display") for dress names / editorial headings -> catalogue feel
// - sans ("body") for everything functional: labels, buttons, inputs
// If these custom fonts aren't linked via expo-font, React Native silently
// falls back to the platform default (San Francisco / Roboto) - the app
// still works, it just loses the editorial flavor. See README for how to
// load them properly with expo-font.
export const fonts = {
  display: 'PlayfairDisplay-Bold',
  displayRegular: 'PlayfairDisplay-Regular',
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
};

export const type = {
  h1: { fontFamily: fonts.display, fontSize: 32, color: colors.ink, lineHeight: 38 },
  h2: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, lineHeight: 30 },
  dressName: { fontFamily: fonts.displayRegular, fontSize: 17, color: colors.ink, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, lineHeight: 21 },
  caption: { fontFamily: fonts.body, fontSize: 13, color: colors.clay, lineHeight: 18 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.clay, letterSpacing: 0.2 },
  button: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.bone },
};
