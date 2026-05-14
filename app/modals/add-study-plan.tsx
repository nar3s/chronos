import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudyPlanStore } from '@/src/store/studyPlanStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { TOPICS } from '@/src/domain/constants/topics';

type Mode = 'single' | 'import';
type NoticeTone = 'success' | 'warning' | 'danger' | 'info';

interface ParsedPlanItem {
  date: string;
  topic: string;
  subtopic: string;
  plannedMinutes: number;
}

interface NoticeState {
  tone: NoticeTone;
  title: string;
  message: string;
  details?: string[];
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseExcelDate(value: any): string | null {
  if (typeof value === 'number') {
    // Excel epoch logic
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const dateObj = new Date(excelEpoch.getTime() + value * 86400000);
    return toLocalIsoDate(dateObj);
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return toLocalIsoDate(parsed);
    }
  }
  return null;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseMinutes(value?: string) {
  const parsed = parseInt(value ?? '', 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 120 : parsed;
}

function normalizeTextBase64(base64: string) {
  const commaIndex = base64.indexOf(',');
  return commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64;
}

function parseTextSchedule(text: string) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  const items: ParsedPlanItem[] = [];
  const errors: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const parts = lines[index].split('|').map((part) => part.trim());
    if (parts.length < 3) {
      errors.push(`Line ${index + 1}: needs date | topic | subtopic`);
      continue;
    }

    const [date, topic, subtopic, minutes] = parts;
    if (!isIsoDate(date)) {
      errors.push(`Line ${index + 1}: invalid date "${date}"`);
      continue;
    }
    if (!topic || !subtopic) {
      errors.push(`Line ${index + 1}: topic and subtopic are required`);
      continue;
    }

    items.push({
      date,
      topic,
      subtopic,
      plannedMinutes: parseMinutes(minutes),
    });
  }

  return { items, errors };
}

function getCellString(row: unknown[], index: number) {
  const value = row[index];
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parseSpreadsheetRows(rows: unknown[][]) {
  const usableRows = rows.filter((row) => Array.isArray(row) && row.some((cell) => `${cell ?? ''}`.trim() !== ''));
  if (usableRows.length === 0) {
    return { items: [] as ParsedPlanItem[], errors: ['Sheet is empty'] };
  }

  let startIndex = 0;
  const firstRow = usableRows[0].map((cell) => `${cell ?? ''}`.trim().toLowerCase());
  const looksLikeHeader = firstRow.some((cell) =>
    ['date', 'topic', 'subtopic', 'minutes', 'plannedminutes', 'planned minutes'].includes(cell)
  );
  if (looksLikeHeader) {
    startIndex = 1;
  }

  const items: ParsedPlanItem[] = [];
  const errors: string[] = [];

  const topicKeys = Object.keys(TOPICS);

  for (let rowIndex = startIndex; rowIndex < usableRows.length; rowIndex++) {
    const row = usableRows[rowIndex];
    const rawDate = row[0];
    const rawTopic = getCellString(row, 1);
    const subtopic = getCellString(row, 2);
    const minutes = getCellString(row, 3);

    if (!rawDate && !rawTopic && !subtopic) continue;

    const parsedDate = parseExcelDate(rawDate);
    if (!parsedDate || !isIsoDate(parsedDate)) {
      errors.push(`Row ${rowIndex + 1}: invalid date "${rawDate}"`);
      continue;
    }
    if (!rawTopic || !subtopic) {
      errors.push(`Row ${rowIndex + 1}: topic and subtopic are required`);
      continue;
    }

    const normalizedTopic = topicKeys.find(k => k.toLowerCase() === rawTopic.toLowerCase()) || rawTopic;

    items.push({
      date: parsedDate,
      topic: normalizedTopic,
      subtopic,
      plannedMinutes: parseMinutes(minutes),
    });
  }

  return { items, errors };
}

async function readWorkbookFromAsset(asset: DocumentPicker.DocumentPickerAsset) {
  if (asset.base64) {
    return XLSX.read(normalizeTextBase64(asset.base64), { type: 'base64' });
  }

  const response = await fetch(asset.uri);
  const buffer = await response.arrayBuffer();
  return XLSX.read(buffer, { type: 'array' });
}

function FormatPill({ label }: { label: string }) {
  return (
    <View style={styles.formatPill}>
      <Text style={styles.formatPillText}>{label}</Text>
    </View>
  );
}

const NOTICE_STYLES = {
  success: {
    container: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.24)' },
    title: { color: colors.success },
  },
  warning: {
    container: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.24)' },
    title: { color: colors.warning },
  },
  danger: {
    container: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.24)' },
    title: { color: colors.danger },
  },
  info: {
    container: { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.24)' },
    title: { color: colors.accent },
  },
} as const;

export default function AddStudyPlanModal() {
  const plan = useStudyPlanStore();
  const [mode, setMode] = useState<Mode>('single');
  const [date, setDate] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [minutes, setMinutes] = useState('120');
  const [bulkText, setBulkText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const importCount = useMemo(
    () => bulkText.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#')).length,
    [bulkText]
  );

  function pushItems(items: ParsedPlanItem[]) {
    plan.bulkAdd(
      items.map((item, index) => ({
        id: `${generateId()}-${index}`,
        date: item.date,
        topic: item.topic,
        subtopic: item.subtopic,
        plannedMinutes: item.plannedMinutes,
        completed: false,
      }))
    );
  }

  function handleAddSingle() {
    if (!date || !topic.trim() || !subtopic.trim()) {
      setNotice({
        tone: 'warning',
        title: 'Missing fields',
        message: 'Date, topic, and subtopic are required before adding a study plan item.',
      });
      return;
    }
    if (!isIsoDate(date)) {
      setNotice({
        tone: 'danger',
        title: 'Invalid date',
        message: 'Use YYYY-MM-DD format, for example 2026-05-01.',
      });
      return;
    }

    plan.addItem({
      id: generateId(),
      date,
      topic: topic.trim(),
      subtopic: subtopic.trim(),
      plannedMinutes: parseMinutes(minutes),
      completed: false,
    });

    setDate('');
    setTopic('');
    setSubtopic('');
    setMinutes('120');
    setNotice({
      tone: 'success',
      title: 'Added to plan',
      message: `${topic.trim()} / ${subtopic.trim()} scheduled for ${date}.`,
    });
  }

  function handleBulkImport() {
    if (!bulkText.trim()) {
      setNotice({
        tone: 'warning',
        title: 'Nothing to import',
        message: 'Paste a schedule first, then import it.',
      });
      return;
    }

    const { items, errors } = parseTextSchedule(bulkText);
    if (errors.length > 0) {
      setNotice({
        tone: 'danger',
        title: 'Import blocked',
        message: 'Fix the lines below and try again.',
        details: errors.slice(0, 6),
      });
      return;
    }
    if (items.length === 0) {
      setNotice({
        tone: 'warning',
        title: 'No valid items',
        message: 'No valid study plan rows were found in the pasted text.',
      });
      return;
    }

    pushItems(items);
    setBulkText('');
    setSelectedFileName('');
    setNotice({
      tone: 'success',
      title: 'Import complete',
      message: `${items.length} study plan items were added. They are appended to your existing plan and show up in Today Plan or Upcoming Plan based on date.`,
    });
  }

  async function handlePickSpreadsheet() {
    setIsPickingFile(true);
    setNotice(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        base64: true,
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream',
          'text/comma-separated-values',
          'text/csv',
        ],
      });

      if (result.canceled || !result.assets?.length) {
        setIsPickingFile(false);
        return;
      }

      const asset = result.assets[0];
      setSelectedFileName(asset.name);

      const workbook = await readWorkbookFromAsset(asset);
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        raw: true,
        defval: '',
      }) as unknown[][];

      const { items, errors } = parseSpreadsheetRows(rows);
      if (errors.length > 0) {
        setNotice({
          tone: 'danger',
          title: 'Spreadsheet has issues',
          message: 'Fix the rows below and try importing again.',
          details: errors.slice(0, 6),
        });
        return;
      }
      if (items.length === 0) {
        setNotice({
          tone: 'warning',
          title: 'No plan rows found',
          message: 'The selected spreadsheet did not contain valid study plan rows.',
        });
        return;
      }

      pushItems(items);
      setNotice({
        tone: 'success',
        title: 'Spreadsheet imported',
        message: `${items.length} study plan items were added from ${asset.name}. Existing plan items are kept, imported items stay unchecked, and nothing gets overwritten automatically.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The file could not be imported.';
      setNotice({
        tone: 'danger',
        title: 'Import failed',
        message,
      });
    } finally {
      setIsPickingFile(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.eyebrow}>PLAN BUILDER</Text>
              <Text style={styles.title}>Study Plan Import</Text>
              <Text style={styles.headerSubtext}>
                Add one item manually or import a full schedule without dropping into raw system UI.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'single' && styles.modeTabActive]}
              onPress={() => setMode('single')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeTabText, mode === 'single' && styles.modeTabTextActive]}>
                Single Entry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'import' && styles.modeTabActive]}
              onPress={() => setMode('import')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeTabText, mode === 'import' && styles.modeTabTextActive]}>
                Import
              </Text>
            </TouchableOpacity>
          </View>

          {notice ? (
            <View style={[styles.noticeCard, NOTICE_STYLES[notice.tone].container]}>
              <Text style={[styles.noticeTitle, NOTICE_STYLES[notice.tone].title]}>{notice.title}</Text>
              <Text style={styles.noticeMessage}>{notice.message}</Text>
              {notice.details?.map((detail) => (
                <Text key={detail} style={styles.noticeDetail}>
                  {detail}
                </Text>
              ))}
            </View>
          ) : null}

          {mode === 'single' ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Create One Item</Text>
              <Text style={styles.sectionHint}>Add one planned study block with a date, topic, and duration.</Text>

              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="2026-05-01"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Topic</Text>
              <TextInput
                style={styles.input}
                value={topic}
                onChangeText={setTopic}
                placeholder="Real Analysis"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Subtopic</Text>
              <TextInput
                style={styles.input}
                value={subtopic}
                onChangeText={setSubtopic}
                placeholder="Sequences and Series"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Planned Minutes</Text>
              <TextInput
                style={styles.input}
                value={minutes}
                onChangeText={setMinutes}
                placeholder="120"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.primaryButton} onPress={handleAddSingle} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>Add to Plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.importHero}>
                <Text style={styles.importHeroTitle}>Import from text or spreadsheet</Text>
                <Text style={styles.importHeroText}>
                  Supported formats: `.xlsx`, `.xls`, and plain pasted schedules.
                </Text>
                <View style={styles.formatRow}>
                  <FormatPill label=".xlsx" />
                  <FormatPill label=".xls" />
                  <FormatPill label="text" />
                </View>
                <View style={styles.behaviorCard}>
                  <Text style={styles.behaviorTitle}>What happens after import?</Text>
                  <Text style={styles.behaviorText}>Imported rows are appended to your current study plan.</Text>
                  <Text style={styles.behaviorText}>Existing items are kept. Nothing is auto-deleted or overwritten.</Text>
                  <Text style={styles.behaviorText}>Imported items start as incomplete and appear in `Today Plan` or `Upcoming Plan` based on their dates.</Text>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Spreadsheet Import</Text>
                <Text style={styles.sectionHint}>
                  Expected columns in order: `date`, `topic`, `subtopic`, `minutes`.
                </Text>

                <View style={styles.fileCard}>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileLabel}>Selected file</Text>
                    <Text style={styles.fileName}>{selectedFileName || 'No spreadsheet selected yet'}</Text>
                    <Text style={styles.fileSubtext}>Only the first sheet is imported. A header row is optional.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.secondaryButton, isPickingFile && styles.disabledButton]}
                    onPress={handlePickSpreadsheet}
                    activeOpacity={0.8}
                    disabled={isPickingFile}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isPickingFile ? 'Importing...' : 'Pick File'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Paste Schedule</Text>
                <Text style={styles.sectionHint}>
                  One item per line. Format: `YYYY-MM-DD | Topic | Subtopic | Minutes`
                </Text>
                <TextInput
                  style={[styles.input, styles.bulkInput]}
                  value={bulkText}
                  onChangeText={setBulkText}
                  placeholder={`# Week 1\n2026-05-01 | Real Analysis | Sequences | 120\n2026-05-02 | Linear Algebra | Eigenvalues | 90`}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.importFooter}>
                  <Text style={styles.importCount}>{importCount} lines ready</Text>
                  <TouchableOpacity style={styles.primaryButtonCompact} onPress={handleBulkImport} activeOpacity={0.8}>
                    <Text style={styles.primaryButtonText}>Import Text</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.base,
    marginBottom: spacing.lg,
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  headerSubtext: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    maxWidth: 290,
  },
  closeButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#242424',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.accent,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: '#fff',
  },
  noticeCard: {
    borderRadius: 14,
    padding: spacing.base,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  noticeMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 4,
  },
  noticeDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 6,
  },
  importHero: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  importHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  importHeroText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  formatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  formatPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.14)',
  },
  formatPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  behaviorCard: {
    marginTop: spacing.base,
    borderRadius: 14,
    backgroundColor: 'rgba(15,15,15,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.14)',
    padding: spacing.base,
  },
  behaviorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  behaviorText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#242424',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.base,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulkInput: {
    minHeight: 190,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryButtonCompact: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  fileCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#111111',
    padding: spacing.base,
  },
  fileMeta: {
    marginBottom: spacing.base,
  },
  fileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 6,
  },
  fileSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  importFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.base,
    gap: spacing.base,
  },
  importCount: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
