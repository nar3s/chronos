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
import { Ionicons } from '@expo/vector-icons';
import type { Reflection } from '@/src/store/memoryStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

interface Props {
  cleanGlyphs?: boolean;
  hasApiKey: boolean;
  todayInsight: string | null;
  recentReflections: Reflection[];
  onGenerateInsight: () => Promise<void>;
  onAddReflection: (text: string) => void;
}

export function CompanionCard({
  hasApiKey,
  todayInsight,
  recentReflections,
  onGenerateInsight,
  onAddReflection,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      await onGenerateInsight();
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate insight');
    } finally {
      setLoading(false);
    }
  }

  function handleAddReflection() {
    if (!reflection.trim()) return;
    onAddReflection(reflection);
    setReflection('');
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
          <Text style={styles.title}>AI Companion</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={8}>
          <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
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
          <Text style={styles.setupCta}>Set up</Text>
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
              <View style={styles.refreshContent}>
                <Ionicons name="refresh" size={13} color={colors.accent} />
                <Text style={styles.refreshText}>Refresh</Text>
              </View>
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
            <View style={styles.generateContent}>
              <Ionicons name="sparkles-outline" size={16} color="#fff" />
              <Text style={styles.generateBtnText}>Generate today's insight</Text>
            </View>
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
    borderRadius: 14,
    padding: spacing.md,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  refreshContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  generateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
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
