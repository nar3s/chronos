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
import { Ionicons } from '@expo/vector-icons';
import { TimePickerSheet } from '@/src/components/molecules/TimePickerSheet';
import { ProgressBar } from '@/src/components/atoms/ProgressBar';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { useSnapshotStore } from '@/src/store/snapshotStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { getToday } from '@/src/utils/dates';
import { pplLabel } from '@/src/utils/formatters';

function computeSleepMinutes(bedtime: Date, wakeTime: Date): number {
  let bedMins = bedtime.getHours() * 60 + bedtime.getMinutes();
  let wakeMins = wakeTime.getHours() * 60 + wakeTime.getMinutes();
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return wakeMins - bedMins;
}

function dateToTimeStr(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function timeStrToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTimeDisplay(d: Date): string {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

export default function LogWorkoutModal() {
  const gym = useGymStore();
  const nutrition = useNutritionStore();
  const snapshot = useSnapshotStore();

  const today = getToday();
  const existingSnapshot = snapshot.getTodaySnapshot();
  const existingNutrition = nutrition.getTodayLog();
  const existingSleep = gym.getTodaySleepLog();
  const existingWeight = gym.getLatestBodyWeight();
  const todaySession = gym.getTodaySession();

  const [protein, setProtein] = useState(
    existingNutrition ? String(existingNutrition.proteinGrams) : ''
  );
  const [proteinTarget, setProteinTarget] = useState(
    existingNutrition ? String(existingNutrition.targetGrams) : '160'
  );
  const [bedtime, setBedtime] = useState<Date>(
    existingSleep ? timeStrToDate(existingSleep.bedtime) : timeStrToDate('23:00')
  );
  const [wakeTime, setWakeTime] = useState<Date>(
    existingSleep ? timeStrToDate(existingSleep.wakeTime) : timeStrToDate('05:30')
  );
  const [showBedPicker, setShowBedPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [sleepEdited, setSleepEdited] = useState(!!existingSleep);
  const [weight, setWeight] = useState(
    existingWeight?.date === today ? String(existingWeight.weightKg) : ''
  );
  const [workoutDone, setWorkoutDone] = useState(
    todaySession?.completed ?? false
  );
  const [workoutSkipped, setWorkoutSkipped] = useState(
    existingSnapshot?.gymSkipped ?? false
  );

  // Add exercise form state
  const [newExName, setNewExName] = useState('');
  const [newExSets, setNewExSets] = useState('');
  const [newExReps, setNewExReps] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit exercise state
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');

  function handleToggleExercise(exerciseName: string) {
    if (!todaySession) return;
    gym.toggleExercise(todaySession.id, exerciseName);
  }

  function handleAddExercise() {
    if (!todaySession || !newExName.trim()) return;
    const sets = parseInt(newExSets, 10) || 3;
    const reps = parseInt(newExReps, 10) || 10;
    gym.addExercise(todaySession.id, {
      name: newExName.trim(),
      sets,
      reps,
      done: false,
    });
    setNewExName('');
    setNewExSets('');
    setNewExReps('');
    setShowAddForm(false);
  }

  function handleRemoveExercise(exerciseName: string) {
    if (!todaySession) return;
    gym.removeExercise(todaySession.id, exerciseName);
  }

  function getLastWeight(exerciseName: string): number | null {
    const past = gym.getRecentSessions(10);
    for (const s of past) {
      const ex = s.exercises.find((e) => e.name === exerciseName && e.weightKg);
      if (ex?.weightKg) return ex.weightKg;
    }
    return null;
  }

  function handleStartEdit(exerciseName: string, sets: number, reps: number, weightKg?: number) {
    setEditingExercise(exerciseName);
    setEditSets(String(sets));
    setEditReps(String(reps));
    setEditWeight(weightKg ? String(weightKg) : '');
  }

  function handleSaveEdit(exerciseName: string) {
    if (!todaySession) return;
    const sets = parseInt(editSets, 10);
    const reps = parseInt(editReps, 10);
    const weightKg = parseFloat(editWeight);
    if (!isNaN(sets) && sets > 0 && !isNaN(reps) && reps > 0) {
      gym.updateExercise(todaySession.id, exerciseName, {
        sets,
        reps,
        weightKg: !isNaN(weightKg) && weightKg > 0 ? weightKg : undefined,
      });
    }
    setEditingExercise(null);
  }

  function handleSave() {
    const proteinVal = parseFloat(protein);
    const targetVal = parseFloat(proteinTarget);
    const hasProtein = !isNaN(proteinVal) && proteinVal > 0;
    const sleepMinutes = sleepEdited
      ? computeSleepMinutes(bedtime, wakeTime)
      : existingSleep?.durationMinutes ?? 0;

    if (hasProtein) {
      nutrition.addLog({
        date: today,
        proteinGrams: proteinVal,
        targetGrams: !isNaN(targetVal) && targetVal > 0 ? targetVal : 160,
      });
    }

    if (sleepEdited) {
      const bedStr = dateToTimeStr(bedtime);
      const wakeStr = dateToTimeStr(wakeTime);
      gym.addSleepLog({ date: today, bedtime: bedStr, wakeTime: wakeStr, durationMinutes: sleepMinutes });
    }

    const weightVal = parseFloat(weight);
    if (!isNaN(weightVal) && weightVal > 0) {
      gym.addBodyWeight({ date: today, weightKg: weightVal });
    }

    if (todaySession) {
      gym.markSessionComplete(todaySession.id, workoutDone && !workoutSkipped);
    }

    snapshot.updateSnapshot(today, {
      gymCompleted: workoutDone && !workoutSkipped,
      gymSkipped: workoutSkipped,
      proteinGrams: hasProtein ? proteinVal : 0,
      sleepMinutes,
    });

    router.back();
  }

  // Re-read todaySession from store to get live toggle state
  const liveSession = gym.getTodaySession();
  const doneCount = liveSession?.exercises.filter((exercise) => exercise.done).length ?? 0;
  const totalExercises = liveSession?.exercises.length ?? 0;
  const exerciseProgress =
    totalExercises > 0 ? Math.min(1, doneCount / totalExercises) : 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>GYM LOG</Text>
          <View style={styles.titleRow}>
            <Text style={styles.modalTitle}>Log workout</Text>
            {liveSession ? (
              <View style={styles.sessionPill}>
                <Ionicons name="barbell-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.sessionPillText}>{pplLabel(liveSession.type)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {liveSession ? (
          <View style={styles.sectionCard}>
        <View style={styles.exerciseHeader}>
          <View>
            <Text style={styles.sectionLabel}>EXERCISES</Text>
            <Text style={styles.exerciseSubLabel}>
              {doneCount} / {totalExercises} complete
            </Text>
          </View>
          <View style={styles.exerciseBadge}>
            <Text style={styles.exerciseBadgeText}>{pplLabel(liveSession.type)}</Text>
          </View>
        </View>
        <View style={styles.progressWrap}>
          <ProgressBar
            value={exerciseProgress}
            max={1}
            color={exerciseProgress >= 1 ? colors.success : colors.accent}
            height={5}
          />
        </View>
        {/* Exercise Checklist with Edit/Delete */}
        {liveSession && liveSession.exercises.length > 0 && (
          <>
            <View style={styles.exerciseCard}>
              {liveSession.exercises.map((ex, i) => (
                <View key={ex.name} style={[styles.exerciseRow, i > 0 && styles.exerciseBorder]}>
                  {editingExercise === ex.name ? (
                    <View style={styles.editRow}>
                      <Text style={styles.editName} numberOfLines={1}>{ex.name}</Text>
                      <View style={styles.editFields}>
                        <TextInput
                          style={styles.editInput}
                          value={editSets}
                          onChangeText={setEditSets}
                          keyboardType="number-pad"
                          placeholder="Sets"
                          placeholderTextColor={colors.textMuted}
                          maxLength={2}
                        />
                        <Text style={styles.editX}>x</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editReps}
                          onChangeText={setEditReps}
                          keyboardType="number-pad"
                          placeholder="Reps"
                          placeholderTextColor={colors.textMuted}
                          maxLength={2}
                        />
                        <TextInput
                          style={[styles.editInput, styles.editWeightInput]}
                          value={editWeight}
                          onChangeText={setEditWeight}
                          keyboardType="decimal-pad"
                          placeholder="kg"
                          placeholderTextColor={colors.textMuted}
                          maxLength={5}
                        />
                        <TouchableOpacity
                          style={styles.editSaveBtn}
                          onPress={() => handleSaveEdit(ex.name)}
                        >
                          <Ionicons name="checkmark" size={15} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                      {(() => { const lw = getLastWeight(ex.name); return lw ? <Text style={styles.lastWeightHint}>last session: {lw}kg</Text> : null; })()}
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.checkboxArea}
                        onPress={() => handleToggleExercise(ex.name)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, ex.done && styles.checkboxDone]}>
                          {ex.done ? (
                            <Ionicons name="checkmark" size={13} color={colors.textPrimary} />
                          ) : null}
                        </View>
                        <Text style={[styles.exerciseName, ex.done && styles.exerciseNameDone]}>
                          {ex.name}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleStartEdit(ex.name, ex.sets, ex.reps, ex.weightKg)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.setsWeightCol}>
                          <Text style={styles.exerciseSets}>{ex.sets}x{ex.reps}</Text>
                          {ex.weightKg ? (
                            <Text style={styles.exerciseWeight}>{ex.weightKg}kg</Text>
                          ) : (() => { const lw = getLastWeight(ex.name); return lw ? <Text style={styles.exerciseLastWeight}>last {lw}kg</Text> : null; })()}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveExercise(ex.name)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="close" size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Add Exercise */}
        {liveSession && (
          <>
            {showAddForm ? (
              <View style={styles.addForm}>
                <TextInput
                  style={[styles.input, { marginBottom: spacing.sm }]}
                  value={newExName}
                  onChangeText={setNewExName}
                  placeholder="Exercise name"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
                <View style={styles.addFormRow}>
                  <TextInput
                    style={[styles.input, styles.addFormInput]}
                    value={newExSets}
                    onChangeText={setNewExSets}
                    keyboardType="number-pad"
                    placeholder="Sets (e.g. 3)"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.addFormInput]}
                    value={newExReps}
                    onChangeText={setNewExReps}
                    keyboardType="number-pad"
                    placeholder="Reps (e.g. 10)"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                </View>
                <View style={styles.addFormActions}>
                  <TouchableOpacity
                    style={styles.addFormCancel}
                    onPress={() => setShowAddForm(false)}
                  >
                    <Text style={styles.addFormCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addFormConfirm, !newExName.trim() && styles.addFormDisabled]}
                    onPress={handleAddExercise}
                    disabled={!newExName.trim()}
                  >
                    <Text style={styles.addFormConfirmText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addExerciseBtn}
                onPress={() => setShowAddForm(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={15} color={colors.accent} />
                <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
              </TouchableOpacity>
            )}
          </>
        )}
          </View>
        ) : null}

        <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>PROTEIN</Text>
        <View style={styles.inlineRow}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            placeholder="Logged (e.g. 120)"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            value={proteinTarget}
            onChangeText={setProteinTarget}
            keyboardType="decimal-pad"
            placeholder="Target (e.g. 160)"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <Text style={styles.hint}>Logged / Target</Text>

        </View>

        <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>SLEEP</Text>
        <View style={styles.inlineRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Bedtime</Text>
            <TouchableOpacity
              style={styles.timeDisplay}
              onPress={() => setShowBedPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.timeDisplayText}>{formatTimeDisplay(bedtime)}</Text>
              <Text style={styles.timeDisplayHint}>Tap to edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Wake time</Text>
            <TouchableOpacity
              style={styles.timeDisplay}
              onPress={() => setShowWakePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.timeDisplayText}>{formatTimeDisplay(wakeTime)}</Text>
              <Text style={styles.timeDisplayHint}>Tap to edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        </View>

        <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>BODY WEIGHT</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 72.3"
          placeholderTextColor={colors.textMuted}
        />

        </View>

        {todaySession && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>WORKOUT</Text>
            <TouchableOpacity
              style={[styles.toggle, workoutDone && styles.toggleActive]}
              onPress={() =>
                setWorkoutDone((v) => {
                  const next = !v;
                  if (next) setWorkoutSkipped(false);
                  return next;
                })
              }
              activeOpacity={0.8}
            >
              <View style={[styles.toggleDot, workoutDone && styles.toggleDotActive]} />
              <Text style={[styles.toggleText, workoutDone && styles.toggleTextActive]}>
                {workoutDone ? 'Workout complete' : 'Mark workout complete'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggle, workoutSkipped && styles.toggleSkipped]}
              onPress={() =>
                setWorkoutSkipped((v) => {
                  const next = !v;
                  if (next) setWorkoutDone(false);
                  return next;
                })
              }
              activeOpacity={0.8}
            >
              <View style={[styles.toggleDot, workoutSkipped && styles.toggleDotSkipped]} />
              <Text style={[styles.toggleText, workoutSkipped && styles.toggleTextSkipped]}>
                {workoutSkipped ? 'Workout skipped for today' : 'Skip workout for today'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
      <TimePickerSheet
        visible={showBedPicker}
        title="Set Bedtime"
        value={bedtime}
        onCancel={() => setShowBedPicker(false)}
        onConfirm={(value) => {
          setBedtime(value);
          setSleepEdited(true);
          setShowBedPicker(false);
        }}
      />
      <TimePickerSheet
        visible={showWakePicker}
        title="Set Wake Time"
        value={wakeTime}
        onCancel={() => setShowWakePicker(false)}
        onConfirm={(value) => {
          setWakeTime(value);
          setSleepEdited(true);
          setShowWakePicker(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  modalTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  sessionPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  exerciseSubLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: -4,
  },
  exerciseBadge: {
    backgroundColor: `${colors.accent}18`,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: `${colors.accent}44`,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  exerciseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  progressWrap: {
    marginBottom: spacing.sm,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputHalf: { flex: 1 },
  inputLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Time picker display
  timeDisplay: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  timeDisplayText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  timeDisplayHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  // Exercise card & rows
  exerciseCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
    marginTop: spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  exerciseBorder: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  checkboxArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  exerciseNameDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  setsWeightCol: {
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 4,
  },
  exerciseSets: {
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  exerciseWeight: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  exerciseLastWeight: {
    fontSize: 11,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
    fontStyle: 'italic',
  },

  // Edit mode
  editRow: {
    flex: 1,
  },
  editName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 6,
  },
  editFields: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    backgroundColor: colors.cardElevated,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.textPrimary,
    width: 52,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    borderWidth: 1,
    borderColor: colors.border,
  },
  editX: {
    fontSize: 13,
    color: colors.textMuted,
  },
  editWeightInput: {
    width: 60,
  },
  lastWeightHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  editSaveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 4,
  },

  // Add exercise
  addExerciseBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addExerciseBtnText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addFormRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addFormInput: {
    flex: 1,
  },
  addFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  addFormCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addFormCancelText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addFormConfirm: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  addFormDisabled: {
    opacity: 0.4,
  },
  addFormConfirmText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },

  // Toggle & save
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  toggleActive: {
    borderColor: colors.success,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  toggleDotActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.success,
  },
  toggleSkipped: {
    borderColor: colors.warning,
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  toggleDotSkipped: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  toggleTextSkipped: {
    color: colors.warning,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: spacing.md,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
