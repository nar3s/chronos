import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors } from '@/src/theme/colors';

interface Props {
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, max, color = colors.accent, height = 6 }: Props) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const widthAnim = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerWidth > 0) {
      Animated.timing(widthAnim, {
        toValue: pct * containerWidth,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [pct, containerWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  return (
    <View style={[styles.track, { height }]} onLayout={handleLayout}>
      <Animated.View
        style={{ width: widthAnim, height, backgroundColor: color, borderRadius: 6 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    overflow: 'hidden',
  },
});
