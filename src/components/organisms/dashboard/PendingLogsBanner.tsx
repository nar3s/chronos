import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';

interface Props {
  isBlockerEnabled: boolean;
  isStudyDone: boolean;
  isGymDone: boolean;
  isProteinDone: boolean;
  isServiceEnabled: boolean;
  onOpenSettings: () => void;
}

export function PendingLogsBanner({
  isBlockerEnabled,
  isStudyDone,
  isGymDone,
  isProteinDone,
  isServiceEnabled,
  onOpenSettings,
}: Props) {
  const [isAfter9PM, setIsAfter9PM] = useState(false);

  useEffect(() => {
    const check = () => setIsAfter9PM(new Date().getHours() >= 21);
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isBlockerEnabled) return null;

  // Before 9 PM: only show the setup prompt if service is not enabled
  if (!isAfter9PM) {
    if (isServiceEnabled) return null;
    return (
      <Animated.View style={styles.setupContainer} entering={FadeInDown.duration(400)}>
        <Text style={styles.setupTitle}>⚙️ App Blocker Setup</Text>
        <Text style={styles.setupText}>
          Enable the Accessibility Service so Chronos can block distracting apps after 9 PM when logs are pending.
        </Text>
        <TouchableOpacity style={styles.setupBtn} onPress={onOpenSettings} activeOpacity={0.8}>
          <Text style={styles.setupBtnText}>Open Accessibility Settings</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const isPending = !(isStudyDone && isGymDone && isProteinDone);
  if (!isPending) return null;

  const missing: string[] = [];
  if (!isStudyDone) missing.push('Study');
  if (!isGymDone) missing.push('Gym');
  if (!isProteinDone) missing.push('Protein');

  // After 9 PM and logs are pending: show red block banner
  return (
    <Animated.View style={styles.blockContainer} entering={FadeInDown.duration(400)}>
      <Text style={styles.blockTitle}>🚨 Logs Pending</Text>
      <Text style={styles.blockText}>
        {isServiceEnabled
          ? `${missing.join(', ')} not logged — other apps are blocked.`
          : `${missing.join(', ')} not logged. Enable accessibility service to block distracting apps.`}
      </Text>
      {!isServiceEnabled && (
        <TouchableOpacity style={styles.setupBtnSmall} onPress={onOpenSettings} activeOpacity={0.8}>
          <Text style={styles.setupBtnText}>Enable Blocker</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  setupContainer: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: `${colors.accent}60`,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  setupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 6,
  },
  setupText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  setupBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  setupBtnSmall: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 8,
  },
  setupBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  blockContainer: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 4,
  },
  blockText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 18,
  },
});
