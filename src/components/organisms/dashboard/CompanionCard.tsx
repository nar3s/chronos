import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useStudyStore } from '@/src/store/studyStore';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useMemoryStore } from '@/src/store/memoryStore';
import { generateInsight, type SessionNote } from '@/src/services/aiCompanion';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export function CompanionCard() {
  const study = useStudyStore();
  const gym = useGymStore();
  const nutrition = useNutritionStore();
  const settings = useSettingsStore();
  const memory = useMemoryStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');

  const today = getToday();
  const todayInsight = memory.dailyInsight?.date === today ? memory.dailyInsight.text : null;
  const hasApiKey = !!settings.llmApiKey.trim();
  const recentReflections = memory.getRecentReflections(3);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const weeklyStats = study.getWeeklyStats();
      const sleepLog = gym.getTodaySleepLog();
      const todayNutrition = nutrition.getTodayLog();
      const todaySession = gym.getTodaySession();

      const recentSessionNotes: SessionNote[] = study
        .getRecentSessions(20)
        .filter((s) => s.notes && s.notes.trim().length > 0)
        .slice(0, 5)
        .map((s) => ({
          date: s.date,
          topic: s.topic,
          subtopic: s.subtopic,
          notes: s.notes!,
        }));

      const text = await generateInsight(settings.llmProvider, settings.llmApiKey, {
        studyMinutesToday: study.getTodayMinutes(),
        studyStreak: study.getMorningBlockStreak(),
        weeklyStudyMinutes: weeklyStats.totalMinutes,
        weeklyStudyGoalMinutes: settings.goals.weeklyStudyHours * 60,
        gymCompletedToday: todaySession?.completed ?? false,
        sleepHours: sleepLog ? Math.round((sleepLog.durationMinutes / 60) * 10) / 10 : null,
        proteinGrams: todayNutrition?.proteinGrams ?? null,
        dailyProteinGoal: settings.goals.dailyProteinGrams,
        recentSessionNotes,
        recentReflections: memory.getRecentReflections(3),
      });

      memory.setDailyInsight(text);
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate insight');
    } finally {
      setLoading(false);
    }
  }

  function handleAddReflection() {
    if (!reflection.trim()) return;
    memory.addReflection(reflection);
    setReflection('');
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>✦ AI Companion</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={8}>
          <Text style={styles.gearIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {!hasApiKey ? (
        <TouchableOpacity
          style={styles.setupPrompt}
          onPress={() => router.push('/settings')}
          activeOpacity={0.8}
        >
          <Text style={styles.setupText}>
            Get personalized daily insights. Add your Gemini or OpenAI key in Settings.
          </Text>
          <Text style={styles.setupCta}>Set up →</Text>
        </TouchableOpacity>
      ) : todayInsight ? (
        <View style={styles.insightBox}>
          <Text style={styles.insightText}>{todayInsight}</Text>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={loading}
            style={styles.refreshRow}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={styles.refreshText}>↻ Refresh</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnLoading]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>✦ Generate today's insight</Text>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.reflectRow}>
        <TextInput
          style={styles.reflectInput}
          value={reflection}
          onChangeText={setReflection}
          placeholder="Add a reflection..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={handleAddReflection}
        />
        <TouchableOpacity
          style={[styles.reflectBtn, !reflection.trim() && styles.reflectBtnDisabled]}
          onPress={handleAddReflection}
          disabled={!reflection.trim()}
        >
          <Text style={styles.reflectBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {recentReflections.length > 0 && (
        <View style={styles.reflectionsList}>
          {recentReflections.map((r) => (
            <View key={r.id} style={styles.reflectionItem}>
              <Text style={styles.reflectionDate}>{r.date}</Text>
              <Text style={styles.reflectionText} numberOfLines={2}>
                {r.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gearIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  setupPrompt: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  setupText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  setupCta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  insightBox: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  insightText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  refreshRow: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  refreshText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  generateBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  generateBtnLoading: {
    opacity: 0.7,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  reflectRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  reflectInput: {
    flex: 1,
    backgroundColor: colors.cardElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reflectBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  reflectBtnDisabled: {
    opacity: 0.35,
  },
  reflectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  reflectionsList: {
    marginTop: spacing.md,
    gap: 6,
  },
  reflectionItem: {
    backgroundColor: colors.cardElevated,
    borderRadius: 8,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reflectionDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  reflectionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
