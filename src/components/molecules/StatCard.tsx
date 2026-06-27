import { colors } from "@/src/theme/colors";
import { ProgressBar } from "@/src/components/atoms/ProgressBar";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface Props {
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
  style?: ViewStyle;
  progress?: number;
  progressColor?: string;
  emptyActionLabel?: string;
  onPress?: () => void;
  delta?: {
    direction: "up" | "down" | "flat";
    label: string;
  };
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const STAT_ICONS: Record<string, IconName> = {
  STUDY: "book-outline",
  HABITS: "checkmark-circle-outline",
  PROTEIN: "restaurant-outline",
  SLEEP: "moon-outline",
  GYM: "barbell-outline",
  JOURNAL: "journal-outline",
};

export function StatCard({
  label,
  value,
  unit,
  valueColor,
  style,
  progress,
  progressColor,
  emptyActionLabel,
  onPress,
  delta,
}: Props) {
  const isEmpty = value === "--";
  const showAction = isEmpty && !!emptyActionLabel;
  const barColor = progressColor ?? valueColor ?? colors.accent;
  const iconName = STAT_ICONS[label] ?? "analytics-outline";
  const clampedProgress =
    progress === undefined ? undefined : Math.max(0, Math.min(1, progress));
  const isComplete = clampedProgress !== undefined && clampedProgress >= 1;

  const content = (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.iconChip,
            {
              backgroundColor: `${barColor}18`,
              borderColor: isComplete ? `${barColor}66` : colors.border,
            },
          ]}
        >
          <Ionicons name={iconName} size={14} color={barColor} />
        </View>
      </View>

      <View style={styles.body}>
        {showAction ? (
          <Text style={styles.actionValue} numberOfLines={1}>
            {emptyActionLabel}
          </Text>
        ) : (
          <Text
            style={[
              styles.value,
              valueColor ? { color: valueColor } : undefined,
            ]}
          >
            {value}
          </Text>
        )}
        {unit && !showAction ? (
          <Text style={styles.unit} numberOfLines={1}>
            {unit}
          </Text>
        ) : null}
        {delta && !showAction ? (
          <View style={styles.deltaRow}>
            <Ionicons
              name={
                delta.direction === "up"
                  ? "arrow-up"
                  : delta.direction === "down"
                    ? "arrow-down"
                    : "remove"
              }
              size={11}
              color={
                delta.direction === "up"
                  ? colors.success
                  : delta.direction === "down"
                    ? colors.danger
                    : colors.textMuted
              }
            />
            <Text
              style={[
                styles.delta,
                {
                  color:
                    delta.direction === "up"
                      ? colors.success
                      : delta.direction === "down"
                        ? colors.danger
                        : colors.textMuted,
                },
              ]}
              numberOfLines={1}
            >
              {delta.label}
            </Text>
          </View>
        ) : null}
      </View>

      {clampedProgress !== undefined ? (
        <View style={styles.progressWrap}>
          <ProgressBar value={clampedProgress} max={1} color={barColor} height={4} />
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "space-between",
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  body: {
    marginTop: 8,
    gap: 2,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  actionValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent,
  },
  unit: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  delta: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  progressWrap: {
    marginTop: 12,
  },
});
