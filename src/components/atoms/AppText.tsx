import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { typography } from '@/src/theme/typography';
import { colors } from '@/src/theme/colors';

type Variant = 'heading' | 'subheading' | 'body' | 'caption' | 'label' | 'mono';

interface Props {
  variant?: Variant;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
  numberOfLines?: number;
}

export function AppText({ variant = 'body', color, style, children, numberOfLines }: Props) {
  return (
    <Text
      style={[styles[variant], color ? { color } : undefined, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.heading },
  subheading: { ...typography.subheading },
  body: { ...typography.body },
  caption: { ...typography.caption },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mono: {
    ...typography.mono,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
