import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import { Canvas, RoundedRect, Line, vec, Paint, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { useFrameCallback, useSharedValue, runOnJS, useDerivedValue } from 'react-native-reanimated';
import { Song, SongNote, Note } from '../data/songs';

interface FallingNoteTrackProps {
  song: Song | null;
  isPlaying: boolean;
  onNoteSchedule?: (note: Note, expectedTimestamp: number, beat: number) => void;
  viewportStartIdx?: number;
  dynamicWhiteKeyWidth?: number;
  whiteIdxMap?: Record<string, number>;
  hitNoteIds?: string[];
}

const LEAD_BEATS = 4; // 화면에 미리 보여질 박자 수
const LANE_MARGIN = 10;

export const FallingNoteTrack: React.FC<FallingNoteTrackProps> = ({
  song,
  isPlaying,
  onNoteSchedule,
  viewportStartIdx,
  dynamicWhiteKeyWidth,
  whiteIdxMap,
  hitNoteIds = [],
}) => {
  const { width, height } = useWindowDimensions();
  const JUDGMENT_LINE_Y = height - 150;
  
  // 상태 변수 (SharedValue for UI Thread)
  const startTimestamp = useSharedValue(-1);
  const currentTime = useSharedValue(0);
  
  // JS 스레드용 스케줄 체크 배열 (원래 SharedValue 배열 수정은 까다로우므로 JS 스레드 타이머 사용 방안도 있음)
  // 여기서는 구조를 최대한 단순화하여, 재생 시작 시 JS 스레드에서 전체 스케줄을 순회하며 emit 하는 방식을 씁니다.
  // 어차피 "예정 시각"을 알려주는 것이 목표이므로, 재생 시작(t=0) 시점에 모든 노트의 예상 타임스탬프를 계산해서 던져줘도 됩니다!
  
  const [baseTimestamp, setBaseTimestamp] = useState<number | null>(null);

  useFrameCallback((frame) => {
    if (!isPlaying) {
      startTimestamp.value = -1;
      if (baseTimestamp !== null) runOnJS(setBaseTimestamp)(null);
      return;
    }

    if (startTimestamp.value === -1) {
      startTimestamp.value = frame.timestamp;
      runOnJS(setBaseTimestamp)(Date.now());
    }

    currentTime.value = frame.timestamp - startTimestamp.value;
  }, true);

  // 재생이 시작되어 baseTimestamp가 세팅되면, 모든 노트의 스케줄을 부모에게 전달합니다.
  useEffect(() => {
    if (baseTimestamp !== null && onNoteSchedule && song) {
      song.notes.forEach((note) => {
        // beat를 ms로 변환
        const hitTimeMs = (note.beat / song.bpm) * 60 * 1000;
        const expectedTimestamp = baseTimestamp + hitTimeMs;
        onNoteSchedule(note.note, expectedTimestamp, note.beat);
      });
    }
  }, [baseTimestamp, song, onNoteSchedule]);

  // 렌더링 로직
  if (!song) return null;

  // 레인(Lane) 계산
  const palette = song.palette;
  const isIntegrated = whiteIdxMap && dynamicWhiteKeyWidth && viewportStartIdx !== undefined;
  const laneWidth = isIntegrated ? dynamicWhiteKeyWidth : (width - LANE_MARGIN * 2) / palette.length;

  const getLaneX = (noteStr: Note) => {
    if (isIntegrated) {
      const idx = whiteIdxMap![noteStr];
      if (idx === undefined) return -100;
      const relativeIdx = idx - viewportStartIdx!;
      return relativeIdx * laneWidth;
    }
    const idx = palette.indexOf(noteStr);
    if (idx === -1) return -100; // 화면 밖
    return LANE_MARGIN + idx * laneWidth;
  };

  return (
    <View style={styles.container}>
      <Canvas style={{ flex: 1 }}>
        {/* 레인 구분선 */}
        {palette.map((_, i) => (
          <Line
            key={`lane-${i}`}
            p1={vec(LANE_MARGIN + i * laneWidth, 0)}
            p2={vec(LANE_MARGIN + i * laneWidth, height)}
            color="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />
        ))}
        <Line
          p1={vec(LANE_MARGIN + palette.length * laneWidth, 0)}
          p2={vec(LANE_MARGIN + palette.length * laneWidth, height)}
          color="rgba(255, 255, 255, 0.1)"
          strokeWidth={1}
        />

        {/* 판정선 */}
        <Line
          p1={vec(LANE_MARGIN, JUDGMENT_LINE_Y)}
          p2={vec(width - LANE_MARGIN, JUDGMENT_LINE_Y)}
          color="#00ffcc"
          strokeWidth={3}
        />

        {/* 노트 렌더링 (Custom Drawing Component) */}
        <NotesRenderer 
          song={song} 
          currentTime={currentTime} 
          laneWidth={laneWidth}
          getLaneX={getLaneX}
          judgmentLineY={JUDGMENT_LINE_Y}
          hitNoteIds={hitNoteIds}
        />
      </Canvas>
    </View>
  );
};



// UI 스레드에서만 도는 노트 렌더러
const NotesRenderer = ({ song, currentTime, laneWidth, getLaneX, judgmentLineY, hitNoteIds }: any) => {
  return (
    <>
      {song.notes.map((n: SongNote, i: number) => {
        const x = getLaneX(n.note);
        if (x < 0) return null;
        const isHit = hitNoteIds.includes(`${n.note}-${n.beat}`);
        return (
          <AnimatedNote
            key={`note-${i}`}
            n={n}
            isHit={isHit}
            song={song}
            currentTime={currentTime}
            x={x}
            laneWidth={laneWidth}
            judgmentLineY={judgmentLineY}
          />
        );
      })}
    </>
  );
};

const AnimatedNote = ({ n, song, currentTime, x, laneWidth, judgmentLineY, isHit }: any) => {
  const y = useDerivedValue(() => {
    const currentBeat = (currentTime.value / 1000 / 60) * song.bpm;
    const distanceBeats = n.beat - currentBeat;
    return judgmentLineY - (distanceBeats / LEAD_BEATS) * judgmentLineY - 20; // 20은 노트 높이 절반 오프셋
  });

  const opacity = useDerivedValue(() => {
    if (isHit) return 0;
    const currentBeat = (currentTime.value / 1000 / 60) * song.bpm;
    const distanceBeats = n.beat - currentBeat;
    // 판정선 약간 아래(-1박자)부터 화면 상단(LEAD_BEATS)까지만 렌더링
    const isVisible = distanceBeats <= LEAD_BEATS && distanceBeats >= -1;
    return isVisible ? 1 : 0;
  });

  return (
    <RoundedRect
      x={x + 2}
      y={y}
      width={laneWidth - 4}
      height={40}
      color="#a78bfa"
      r={8}
      opacity={opacity}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
