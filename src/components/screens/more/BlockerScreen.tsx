import { useAccessibilityStatus } from "@/src/hooks/useAccessibilityStatus";
import { useDailySnapshot } from "@/src/hooks/useDailySnapshot";
import { useSettingsStore } from "@/src/store/settingsStore";
import { colors } from "@/src/theme/colors";
import { spacing } from "@/src/theme/spacing";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const PRESET_APPS: {
  id: string;
  label: string;
  icon: string;
  packageName: string;
}[] = [
  {
    id: "instagram",
    label: "Instagram",
    icon: "📸",
    packageName: "com.instagram.android",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: "▶️",
    packageName: "com.google.android.youtube",
  },
  {
    id: "twitter",
    label: "Twitter / X",
    icon: "𝕏",
    packageName: "com.twitter.android",
  },
  {
    id: "reddit",
    label: "Reddit",
    icon: "🤖",
    packageName: "com.reddit.frontpage",
  },
];

export function BlockerScreen() {
  const settings = useSettingsStore();
  const snapshot = useDailySnapshot();
  const { isEnabled: isServiceEnabled, openSettings } =
    useAccessibilityStatus();

  // Local state — committed to store on toggle
  const blockerEnabled = settings.blockerConfig?.enabled ?? false;
  const blockedPackages: string[] = settings.blockerConfig?.blockedPackages ?? [
    "com.instagram.android",
    "com.google.android.youtube",
    "com.zhiliaoapp.musically",
    "com.twitter.android",
    "com.facebook.katana",
  ];

  const [isAfter9PM, setIsAfter9PM] = useState(false);

  useEffect(() => {
    const check = () => setIsAfter9PM(new Date().getHours() >= 21);
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  function toggleBlocker(value: boolean) {
    settings.setBlockerConfig({ ...settings.blockerConfig, enabled: value });
  }

  function toggleApp(packageName: string) {
    const current = blockedPackages;
    const next = current.includes(packageName)
      ? current.filter((p) => p !== packageName)
      : [...current, packageName];
    settings.setBlockerConfig({
      ...settings.blockerConfig,
      blockedPackages: next,
    });
  }

  const isStudyDone = snapshot.todayStudyMinutes > 0;
  const isGymDone = snapshot.isGymDoneToday;
  const isProteinDone = snapshot.todayProteinGrams > 0;
  const missing: string[] = [];

  if (!isStudyDone) missing.push("Study");
  if (!isGymDone) missing.push("Gym");
  if (!isProteinDone) missing.push("Protein");

  const isFullyLogged = missing.length === 0;
  const statusSubtext = blockerEnabled
    ? isAfter9PM
      ? isFullyLogged
        ? "Today's logs are complete - blocker is idle"
        : `${missing.join(", ")} pending - blocked apps will redirect`
      : isFullyLogged
        ? "Today's logs are complete"
        : `${missing.join(", ")} pending - blocker arms after 9 PM`
    : "Blocker is paused - toggle on to arm";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Banner */}
      <Animated.View entering={FadeInDown.duration(400).delay(0)}>
        {isServiceEnabled ? (
          <View style={[styles.statusBanner, styles.statusOk]}>
            <Text style={styles.statusIcon}>🛡️</Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                Accessibility Service Active
              </Text>
              <Text style={styles.statusSub}>{statusSubtext}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.statusBanner, styles.statusWarn]}
            onPress={openSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.statusIcon}>⚠️</Text>
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: colors.warning }]}>
                Accessibility Permission Required
              </Text>
              <Text style={styles.statusSub}>
                Tap to open Android Accessibility Settings →
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Master Toggle */}
      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <Text style={styles.sectionLabel}>BLOCKER</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Enable Distraction Blocker</Text>
              <Text style={styles.rowSub}>
                Arms after 9 PM when daily logs are incomplete
              </Text>
            </View>
            <Switch
              value={blockerEnabled}
              onValueChange={toggleBlocker}
              trackColor={{ false: colors.border, true: `${colors.accent}90` }}
              thumbColor={blockerEnabled ? colors.accent : "#888"}
            />
          </View>
        </View>
      </Animated.View>

      {/* How it works */}
      <Animated.View entering={FadeInDown.duration(400).delay(160)}>
        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
        <View style={styles.card}>
          {[
            { step: "1", text: "Grant Accessibility Service permission above" },
            { step: "2", text: "Toggle the blocker on" },
            {
              step: "3",
              text: "After 9 PM, if Study / Gym / Protein are not logged, selected apps redirect to Chronos",
            },
            {
              step: "4",
              text: "Once all logs are done, the block lifts automatically",
            },
          ].map((item) => (
            <View key={item.step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* App Blocklist */}
      <Animated.View entering={FadeInDown.duration(400).delay(240)}>
        <Text style={styles.sectionLabel}>BLOCKED APPS</Text>
        <View style={styles.card}>
          {PRESET_APPS.map((app) => {
            const isBlocked = blockedPackages.includes(app.packageName);
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.appRow}
                onPress={() => toggleApp(app.packageName)}
                activeOpacity={0.7}
              >
                <Text style={styles.appIcon}>{app.icon}</Text>
                <Text style={styles.appLabel}>{app.label}</Text>
                <View
                  style={[styles.appCheck, isBlocked && styles.appCheckActive]}
                >
                  {isBlocked && <Text style={styles.appCheckMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.packageHint}>
            {blockedPackages.length} app
            {blockedPackages.length !== 1 ? "s" : ""} selected
          </Text>
        </View>
      </Animated.View>

      {Platform.OS !== "android" && (
        <Text style={styles.platformNote}>
          ⚠️ Distraction Blocker is Android-only. Build via EAS to test.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, paddingBottom: 40 },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
  },
  statusOk: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderColor: `${colors.success}60`,
  },
  statusWarn: {
    backgroundColor: "rgba(245,158,11,0.08)",
    borderColor: `${colors.warning}60`,
  },
  statusIcon: { fontSize: 28 },
  statusText: { flex: 1 },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.success,
    marginBottom: 2,
  },
  statusSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.base,
    marginBottom: spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 3,
  },
  rowSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 7,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${colors.accent}20`,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  appRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  appIcon: { fontSize: 20, width: 28, textAlign: "center" },
  appLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  appCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  appCheckActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  appCheckMark: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  packageHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 10,
    textAlign: "right",
  },

  platformNote: {
    fontSize: 12,
    color: colors.warning,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
});
