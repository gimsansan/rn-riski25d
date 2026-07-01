import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Rect, LinearGradient, vec } from '@shopify/react-native-skia';

export const SpaceBackground = () => {
  const { width, height } = useWindowDimensions();

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={['#0F2027', '#203A43', '#2C5364']} // 우주 테마 그라데이션
        />
      </Rect>
    </Canvas>
  );
};
