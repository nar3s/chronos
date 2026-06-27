import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

interface Props {
  onGrant(): void;
}

export function ExactAlarmBanner({ onGrant }: Props) {
  return (
    <View style={styles.banner}>
      <View style={styles.iconBox}>
        <Ionicons name="alarm-outline" size={18} color={colors.warning} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Allow exact alarms</Text>
        <Text style={styles.desc}>
          Scheduled wallpaper changes need exact-alarm permission to fire on time.
        </Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={onGrant} activeOpacity={0.8}>
        <Text style={styles.btnText}>Grant</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${colors.warning}14`,
    borderWidth: 1,
    borderColor: `${colors.warning}33`,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.warning}18`,
  },
  text: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  desc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  btn: {
    backgroundColor: colors.warning,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
