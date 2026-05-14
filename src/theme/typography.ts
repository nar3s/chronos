import { Platform } from 'react-native';

const monoFont = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  heading: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#F5F5F5',
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#F5F5F5',
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#F5F5F5',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#A0A0A0',
  },
  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#666666',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  mono: {
    fontFamily: monoFont,
    fontWeight: '700' as const,
  },
} as const;
