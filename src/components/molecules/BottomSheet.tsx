import React, { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Override container styles (radius, padding, etc.). The default already provides a card bg + rounded top. */
  contentStyle?: ViewStyle;
  /** Disable backdrop tap-to-dismiss. */
  disableBackdropDismiss?: boolean;
}

const SPRING = { damping: 22, stiffness: 220, mass: 0.7 };
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;

/**
 * Bottom sheet with drag-to-dismiss. Tap backdrop or drag the sheet down past
 * the threshold to close. Children should NOT include their own Modal — this
 * component owns it.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  contentStyle,
  disableBackdropDismiss,
}: Props) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible, translateY]);

  const close = () => {
    translateY.value = withTiming(600, { duration: 180 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        // Only grab the gesture once it's a clear downward drag — so taps and
        // child ScrollViews still work normally for sideways/upward motion.
        onMoveShouldSetPanResponder: (_, g) =>
          g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onMoveShouldSetPanResponderCapture: (_, g) =>
          g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderMove: (_, g) => {
          translateY.value = Math.max(0, g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY / 1000) {
            close();
          } else {
            translateY.value = withSpring(0, SPRING);
          }
        },
        onPanResponderTerminate: () => {
          translateY.value = withSpring(0, SPRING);
        },
      }),
    [translateY], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={disableBackdropDismiss ? undefined : close}
        />
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.sheet, contentStyle, sheetStyle]}
        >
          <View style={styles.handleZone}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handleZone: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
});
