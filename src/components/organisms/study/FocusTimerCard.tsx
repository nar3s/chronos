import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const DURATION_OPTIONS = [25, 45, 60];
type Phase = 'idle' | 'running' | 'paused' | 'done';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function TimerRing({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const size = 120;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const offset = circumference * (1 - progress);
  const cx = size / 2;
  const cy = size / 2;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#2A2A2A" strokeWidth={strokeWidth} />
        <Circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <Text style={styles.timerText}>{pad(mins)}:{pad(secs)}</Text>
    </View>
  );
}

export function FocusTimerCard() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function startTimer() {
    const total = selectedDuration * 60;
    setTotalSeconds(total);
    setSecondsLeft(total);
    setPhase('running');
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pauseTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('paused');
  }

  function resumeTimer() {
    setPhase('running');
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Focus Timer</Text>
        {phase === 'running' && (
          <View style={styles.runningBadge}>
            <Text style={styles.runningText}>● RUNNING</Text>
          </View>
        )}
      </View>

      {phase === 'done' ? (
        <View style={styles.doneSection}>
          <Text style={styles.doneEmoji}>✓</Text>
          <Text style={styles.doneTitle}>Session complete — {selectedDuration} min</Text>
          <View style={styles.doneButtons}>
            <TouchableOpacity style={styles.logBtn} onPress={handleLog} activeOpacity={0.8}>
              <Text style={styles.logBtnText}>Log this session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissBtn} onPress={resetTimer} activeOpacity={0.8}>
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.ringWrapper}>
            <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
          </View>

          <View style={styles.controls}>
            {phase === 'idle' && (
              <TouchableOpacity style={styles.primaryBtn} onPress={startTimer} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Start</Text>
              </TouchableOpacity>
            )}
            {phase === 'running' && (
              <>
                <TouchableOpacity style={styles.secondaryBtn} onPress={pauseTimer} activeOpacity={0.8}>
                  <Text style={styles.secondaryBtnText}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostBtn} onPress={resetTimer} activeOpacity={0.8}>
                  <Text style={styles.ghostBtnText}>Reset</Text>
                </TouchableOpacity>
              </>
            )}
            {phase === 'paused' && (
              <>
                <TouchableOpacity style={styles.primaryBtn} onPress={resumeTimer} activeOpacity={0.8}>
                  <Text style={styles.primaryBtnText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostBtn} onPress={resetTimer} activeOpacity={0.8}>
                  <Text style={styles.ghostBtnText}>Reset</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {phase === 'idle' && (
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationChip, selectedDuration === d && styles.durationChipActive]}
                  onPress={() => handleDurationSelect(d)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.durationText, selectedDuration === d && styles.durationTextActive]}>
                    {d}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  runningBadge: {
    backgroundColor: `${colors.success}20`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  runningText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  ringWrapper: {
    marginVertical: spacing.base,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  ghostBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  ghostBtnText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  durationChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  durationText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  durationTextActive: { color: '#fff' },
  doneSection: {
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  doneEmoji: {
    fontSize: 36,
    marginBottom: 8,
    color: colors.success,
  },
  doneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  doneButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  logBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  logBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  dismissBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dismissBtnText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
});
