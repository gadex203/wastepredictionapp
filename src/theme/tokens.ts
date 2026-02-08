export const colors = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#0F172A',
  muted: '#475569',
  border: '#E5E7EB',
  primary: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',

  yellow: '#FACC15',
  blue: '#3B82F6',
  green: '#22C55E',
  gray: '#94A3B8',
  red: '#EF4444',
  brown: '#A16207',
  neutral: '#CBD5E1',
} as const;

export const radii = {
  card: 16,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
} as const;

