export const colors = {
  bg: '#0F0F0F',
  card: '#1A1A1A',
  cardElevated: '#242424',
  border: '#2A2A2A',

  accent: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',

  textPrimary: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
} as const;

export type ColorKey = keyof typeof colors;
