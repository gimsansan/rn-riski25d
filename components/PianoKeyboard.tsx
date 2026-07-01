import React, { useState } from 'react';
import { StyleSheet, View, GestureResponderEvent } from 'react-native';
import { Canvas, RoundedRect, LinearGradient, vec, Shadow } from '@shopify/react-native-skia';

interface PianoKeyboardProps {
  width: number;
  height: number;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ width, height }) => {
  const NUM_WHITE_KEYS = 14; // 2옥타브
  const whiteKeyWidth = width / NUM_WHITE_KEYS;
  const blackKeyWidth = whiteKeyWidth * 0.65;
  const blackKeyHeight = height * 0.6;

  // 1옥타브 내 흑건이 위치하는 백건의 인덱스
  const blackKeyPattern = [0, 1, 3, 4, 5];
  
  // 흑건들의 정보 (x 좌표, 너비, 높이, 고유 인덱스)
  const blackKeys: { index: number, x: number }[] = [];
  for (let octave = 0; octave < 2; octave++) {
    blackKeyPattern.forEach((idx) => {
      const whiteIdx = octave * 7 + idx;
      blackKeys.push({
        index: NUM_WHITE_KEYS + blackKeys.length, // 흑건 인덱스는 14부터 시작
        x: (whiteIdx + 1) * whiteKeyWidth - (blackKeyWidth / 2)
      });
    });
  }

  const TOTAL_KEYS = NUM_WHITE_KEYS + blackKeys.length; // 14 + 10 = 24

  // 현재 눌려진 키들을 추적하는 React State (Skia Re-render 트리거)
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());

  // (x, y) 좌표를 기반으로 어떤 키가 눌렸는지 계산하는 함수
  const getKeyIndexFromPosition = (x: number, y: number): number | null => {
    // 1. 먼저 흑건 영역인지 확인 (y가 상단 60% 이내일 때)
    if (y < blackKeyHeight) {
      for (let i = 0; i < blackKeys.length; i++) {
        const bk = blackKeys[i];
        if (x >= bk.x && x <= bk.x + blackKeyWidth) {
          return bk.index; // 흑건 인덱스 반환
        }
      }
    }
    // 2. 흑건이 아니면 백건 영역으로 계산
    const whiteIdx = Math.floor(x / whiteKeyWidth);
    if (whiteIdx >= 0 && whiteIdx < NUM_WHITE_KEYS) {
      return whiteIdx;
    }
    return null;
  };

  // 터치 핸들러 (다중 터치 및 글리산도 지원)
  const handleTouch = (event: GestureResponderEvent) => {
    const touches = event.nativeEvent.touches;
    const newActiveKeys = new Set<number>();
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const keyIdx = getKeyIndexFromPosition(touch.locationX, touch.locationY);
      if (keyIdx !== null) {
        newActiveKeys.add(keyIdx);
      }
    }
    
    setActiveKeys(newActiveKeys);
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    handleTouch(event); // 남은 터치들로 업데이트 (모두 떼면 빈 Set이 됨)
  };

  return (
    <View 
      style={StyleSheet.absoluteFill}
      // RN 기본 다중 터치 이벤트 사용
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        
        {/* 1. 하얀 건반 렌더링 */}
        {Array.from({ length: NUM_WHITE_KEYS }).map((_, index) => {
          const x = index * whiteKeyWidth;
          const isActive = activeKeys.has(index);
          const yOffset = isActive ? 10 : 0; // 눌렸을 때 Y축으로 내려감 (2.5D 효과)
          
          return (
            <RoundedRect
              key={`white-${index}`}
              x={x + 2} 
              y={yOffset}
              width={whiteKeyWidth - 4}
              height={height - yOffset}
              r={8} 
            >
              <LinearGradient
                start={vec(x, 0)}
                end={vec(x, height)}
                colors={isActive ? ['#e0e0e0', '#b0b0b0'] : ['#ffffff', '#e0e0e0']}
              />
              {!isActive && <Shadow dx={0} dy={4} blur={8} color="rgba(0,0,0,0.3)" />}
            </RoundedRect>
          );
        })}

        {/* 2. 검은 건반 렌더링 */}
        {blackKeys.map((bk, i) => {
          const isActive = activeKeys.has(bk.index);
          const yOffset = isActive ? 8 : 0;
          
          return (
            <RoundedRect
              key={`black-${bk.index}`}
              x={bk.x}
              y={yOffset}
              width={blackKeyWidth}
              height={blackKeyHeight - yOffset}
              r={6}
            >
              <LinearGradient
                start={vec(bk.x, 0)}
                end={vec(bk.x, blackKeyHeight)}
                colors={isActive ? ['#1a1a1a', '#000000'] : ['#333333', '#000000']}
              />
              {!isActive && <Shadow dx={0} dy={6} blur={10} color="rgba(0,0,0,0.8)" />}
            </RoundedRect>
          );
        })}

      </Canvas>
    </View>
  );
};
