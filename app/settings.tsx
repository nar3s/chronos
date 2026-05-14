import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore, LLMProvider } from '@/src/store/settingsStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function SettingsScreen() {
  const settings = useSettingsStore();

  const [apiKey, setApiKey] = useState(settings.llmApiKey);
  const [provider, setProvider] = useState<LLMProvider>(settings.llmProvider);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(
    String(settings.goals.weeklyStudyHours)
  );
  const [dailyProtein, setDailyProtein] = useState(
    String(settings.goals.dailyProteinGrams)
  );
  const [targetWeight, setTargetWeight] = useState(
    settings.goals.targetWeightKg !== null ? String(settings.goals.targetWeightKg) : ''
  );

  function handleSave() {
    settings.setLLMProvider(provider);
    settings.setLLMApiKey(apiKey.trim());
    settings.setGoals({
      weeklyStudyHours: Math.max(1, parseInt(weeklyStudyHours, 10) || 30),
      dailyProteinGrams: Math.max(1, parseInt(dailyProtein, 10) || 150),
      targetWeightKg: targetWeight.trim() ? parseFloat(targetWeight) || null : null,
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Settings</Text>

        {/* AI Section */}
        <Text style={styles.sectionHeader}>AI Companion</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Provider</Text>
          <View style={styles.chipRow}>
            {(['gemini', 'openai'] as LLMProvider[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, provider === p && styles.chipActive]}
                onPress={() => setProvider(p)}
              >
                <Text style={[styles.chipText, provider === p && styles.chipTextActive]}>
                  {p === 'gemini' ? 'Gemini (free)' : 'OpenAI'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>API Key</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={
              provider === 'gemini'
                ? 'AIza... (Google AI Studio)'
                : 'sk-... (OpenAI)'
            }
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            {provider === 'gemini'
              ? 'Get a free key at aistudio.google.com'
              : 'Get a key at platform.openai.com'}
          </Text>
        </View>

        {/* Goals Section */}
        <Text style={styles.sectionHeader}>Goals</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Weekly Study Target (hours)</Text>
          <TextInput
            style={styles.input}
            value={weeklyStudyHours}
            onChangeText={setWeeklyStudyHours}
            keyboardType="number-pad"
            placeholder="e.g. 30"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>Daily Protein Target (grams)</Text>
          <TextInput
            style={styles.input}
            value={dailyProtein}
            onChangeText={setDailyProtein}
            keyboardType="number-pad"
            placeholder="e.g. 150"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>Target Body Weight (kg, optional)</Text>
          <TextInput
            style={styles.input}
            value={targetWeight}
            onChangeText={setTargetWeight}
            keyboardType="decimal-pad"
            placeholder="e.g. 75"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.base,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    padding: spacing.base,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
