import React, { useRef } from 'react';
import { StyleSheet, View, GestureResponderEvent } from 'react-native';
import { Canvas, RoundedRect, LinearGradient, vec, Shadow } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, SharedValue } from 'react-native-reanimated';
import SoundManager from './SoundManager';

const whiteToChromatic = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
const blackToChromatic = [1, 3, 6, 8, 10, 13, 15, 18, 20, 22];

const getChromaticIndex = (keyIdx: number): number => {
  if (keyIdx < 14) {
    return whiteToChromatic[keyIdx];
  } else {
    return blackToChromatic[keyIdx - 14];
  }
};

interface PianoKeyboardProps {
  width: number;
  height: number;
}

const WhiteKey = ({ x, whiteKeyWidth, height, activeValue }: { x: number, whiteKeyWidth: number, height: number, activeValue: SharedValue<number> }) => {
  const yOffset = useDerivedValue(() => activeValue.value === 1 ? 10 : 0);
  const rectHeight = useDerivedValue(() => height - yOffset.value);
  const colors = useDerivedValue(() => activeValue.value === 1 ? ['#e0e0e0', '#b0b0b0'] : ['#ffffff', '#e0e0e0']);
  const shadowColor = useDerivedValue(() => activeValue.value === 1 ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.3)");

  return (
    <RoundedRect
      x={x + 2} 
      y={yOffset}
      width={whiteKeyWidth - 4}
      height={rectHeight}
      r={8} 
    >
      <LinearGradient
        start={vec(x, 0)}
        end={vec(x, height)}
        colors={colors}
      />
      <Shadow dx={0} dy={4} blur={8} color={shadowColor} />
    </RoundedRect>
  );
};

const BlackKey = ({ x, blackKeyWidth, blackKeyHeight, activeValue }: { x: number, blackKeyWidth: number, blackKeyHeight: number, activeValue: SharedValue<number> }) => {
  const yOffset = useDerivedValue(() => activeValue.value === 1 ? 8 : 0);
  const rectHeight = useDerivedValue(() => blackKeyHeight - yOffset.value);
  const colors = useDerivedValue(() => activeValue.value === 1 ? ['#1a1a1a', '#000000'] : ['#333333', '#000000']);
  const shadowColor = useDerivedValue(() => activeValue.value === 1 ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.8)");

  return (
    <RoundedRect
      x={x}
      y={yOffset}
      width={blackKeyWidth}
      height={rectHeight}
      r={6}
    >
      <LinearGradient
        start={vec(x, 0)}
        end={vec(x, blackKeyHeight)}
        colors={colors}
      />
      <Shadow dx={0} dy={6} blur={10} color={shadowColor} />
    </RoundedRect>
  );
};

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ width, height }) => {
  const NUM_WHITE_KEYS = 14; 
  const whiteKeyWidth = width / NUM_WHITE_KEYS;
  const blackKeyWidth = whiteKeyWidth * 0.65;
  const blackKeyHeight = height * 0.6;

  const blackKeyPattern = [0, 1, 3, 4, 5];
  
  const blackKeys: { index: number, x: number }[] = [];
  for (let octave = 0; octave < 2; octave++) {
    blackKeyPattern.forEach((idx) => {
      const whiteIdx = octave * 7 + idx;
      blackKeys.push({
        index: NUM_WHITE_KEYS + blackKeys.length, 
        x: (whiteIdx + 1) * whiteKeyWidth - (blackKeyWidth / 2)
      });
    });
  }

  // 24개의 독립된 SharedValue 생성 (hook 규칙 준수: 컴포넌트 최상단에서 한 번만 실행됨)
  const keyStates = [
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)
  ];
  
  // 소리 중복 방지용 Ref
  const playingKeysRef = useRef<Set<number>>(new Set());

  const getKeyIndexFromPosition = (x: number, y: number): number | null => {
    if (y < blackKeyHeight) {
      for (let i = 0; i < blackKeys.length; i++) {
        const bk = blackKeys[i];
        if (x >= bk.x && x <= bk.x + blackKeyWidth) {
          return bk.index; 
        }
      }
    }
    const whiteIdx = Math.floor(x / whiteKeyWidth);
    if (whiteIdx >= 0 && whiteIdx < NUM_WHITE_KEYS) {
      return whiteIdx;
    }
    return null;
  };

  const handleTouch = (event: GestureResponderEvent) => {
    const touches = event.nativeEvent.touches;
    const newKeysThisFrame = new Set<number>();
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const keyIdx = getKeyIndexFromPosition(touch.locationX, touch.locationY);
      if (keyIdx !== null) {
        newKeysThisFrame.add(keyIdx);
      }
    }

    // 새롭게 눌린 키 소리 재생
    newKeysThisFrame.forEach(keyIdx => {
      if (!playingKeysRef.current.has(keyIdx)) {
        const chromaticIdx = getChromaticIndex(keyIdx);
        SoundManager.play(chromaticIdx);
      }
    });

    playingKeysRef.current = newKeysThisFrame;

    // 각 SharedValue 값 업데이트
    for (let i = 0; i < 24; i++) {
      const isPressed = newKeysThisFrame.has(i) ? 1 : 0;
      if (keyStates[i].value !== isPressed) {
        keyStates[i].value = isPressed;
      }
    }
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    handleTouch(event); 
  };

  return (
    <View 
      style={StyleSheet.absoluteFill}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        
        {Array.from({ length: NUM_WHITE_KEYS }).map((_, index) => (
          <WhiteKey 
            key={`white-${index}`} 
            x={index * whiteKeyWidth} 
            whiteKeyWidth={whiteKeyWidth} 
            height={height} 
            activeValue={keyStates[index]} 
          />
        ))}

        {blackKeys.map((bk) => (
          <BlackKey 
            key={`black-${bk.index}`} 
            x={bk.x} 
            blackKeyWidth={blackKeyWidth} 
            blackKeyHeight={blackKeyHeight} 
            activeValue={keyStates[bk.index]} 
          />
        ))}

      </Canvas>
    </View>
  );
};
