import { colors } from '../../theme/colors';

/** Preset topics with colors. Users can also create custom topics. */
export const DEFAULT_TOPICS: { id: string; label: string; color: string }[] = [
  { id: 'real-analysis', label: 'Real Analysis', color: colors.accent },
  { id: 'linear-algebra', label: 'Linear Algebra', color: colors.purple },
  { id: 'pyqs', label: 'PYQs', color: colors.success },
];

/** Lookup map for topic display info. Custom topics get a default color. */
export const TOPICS: Record<string, { label: string; color: string }> = {
  'real-analysis': { label: 'Real Analysis', color: colors.accent },
  'linear-algebra': { label: 'Linear Algebra', color: colors.purple },
  'pyqs': { label: 'PYQs', color: colors.success },
};

export function getTopicDisplay(topicId: string): { label: string; color: string } {
  return TOPICS[topicId] ?? { label: topicId, color: colors.warning };
}
