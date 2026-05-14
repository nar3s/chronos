import React from 'react';
import Svg, { Polyline } from 'react-native-svg';
import { colors } from '@/src/theme/colors';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function SparkLine({ data, width = 100, height = 30, color = colors.accent }: Props) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
