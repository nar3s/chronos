import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { ScreenHeader } from '@/src/components/molecules/ScreenHeader';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';
import { CurrentWallpaperCard } from '@/src/components/organisms/wallpaper/CurrentWallpaperCard';
import { WallpaperLibraryGrid } from '@/src/components/organisms/wallpaper/WallpaperLibraryGrid';
import { ScheduleList } from '@/src/components/organisms/wallpaper/ScheduleList';
import { ApplyTargetSheet } from '@/src/components/organisms/wallpaper/ApplyTargetSheet';
import { ExactAlarmBanner } from '@/src/components/organisms/wallpaper/ExactAlarmBanner';
import { useWallpaper, useExactAlarmStatus, describeSchedule } from '@/src/hooks/useWallpaper';
import { wallpaperService } from '@/src/services/wallpaper';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { WallpaperItem, WallpaperTarget } from '@/src/domain/types/wallpaper';

async function pickImage(): Promise<{ uri: string; name: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'image/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  return { uri: asset.uri, name: asset.name?.replace(/\.[^.]+$/, '') ?? 'Wallpaper' };
}

export function WallpaperScreen() {
  const {
    items,
    schedules,
    activeItem,
    defaultWallpaperId,
    nextSchedule,
    importImage,
    removeItem,
    applyNow,
    toggleSchedule,
    removeSchedule,
    setDefaultWallpaper,
  } = useWallpaper();
  const exactAlarm = useExactAlarmStatus();

  const [applyTarget, setApplyTarget] = useState<WallpaperItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WallpaperItem | null>(null);
  const [busy, setBusy] = useState(false);

  const supported = wallpaperService.isSupported();
  const nextLabel = nextSchedule ? `Next: ${describeSchedule(nextSchedule)}` : null;

  async function handleChangeNow() {
    if (busy) return;
    setBusy(true);
    try {
      const picked = await pickImage();
      if (picked) {
        const item = await importImage(picked.uri, picked.name);
        if (item) setApplyTarget(item);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAddImage() {
    if (busy) return;
    setBusy(true);
    try {
      const picked = await pickImage();
      if (picked) await importImage(picked.uri, picked.name);
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectTarget(target: WallpaperTarget) {
    const item = applyTarget;
    setApplyTarget(null);
    if (item) await applyNow(item.id, target);
  }

  return (
    <ScreenTemplate>
      <ScreenHeader title="Wallpaper" />

      {!supported ? (
        <View style={styles.notice}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.warning} />
          <Text style={styles.noticeText}>
            Wallpaper control needs the native Android build. It won{'\''}t work in Expo Go or on web.
          </Text>
        </View>
      ) : null}

      {supported && !exactAlarm.granted ? (
        <ExactAlarmBanner onGrant={exactAlarm.openSettings} />
      ) : null}

      <Animated.View entering={FadeInDown.duration(400)}>
        <CurrentWallpaperCard
          active={activeItem}
          nextLabel={nextLabel}
          onChangeNow={handleChangeNow}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(60)}>
        <WallpaperLibraryGrid
          items={items}
          defaultId={defaultWallpaperId}
          onAdd={handleAddImage}
          onApply={(item) => setApplyTarget(item)}
          onDelete={(item) => setPendingDelete(item)}
          onSetDefault={setDefaultWallpaper}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(120)}>
        <ScheduleList
          schedules={schedules}
          items={items}
          onAdd={() => router.push('/modals/add-wallpaper-schedule' as any)}
          onEdit={(id) =>
            router.push(`/modals/add-wallpaper-schedule?id=${id}` as any)
          }
          onToggle={toggleSchedule}
          onDelete={removeSchedule}
        />
      </Animated.View>

      <ApplyTargetSheet
        visible={applyTarget !== null}
        onSelect={handleSelectTarget}
        onClose={() => setApplyTarget(null)}
      />

      <ConfirmationSheet
        visible={pendingDelete !== null}
        title="Delete wallpaper"
        message="This removes the saved image and any schedules using it."
        onConfirm={() => {
          if (pendingDelete) removeItem(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: { padding: 4, width: 30 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${colors.warning}12`,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
