import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

// 52음 정보 구성 (백건 30개, 흑건 22개)
type Note =
  | 'C1' | 'C#1' | 'D1' | 'D#1' | 'E1' | 'F1' | 'F#1' | 'G1' | 'G#1' | 'A1' | 'A#1' | 'B1'
  | 'C2' | 'C#2' | 'D2' | 'D#2' | 'E2' | 'F2' | 'F#2' | 'G2' | 'G#2' | 'A2' | 'A#2' | 'B2'
  | 'C3' | 'C#3' | 'D3' | 'D#3' | 'E3' | 'F3' | 'F#3' | 'G3' | 'G#3' | 'A3' | 'A#3' | 'B3'
  | 'C4' | 'C#4' | 'D4' | 'D#4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'G#4' | 'A4' | 'A#4' | 'B4'
  | 'C5' | 'C#5' | 'D5' | 'D#5';

const isBlackKeyMap: { [key in Note]: boolean } = {
  'C1': false, 'C#1': true, 'D1': false, 'D#1': true, 'E1': false, 'F1': false, 'F#1': true, 'G1': false, 'G#1': true, 'A1': false, 'A#1': true, 'B1': false,
  'C2': false, 'C#2': true, 'D2': false, 'D#2': true, 'E2': false, 'F2': false, 'F#2': true, 'G2': false, 'G#2': true, 'A2': false, 'A#2': true, 'B2': false,
  'C3': false, 'C#3': true, 'D3': false, 'D#3': true, 'E3': false, 'F3': false, 'F#3': true, 'G3': false, 'G#3': true, 'A3': false, 'A#3': true, 'B3': false,
  'C4': false, 'C#4': true, 'D4': false, 'D#4': true, 'E4': false, 'F4': false, 'F#4': true, 'G4': false, 'G#4': true, 'A4': false, 'A#4': true, 'B4': false,
  'C5': false, 'C#5': true, 'D5': false, 'D#5': true,
};

const allNotes = Object.keys(isBlackKeyMap) as Note[];
const whiteNotes = allNotes.filter(note => !isBlackKeyMap[note]);

// 각 Note별 백건 인덱스 맵 구성 (정답 위치 포커싱 및 매핑용)
const whiteIdxRefById = new Map<string, number>();
let whiteCount = 0;
let lastWhiteIdx = 0;
allNotes.forEach(note => {
  const isBlack = isBlackKeyMap[note];
  if (isBlack) {
    whiteIdxRefById.set(note, lastWhiteIdx);
  } else {
    whiteIdxRefById.set(note, whiteCount);
    lastWhiteIdx = whiteCount;
    whiteCount++;
  }
});

interface MiniKeyboardMapProps {
  viewportStartIdx: number;
  setViewportStartIdx: (idx: number) => void;
  currentNote: string | null;
  isTraining: boolean;
  viewportSize?: number;
}

export const MiniKeyboardMap: React.FC<MiniKeyboardMapProps> = ({
  viewportStartIdx,
  setViewportStartIdx,
  currentNote,
  isTraining,
  viewportSize = 16,
}) => {
  // 미니맵 수치 정의
  const WHITE_KEY_WIDTH = 6;
  const WHITE_KEY_HEIGHT = 28;
  const BLACK_KEY_WIDTH = 3.6;
  const BLACK_KEY_HEIGHT = 18;

  const totalWidth = whiteNotes.length * WHITE_KEY_WIDTH; // 30 * 6 = 180px

  // 뷰포트 하이라이트 박스 애니메이션
  const animatedBoxStyle = useAnimatedStyle(() => {
    const leftPosition = viewportStartIdx * WHITE_KEY_WIDTH;
    return {
      left: withTiming(leftPosition, { duration: 250 }),
      width: viewportSize * WHITE_KEY_WIDTH, // 동적 크기 반영
    };
  });

  // 미니맵 터치 시 가장 가까운 고정 스냅 지점 매핑 (16건반 기준 0 또는 14로 토글)
  const handleMapPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const tappedWhiteIdx = Math.floor(locationX / WHITE_KEY_WIDTH);

    if (viewportSize === 16) {
      if (tappedWhiteIdx < 15) {
        setViewportStartIdx(0);
      } else {
        setViewportStartIdx(14);
      }
    } else {
      if (tappedWhiteIdx < 7) {
        setViewportStartIdx(0);
      } else if (tappedWhiteIdx >= 7 && tappedWhiteIdx < 15) {
        setViewportStartIdx(14);
      } else {
        setViewportStartIdx(16);
      }
    }
  };

  // 정답 가이드 LED 도트 위치 계산
  const getTargetDotLeft = () => {
    if (!isTraining || !currentNote) return null;
    const idx = whiteIdxRefById.get(currentNote);
    if (idx === undefined) return null;
    
    // 백건의 가로 너비 중심에 맞춰 도트 배치
    return idx * WHITE_KEY_WIDTH + (WHITE_KEY_WIDTH / 2) - 3;
  };

  const targetDotLeft = getTargetDotLeft();

  // 흑건들의 배치 렌더링을 위한 좌표 계산
  const renderBlackKeys = () => {
    const blackKeys: React.ReactNode[] = [];
    let whiteIndex = 0;

    allNotes.forEach((note) => {
      if (isBlackKeyMap[note]) {
        // 이전 백건 인덱스를 바탕으로 흑건의 가로 절대 위치 계산
        const left = whiteIndex * WHITE_KEY_WIDTH - (BLACK_KEY_WIDTH / 2);
        blackKeys.push(
          <View
            key={`mini-black-${note}`}
            style={[
              styles.miniBlackKey,
              {
                left,
                width: BLACK_KEY_WIDTH,
                height: BLACK_KEY_HEIGHT,
              },
            ]}
          />
        );
      } else {
        whiteIndex++;
      }
    });

    return blackKeys;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleMapPress}
      style={[styles.container, { width: totalWidth, height: WHITE_KEY_HEIGHT }]}
    >
      {/* 1. 백건들을 배경으로 렌더링 */}
      <View style={styles.whiteKeysContainer}>
        {whiteNotes.map((note) => (
          <View
            key={`mini-white-${note}`}
            style={[
              styles.miniWhiteKey,
              { width: WHITE_KEY_WIDTH, height: WHITE_KEY_HEIGHT },
            ]}
          />
        ))}
      </View>

      {/* 2. 흑건들을 겹쳐서 렌더링 */}
      {renderBlackKeys()}

      {/* 3. 뷰포트 하이라이트 박스 (네온 테두리) */}
      <Animated.View style={[styles.viewportHighlight, animatedBoxStyle]} />

      {/* 4. 정답 안내 LED 가이드 도트 */}
      {targetDotLeft !== null && (
        <View style={[styles.targetGuideDot, { left: targetDotLeft }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  whiteKeysContainer: {
    flexDirection: 'row',
  },
  miniWhiteKey: {
    backgroundColor: '#fff',
    borderRightWidth: 0.5,
    borderRightColor: '#ddd',
  },
  miniBlackKey: {
    position: 'absolute',
    backgroundColor: '#000',
    top: 0,
    zIndex: 2,
  },
  viewportHighlight: {
    position: 'absolute',
    top: -1,
    bottom: -1,
    borderWidth: 1.5,
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderRadius: 2,
    zIndex: 3,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  targetGuideDot: {
    position: 'absolute',
    bottom: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff453a',
    zIndex: 4,
    shadowColor: '#ff453a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
});
