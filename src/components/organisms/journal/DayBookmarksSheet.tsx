import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Bookmark } from '@/src/domain/types/bookmark';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

interface Props {
  visible: boolean;
  date: string;
  bookmarks: Bookmark[];
  onClose: () => void;
}

export function DayBookmarksSheet({ visible, date, bookmarks, onClose }: Props) {
  function handleEdit(id: string) {
    onClose();
    router.push(`/modals/add-bookmark?id=${id}` as any);
  }

  function handleAddNew() {
    onClose();
    router.push(`/modals/add-bookmark?date=${date}` as any);
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View 
        style={styles.overlay} 
        entering={FadeIn.duration(200)} 
        exiting={FadeOut.duration(200)}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        <Animated.View 
          style={styles.sheet} 
          entering={SlideInDown.springify().damping(20)} 
          exiting={SlideOutDown.duration(200)}
        >
          <View style={styles.handle} />
          
          <Text style={styles.title}>Bookmarks for {date}</Text>
          
          <View style={styles.list}>
            {bookmarks.map((b) => (
              <TouchableOpacity key={b.id} style={styles.card} onPress={() => handleEdit(b.id)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>{b.label}</Text>
                  {b.notifyAt && <Ionicons name="notifications" size={14} color={colors.accent} />}
                </View>
                {b.note && <Text style={styles.cardNote} numberOfLines={1}>{b.note}</Text>}
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.addBtn} onPress={handleAddNew} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Another Bookmark</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  list: {
    gap: 12,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardNote: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
