import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';

interface Props {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: { track: 34, height: 20, thumb: 14, pad: 3 },
  md: { track: 44, height: 26, thumb: 20, pad: 3 },
};

const SPRING = { damping: 18, stiffness: 240, mass: 0.6 };

const OFF_BG = colors.cardElevated;
const ON_BG = colors.accent;
const OFF_BORDER = colors.border;
const ON_BORDER = colors.accent;

export function Toggle({ value, onValueChange, disabled, size = 'md' }: Props) {
  const s = SIZES[size];
  const travel = s.track - s.thumb - s.pad * 2;

  const progress = useSharedValue(value ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, SPRING);
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [OFF_BG, ON_BG]),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [OFF_BORDER, ON_BORDER],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const stretch = interpolate(press.value, [0, 1], [1, 1.18]);
    return {
      transform: [
        { translateX: progress.value * travel },
        { scaleX: stretch },
      ],
    };
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      onPressIn={() => {
        if (!disabled) press.value = withSpring(1, SPRING);
      }}
      onPressOut={() => {
        press.value = withSpring(0, SPRING);
      }}
      disabled={disabled}
      hitSlop={8}
      style={{ opacity: disabled ? 0.35 : 1 }}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: s.track,
            height: s.height,
            borderRadius: s.height / 2,
            padding: s.pad,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: s.thumb,
              height: s.thumb,
              borderRadius: s.thumb / 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  thumb: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1.5 },
    elevation: 3,
  },
});
