import type { DailySnapshot } from "@/src/domain/types/snapshot";
import { colors } from "@/src/theme/colors";
import { spacing } from "@/src/theme/spacing";
import { formatDisplayDate, getToday } from "@/src/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BottomSheet } from "@/src/components/molecules/BottomSheet";
import {
  SkipTodaySheet,
  type SkipTodayData,
} from "@/src/components/molecules/SkipTodaySheet";
import React, { useEffect, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface Props {
  snapshot: DailySnapshot | null;
  streak: number;
  userName: string;
  skipData: SkipTodayData;
  onUpdateIntention: (intention: string) => void;
  onToggleSkip: (
    key: "studySkipped" | "gymSkipped" | "proteinSkipped",
    next: boolean
  ) => void;
}

function greetingFor(hour: number): string {
  if (hour >= 4 && hour < 10) return "Good morning";
  if (hour >= 10 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Up late";
}

export function TodayHeroCard({
  snapshot,
  streak,
  userName,
  skipData,
  onUpdateIntention,
  onToggleSkip,
}: Props) {
  const intention = snapshot?.intention ?? "";
  const morningStarted = snapshot?.morningBlockStarted ?? false;
  const morningTime = snapshot?.morningBlockTime;

  const [hour, setHour] = useState(() => new Date().getHours());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setHour(new Date().getHours());
    const interval = setInterval(refresh, 60 * 1000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = 0.7;
    scale.value = withSpring(1, { damping: 9, stiffness: 140, mass: 0.5 });
  }, [streak, scale]);
  const streakAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const greeting = greetingFor(hour);
  const streakSubtitle =
    streak === 0 ? "start today" : streak < 3 ? `day ${streak}` : "day streak";

  function openEdit() {
    setDraft(intention);
    setEditing(true);
  }
  function handleSave() {
    onUpdateIntention(draft.trim());
    setEditing(false);
  }

  return (
    <>
      <LinearGradient
        colors={["#1a1f2e", "#15171f", "#101218"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.date}>{formatDisplayDate(getToday())}</Text>
        <Text style={styles.greetingLine}>
          {greeting}, <Text style={styles.nameInline}>{userName}</Text>
        </Text>

        <View style={styles.divider} />

        <View style={styles.morningRow}>
          <View style={styles.morningLeft}>
            <Text style={styles.sectionLabel}>MORNING BLOCK</Text>
            <Text style={styles.morningValue}>
              {morningStarted
                ? `Started ${formatClock(morningTime ?? "--:--")}`
                : "Not started yet"}
            </Text>
            {morningStarted ? (
              <View style={styles.onTimeRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color={colors.success}
                />
                <Text style={styles.onTime}>On time</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.morningRight}>
            <Animated.Text style={[styles.streakNum, streakAnim]}>
              {streak}
            </Animated.Text>
            <Text style={styles.streakLabel}>{streakSubtitle}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.intentionTouch}
          onPress={openEdit}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionLabel}>TODAY'S INTENTION</Text>
          {intention ? (
            <Text style={styles.intentionText} numberOfLines={2}>
              {intention}
            </Text>
          ) : (
            <View style={styles.intentionEmptyRow}>
              <Text style={styles.intentionEmpty}>
                Tap to set your focus for today
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textSecondary}
              />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => setManageOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.manageText}>Manage today</Text>
        </TouchableOpacity>
      </LinearGradient>

      <SkipTodaySheet
        visible={manageOpen}
        data={skipData}
        onClose={() => setManageOpen(false)}
        onToggle={onToggleSkip}
      />

      <BottomSheet visible={editing} onClose={() => setEditing(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Today's intention</Text>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="What do you want to focus on today?"
              placeholderTextColor={colors.textMuted}
              autoFocus
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{draft.length}/200</Text>
            <TouchableOpacity
              style={[styles.saveBtn, !draft.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!draft.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    </>
  );
}

function formatClock(t: string): string {
  if (t === "--:--") return t;
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.accent}1A`,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  greetingLine: {
    fontSize: 22,
    fontWeight: "500",
    color: colors.textSecondary,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  nameInline: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  morningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  morningLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  morningValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  onTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  onTime: {
    fontSize: 11,
    color: colors.success,
    fontWeight: "600",
  },
  morningRight: {
    alignItems: "center",
    minWidth: 56,
  },
  streakNum: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.success,
    fontVariant: ["tabular-nums"],
    lineHeight: 30,
  },
  streakLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  intentionTouch: {
    paddingVertical: 2,
  },
  intentionText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  intentionEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  intentionEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    fontStyle: "italic",
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  manageText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 12,
    padding: spacing.base,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 4,
    marginBottom: spacing.base,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
