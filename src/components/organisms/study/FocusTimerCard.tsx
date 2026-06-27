import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const DURATION_OPTIONS = [25, 45, 60];
type Phase = 'idle' | 'running' | 'paused' | 'done';

const RING_SIZE = 76;
const STROKE = 6;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function TimerRing({
  secondsLeft,
  totalSeconds,
  phase,
}: {
  secondsLeft: number;
  totalSeconds: number;
  phase: Phase;
}) {
  const r = (RING_SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const offset = circumference * (1 - progress);
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const ringColor = phase === 'done' ? colors.success : colors.accent;

  return (
    <View style={ringStyles.wrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth={STROKE}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      {phase === 'done' ? (
        <Ionicons name="checkmark" size={26} color={colors.success} />
      ) : (
        <Text style={ringStyles.text}>
          {pad(mins)}:{pad(secs)}
        </Text>
      )}
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
});

export function FocusTimerCard() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function tick() {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase('done');
        return 0;
      }
      return prev - 1;
    });
  }

  function startTimer() {
    const total = selectedDuration * 60;
    setTotalSeconds(total);
    setSecondsLeft(total);
    setPhase('running');
    intervalRef.current = setInterval(tick, 1000);
  }

  function pauseTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('paused');
  }

  function resumeTimer() {
    setPhase('running');
    intervalRef.current = setInterval(tick, 1000);
  }

  function resetTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('idle');
    setSecondsLeft(selectedDuration * 60);
    setTotalSeconds(selectedDuration * 60);
  }

  function handleDurationSelect(mins: number) {
    if (phase !== 'idle') return;
    setSelectedDuration(mins);
    setSecondsLeft(mins * 60);
    setTotalSeconds(mins * 60);
  }

  function handleLog() {
    resetTimer();
    router.push(`/modals/log-session?prefillMinutes=${selectedDuration}` as any);
  }

  const isIdle = phase === 'idle';
  const isRunning = phase === 'running';
  const isPaused = phase === 'paused';
  const isDone = phase === 'done';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>FOCUS TIMER</Text>
        {isRunning ? (
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Running</Text>
          </View>
        ) : isPaused ? (
          <View style={[styles.statusBadge, styles.statusBadgePaused]}>
            <Text style={[styles.statusText, styles.statusTextPaused]}>
              Paused
            </Text>
          </View>
        ) : isDone ? (
          <View style={[styles.statusBadge, styles.statusBadgeDone]}>
            <Text style={[styles.statusText, styles.statusTextDone]}>
              Complete
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <TimerRing
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          phase={phase}
        />

        <View style={styles.controlsCol}>
          {isIdle ? (
            <>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationChip,
                      selectedDuration === d && styles.durationChipActive,
                    ]}
                    onPress={() => handleDurationSelect(d)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        selectedDuration === d && styles.durationTextActive,
                      ]}
                    >
                      {d}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={startTimer}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.primaryBtnText}>Start</Text>
              </TouchableOpacity>
            </>
          ) : isDone ? (
            <>
              <Text style={styles.doneText}>
                {selectedDuration} min focused
              </Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.primaryBtnSmall}
                  onPress={handleLog}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Log</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ghostBtnSmall}
                  onPress={resetTimer}
                  activeOpacity={0.75}
                >
                  <Text style={styles.ghostBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.primaryBtnSmall}
                onPress={isRunning ? pauseTimer : resumeTimer}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isRunning ? 'pause' : 'play'}
                  size={14}
                  color="#fff"
                />
                <Text style={styles.primaryBtnText}>
                  {isRunning ? 'Pause' : 'Resume'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostBtnSmall}
                onPress={resetTimer}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="refresh"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text style={styles.ghostBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${colors.success}1A`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgePaused: {
    backgroundColor: `${colors.warning}1A`,
  },
  statusBadgeDone: {
    backgroundColor: `${colors.success}1A`,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.2,
  },
  statusTextPaused: {
    color: colors.warning,
  },
  statusTextDone: {
    color: colors.success,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  controlsCol: {
    flex: 1,
    gap: 10,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 6,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: `${colors.accent}24`,
    borderColor: colors.accent,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  durationTextActive: {
    color: colors.accent,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
  },
  ghostBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  doneText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
