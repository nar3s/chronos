import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, AppState, Modal, Pressable, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { ProgressBar } from '@/src/components/atoms/ProgressBar';
import { useScreenTime } from '@/src/hooks/useScreenTime';
import { useSettingsStore } from '@/src/store/settingsStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { minutesToHHMM } from '@/src/utils/formatters';

interface BudgetModal {
  packageName: string;
  appName: string;
  currentMinutes: number;
}

function budgetColor(pct: number): string {
  if (pct >= 1) return colors.danger;
  if (pct >= 0.8) return colors.warning;
  return colors.success;
}

export function ScreenTimeScreen() {
  const {
    isSupported, isPermissionGranted, isLoading, data,
    mode, setMode, targetDate, setTargetDate,
    refresh, openSettings,
  } = useScreenTime();

  const screenTimeBudgets = useSettingsStore((s) => s.screenTimeBudgets);
  const setScreenTimeBudget = useSettingsStore((s) => s.setScreenTimeBudget);

  const [budgetModal, setBudgetModal] = useState<BudgetModal | null>(null);
  const [budgetInput, setBudgetInput] = useState('');

  const handlePrev = () => {
    const d = new Date(targetDate);
    if (mode === 'daily') d.setDate(d.getDate() - 1);
    else d.setMonth(d.getMonth() - 1);
    setTargetDate(d);
  };

  const handleNext = () => {
    const d = new Date(targetDate);
    if (mode === 'daily') d.setDate(d.getDate() + 1);
    else d.setMonth(d.getMonth() + 1);
    setTargetDate(d);
  };

  const formattedDate = mode === 'daily'
    ? targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  function openBudgetModal(packageName: string, appName: string) {
    const current = screenTimeBudgets[packageName] ?? 0;
    setBudgetInput(current > 0 ? String(current) : '');
    setBudgetModal({ packageName, appName, currentMinutes: current });
  }

  function saveBudget() {
    if (!budgetModal) return;
    const mins = parseInt(budgetInput, 10);
    setScreenTimeBudget(budgetModal.packageName, isNaN(mins) || mins <= 0 ? 0 : mins);
    setBudgetModal(null);
  }

  function clearBudget() {
    if (!budgetModal) return;
    setScreenTimeBudget(budgetModal.packageName, 0);
    setBudgetModal(null);
  }

  if (!isSupported) {
    return (
      <ScreenTemplate>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Screen Time</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="phone-portrait-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Not Supported</Text>
          <Text style={styles.errorText}>Screen time tracking is only available on Android native builds.</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Screen Time</Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isLoading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : !isPermissionGranted ? (
        <Animated.View entering={FadeIn} style={styles.permissionCard}>
          <Ionicons name="shield-checkmark" size={48} color={colors.accent} style={{ marginBottom: 16 }} />
          <Text style={styles.permissionTitle}>Usage Access Required</Text>
          <Text style={styles.permissionText}>
            To track your screen time, the app needs permission to read Android's usage statistics.
          </Text>
          <Text style={styles.permissionSubText}>
            Tap below to open Android Settings, select this app, and turn on "Permit usage access".
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={openSettings}>
            <Text style={styles.permissionBtnText}>Open Settings</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {data && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, mode === 'daily' && styles.toggleBtnActive]}
                  onPress={() => setMode('daily')}
                >
                  <Text style={[styles.toggleText, mode === 'daily' && styles.toggleTextActive]}>Daily</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, mode === 'monthly' && styles.toggleBtnActive]}
                  onPress={() => setMode('monthly')}
                >
                  <Text style={[styles.toggleText, mode === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateNav}>
                <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.dateText}>{formattedDate}</Text>
                <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Total Screen Time</Text>
                <Text style={styles.heroValue}>{minutesToHHMM(Math.floor(data.totalMs / 60000))}</Text>
              </View>

              <Text style={styles.sectionTitle}>App Usage</Text>

              <View style={styles.listCard}>
                {data.apps.length === 0 ? (
                  <Text style={styles.emptyText}>No significant app usage recorded.</Text>
                ) : (
                  data.apps.map((app, index) => {
                    const mins = Math.floor(app.timeInForegroundMs / 60000);
                    const pct = data.totalMs > 0 ? (app.timeInForegroundMs / data.totalMs) * 100 : 0;
                    const budgetMins = screenTimeBudgets[app.packageName] ?? 0;
                    const budgetPct = budgetMins > 0 ? mins / budgetMins : 0;
                    const barColor = budgetColor(budgetPct);

                    return (
                      <View key={app.packageName} style={[styles.appRow, index !== data.apps.length - 1 && styles.appRowBorder]}>
                        <View style={styles.appRowHeader}>
                          <Text style={styles.appName} numberOfLines={1}>{app.appName}</Text>
                          <View style={styles.appRowRight}>
                            <Text style={styles.appTime}>{minutesToHHMM(mins)}</Text>
                            <TouchableOpacity
                              onPress={() => openBudgetModal(app.packageName, app.appName)}
                              style={styles.limitBtn}
                            >
                              <Text style={styles.limitBtnText}>
                                {budgetMins > 0 ? 'Edit' : 'Set limit'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {budgetMins > 0 ? (
                          <>
                            <ProgressBar
                              value={mins}
                              max={budgetMins}
                              color={barColor}
                              height={6}
                            />
                            <View style={styles.budgetRow}>
                              <Text style={[styles.budgetPct, { color: barColor }]}>
                                {Math.round(budgetPct * 100)}%
                                {budgetPct >= 1 ? ' OVER' : ''}
                              </Text>
                              <Text style={styles.budgetLimit}>of {minutesToHHMM(budgetMins)} limit</Text>
                            </View>
                          </>
                        ) : (
                          <View style={styles.barContainer}>
                            <View style={[styles.barFill, { width: `${pct}%` }]} />
                          </View>
                        )}

                        <Text style={styles.appPackage}>{app.packageName}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* Budget setter modal */}
      <Modal visible={!!budgetModal} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setBudgetModal(null)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Daily Limit</Text>
            <Text style={styles.sheetApp}>{budgetModal?.appName}</Text>
            <Text style={styles.sheetLabel}>Maximum minutes per day</Text>
            <TextInput
              style={styles.sheetInput}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="number-pad"
              placeholder="e.g. 30"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveBudget} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Limit</Text>
            </TouchableOpacity>
            {(budgetModal?.currentMinutes ?? 0) > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearBudget} activeOpacity={0.8}>
                <Text style={styles.clearBtnText}>Remove Limit</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  permissionCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: spacing.xl,
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  permissionText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  permissionSubText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  permissionBtn: { backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggleContainer: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12,
    padding: 4, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: colors.cardElevated },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: colors.textPrimary },
  dateNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.lg, paddingHorizontal: 8,
  },
  navBtn: { padding: 8, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  dateText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  heroCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  heroLabel: { fontSize: 14, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  heroValue: { fontSize: 42, fontWeight: '800', color: colors.textPrimary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  listCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  appRow: { paddingVertical: 14 },
  appRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  appRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  appRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1, paddingRight: 8 },
  appTime: { fontSize: 15, fontWeight: '700', color: colors.accent },
  limitBtn: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  limitBtnText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  budgetPct: { fontSize: 12, fontWeight: '700' },
  budgetLimit: { fontSize: 11, color: colors.textMuted },
  appPackage: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  barContainer: { height: 6, backgroundColor: colors.cardElevated, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheetWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, paddingBottom: spacing.xxxl,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  sheetApp: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.base },
  sheetLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  sheetInput: {
    backgroundColor: colors.cardElevated, borderRadius: 12, padding: spacing.base,
    fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: spacing.base },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  clearBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: spacing.sm },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: colors.danger },
});
