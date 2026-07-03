import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,

} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context 및 컴포넌트 임포트
import { MissionProgressIcon } from './components/MissionProgressIcon';
import { ClearContext } from './context/ClearContext';
import { StarContext } from './context/StarContext';
import { RippleLayer } from './components/RippleLayer';
import { ParticleVisualizer, ParticleVisualizerRef } from './components/ParticleVisualizer';
import { randomSkyPoint } from './components/SoundConstellation';
import { MiniKeyboardMap } from './components/MiniKeyboardMap';
import { FallingNoteTrack } from './components/FallingNoteTrack';
import { songs, Song } from './data/songs';



const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Note 타입 정의 (전체 52음 복원)
type Note =
  | 'C1' | 'C#1' | 'D1' | 'D#1' | 'E1' | 'F1' | 'F#1' | 'G1' | 'G#1' | 'A1' | 'A#1' | 'B1'
  | 'C2' | 'C#2' | 'D2' | 'D#2' | 'E2' | 'F2' | 'F#2' | 'G2' | 'G#2' | 'A2' | 'A#2' | 'B2'
  | 'C3' | 'C#3' | 'D3' | 'D#3' | 'E3' | 'F3' | 'F#3' | 'G3' | 'G#3' | 'A3' | 'A#3' | 'B3'
  | 'C4' | 'C#4' | 'D4' | 'D#4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'G#4' | 'A4' | 'A#4' | 'B4'
  | 'C5' | 'C#5' | 'D5' | 'D#5';

// 사운드 파일 경로 (52개 수동 제공 M4A 파일 매핑)
const soundFiles: { [key in Note]: any } = {
  'C1': require('./assets/m4a-sounds/C1.m4a'), 'C#1': require('./assets/m4a-sounds/C_sharp1.m4a'),
  'D1': require('./assets/m4a-sounds/D1.m4a'), 'D#1': require('./assets/m4a-sounds/D_sharp1.m4a'),
  'E1': require('./assets/m4a-sounds/E1.m4a'), 'F1': require('./assets/m4a-sounds/F1.m4a'),
  'F#1': require('./assets/m4a-sounds/F_sharp1.m4a'), 'G1': require('./assets/m4a-sounds/G1.m4a'),
  'G#1': require('./assets/m4a-sounds/G_sharp1.m4a'), 'A1': require('./assets/m4a-sounds/A1.m4a'),
  'A#1': require('./assets/m4a-sounds/A_sharp1.m4a'), 'B1': require('./assets/m4a-sounds/B1.m4a'),
  'C2': require('./assets/m4a-sounds/C2.m4a'), 'C#2': require('./assets/m4a-sounds/C_sharp2.m4a'),
  'D2': require('./assets/m4a-sounds/D2.m4a'), 'D#2': require('./assets/m4a-sounds/D_sharp2.m4a'),
  'E2': require('./assets/m4a-sounds/E2.m4a'), 'F2': require('./assets/m4a-sounds/F2.m4a'),
  'F#2': require('./assets/m4a-sounds/F_sharp2.m4a'), 'G2': require('./assets/m4a-sounds/G2.m4a'),
  'G#2': require('./assets/m4a-sounds/G_sharp2.m4a'), 'A2': require('./assets/m4a-sounds/A2.m4a'),
  'A#2': require('./assets/m4a-sounds/A_sharp2.m4a'), 'B2': require('./assets/m4a-sounds/B2.m4a'),
  'C3': require('./assets/m4a-sounds/C3.m4a'), 'C#3': require('./assets/m4a-sounds/C_sharp3.m4a'),
  'D3': require('./assets/m4a-sounds/D3.m4a'), 'D#3': require('./assets/m4a-sounds/D_sharp3.m4a'),
  'E3': require('./assets/m4a-sounds/E3.m4a'), 'F3': require('./assets/m4a-sounds/F3.m4a'),
  'F#3': require('./assets/m4a-sounds/F_sharp3.m4a'), 'G3': require('./assets/m4a-sounds/G3.m4a'),
  'G#3': require('./assets/m4a-sounds/G_sharp3.m4a'), 'A3': require('./assets/m4a-sounds/A3.m4a'),
  'A#3': require('./assets/m4a-sounds/A_sharp3.m4a'), 'B3': require('./assets/m4a-sounds/B3.m4a'),
  'C4': require('./assets/m4a-sounds/C4.m4a'), 'C#4': require('./assets/m4a-sounds/C_sharp4.m4a'),
  'D4': require('./assets/m4a-sounds/D4.m4a'), 'D#4': require('./assets/m4a-sounds/D_sharp4.m4a'),
  'E4': require('./assets/m4a-sounds/E4.m4a'), 'F4': require('./assets/m4a-sounds/F4.m4a'),
  'F#4': require('./assets/m4a-sounds/F_sharp4.m4a'), 'G4': require('./assets/m4a-sounds/G4.m4a'),
  'G#4': require('./assets/m4a-sounds/G_sharp4.m4a'), 'A4': require('./assets/m4a-sounds/A4.m4a'),
  'A#4': require('./assets/m4a-sounds/A_sharp4.m4a'), 'B4': require('./assets/m4a-sounds/B4.m4a'),
  'C5': require('./assets/m4a-sounds/C5.m4a'), 'C#5': require('./assets/m4a-sounds/C_sharp5.m4a'),
  'D5': require('./assets/m4a-sounds/D5.m4a'), 'D#5': require('./assets/m4a-sounds/D_sharp5.m4a'),
};

// 흑건 여부 맵 (52음 전체)
const isBlackKeyMap: { [key in Note]: boolean } = {
  'C1': false, 'C#1': true, 'D1': false, 'D#1': true, 'E1': false, 'F1': false, 'F#1': true, 'G1': false, 'G#1': true, 'A1': false, 'A#1': true, 'B1': false,
  'C2': false, 'C#2': true, 'D2': false, 'D#2': true, 'E2': false, 'F2': false, 'F#2': true, 'G2': false, 'G#2': true, 'A2': false, 'A#2': true, 'B2': false,
  'C3': false, 'C#3': true, 'D3': false, 'D#3': true, 'E3': false, 'F3': false, 'F#3': true, 'G3': false, 'G#3': true, 'A3': false, 'A#3': true, 'B3': false,
  'C4': false, 'C#4': true, 'D4': false, 'D#4': true, 'E4': false, 'F4': false, 'F#4': true, 'G4': false, 'G#4': true, 'A4': false, 'A#4': true, 'B4': false,
  'C5': false, 'C#5': true, 'D5': false, 'D#5': true,
};

const allNotes = Object.keys(isBlackKeyMap) as Note[];

// 각 Note별 백건 인덱스 맵 구성 (포커싱용)
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

const whiteIdxMap: Record<string, number> = {};
whiteIdxRefById.forEach((val, key) => { whiteIdxMap[key] = val; });

const computeFocusStart = (noteWhiteIdx: number, currentStart: number, viewportSize: number, totalWhite: number) => {
  // 14건반 페이지 스냅에 맞춘 포커싱 처리
  if (noteWhiteIdx <= 13) return 0;
  if (noteWhiteIdx <= 27) return 14;
  return 16;
};

const useAutoFocusViewport = ({
  currentNote,
  viewportStartIdx,
  setViewportStartIdx,
  totalWhite,
  viewportSize = 14,
}: {
  currentNote: string | null;
  viewportStartIdx: number;
  setViewportStartIdx: React.Dispatch<React.SetStateAction<number>>;
  totalWhite: number;
  viewportSize?: number;
}) => {
  const startRef = useRef(viewportStartIdx);

  useEffect(() => {
    startRef.current = viewportStartIdx;
  }, [viewportStartIdx]);

  useEffect(() => {
    if (currentNote == null) return;
    const noteWhiteIdx = whiteIdxRefById.get(currentNote);
    if (noteWhiteIdx == null) return;

    const base = startRef.current;
    const target = computeFocusStart(noteWhiteIdx, base, viewportSize, totalWhite);
    if (target === base) return;

    startRef.current = target;
    setViewportStartIdx(target);
  }, [currentNote, totalWhite, viewportSize, setViewportStartIdx]);
};

// 키보드-음계 매핑 (물리 건반 단축키용)
const keyToNoteMap: { [key: string]: Note } = {
  'q': 'C3', 'w': 'D3', 'e': 'E3', 'r': 'F3', 't': 'G3', 'y': 'A3', 'u': 'B3',
  'i': 'C4', 'o': 'D4', 'p': 'E4', '[': 'F4', ']': 'G4', '\\': 'A4', 'a': 'B4',
  's': 'C5', 'd': 'D5',
  'Q': 'C#3', 'W': 'D#3', 'R': 'F#3', 'T': 'G#3', 'Y': 'A#3',
  'I': 'C#4', 'O': 'D#4', '{': 'F#4', '}': 'G#4', '|': 'A#4',
  'S': 'C#5', 'D': 'D#5',
  'f': 'C1', 'g': 'D1', 'h': 'E1', 'j': 'F1', 'k': 'G1', 'l': 'A1', ';': 'B1',
  "'": 'C2', 'z': 'D2', 'x': 'E2', 'c': 'F2', 'v': 'G2', 'b': 'A2', 'n': 'B2',
  'F': 'C#1', 'G': 'D#1', 'J': 'F#1', 'K': 'G#1', 'L': 'A#1',
  '"': 'C#2', 'Z': 'D#2', 'C': 'F#2', 'V': 'G#2', 'B': 'A#2',
};

const noteToKeyMap = Object.entries(keyToNoteMap).reduce((acc, [key, note]) => {
  acc[note] = key;
  return acc;
}, {} as { [note in Note]?: string });

const CACHE_LIMIT = 15;

const level1_absoluteBeginner: Note[] = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
const level2_beginner: Note[] = allNotes.slice(allNotes.indexOf('C3'), allNotes.indexOf('C5') + 1).filter(note => !isBlackKeyMap[note]);
const level3_intermediate: Note[] = allNotes.slice(allNotes.indexOf('C3'), allNotes.indexOf('B4') + 1);
const level4_advanced: Note[] = allNotes;
const level5_specialTraining: Note[] = allNotes.filter(note => isBlackKeyMap[note]);

type Difficulty = '1단계' | '2단계' | '3단계' | '4단계' | '5단계';
const difficultyLevels: { name: Difficulty, label: string }[] = [
  { name: '1단계', label: '입문' },
  { name: '2단계', label: '초급' },
  { name: '3단계', label: '중급' },
  { name: '4단계', label: '상급' },
  { name: '5단계', label: '전문' },
];

const MUSIC_PROGRESS_KEY = '@MiniGameApp:musicProgress';

interface MusicProgress {
  [difficulty: string]: {
    cumulativeSuccesses: number;
    highestScore: number;
  };
}

// 2.5D 타격감을 제공하는 개별 피아노 건반 컴포넌트 (UI 스레드 구동)
const PianoKey = React.memo(({
  note,
  isBlack,
  isVisible,
  width,
  height,
  leftPosition,
  onPressIn,
  onPressOut,
  showKeyLabels,
  keyboardLabel,
}: {
  note: Note;
  isBlack: boolean;
  isVisible: boolean;
  width: number;
  height: number;
  leftPosition?: number;
  onPressIn: (note: Note, event: any) => void;
  onPressOut: (note: Note) => void;
  showKeyLabels: boolean;
  keyboardLabel?: string;
}) => {
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(isBlack ? 0.35 : 0.15);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      shadowOpacity: shadowOpacity.value,
      backgroundColor: isBlack
        ? (translateY.value > 0 ? '#2a2a2a' : '#111111')
        : (translateY.value > 0 ? '#ececec' : '#ffffff'),
    };
  });

  const handlePressIn = (event: any) => {
    if (!isVisible) return;

    // Y축으로 즉시 눌림 작동 (백건 18px, 흑건 14px)
    translateY.value = isBlack ? 9 : 12;
    shadowOpacity.value = 0.06; // 눌리면 입체 그림자가 사라지듯 옅어짐

    // 햅틱 진동 유발 (중간 세기 타격감)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });

    onPressIn(note, event);
  };

  const handlePressOut = () => {
    if (!isVisible) return;

    // 부드럽게 원위치로 복구
    translateY.value = withTiming(0, { duration: 80 });
    shadowOpacity.value = withTiming(isBlack ? 0.35 : 0.15, { duration: 80 });

    onPressOut(note);
  };

  if (isBlack) {
    return (
      <AnimatedPressable
        disabled={!isVisible}
        style={[
          styles.blackKey,
          { width, height, left: leftPosition },
          animatedStyle,
          !isVisible && styles.keyDisabled,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={[styles.blackKeyTextLabel, !isVisible && styles.keyLabelDisabled]}>{note}</Text>
        {showKeyLabels && keyboardLabel && (
          <Text style={[styles.blackKeyLabel, !isVisible && styles.keyLabelDisabled]}>{keyboardLabel}</Text>
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      disabled={!isVisible}
      style={[
        styles.whiteKey,
        { width, height },
        animatedStyle,
        !isVisible && styles.whiteKeyDisabled,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[styles.keyTextLabel, !isVisible && styles.keyLabelDisabled]}>{note}</Text>
      {showKeyLabels && keyboardLabel && (
        <Text style={[styles.whiteKeyLabel, !isVisible && styles.keyLabelDisabled]}>{keyboardLabel}</Text>
      )}
    </AnimatedPressable>
  );
});

// 옥타브 시프트 뷰포트 하의 건반 렌더링
const renderPianoViewportRow = (
  notes: Note[],
  visibleNotes: Set<Note>,
  activeNotes: any,
  handlers: any,
  dynamicStyles: any,
  showKeyLabels: boolean,
  viewportStartIdx: number,
  viewportSize: number
) => {
  const whiteKeys = notes.filter(note => !isBlackKeyMap[note]);

  // 전체 백건 중 현재 뷰포트에 포함될 14개의 백건 필터링
  const visibleWhiteKeys = whiteKeys.slice(viewportStartIdx, viewportStartIdx + viewportSize);
  const visibleWhiteKeySet = new Set(visibleWhiteKeys);

  // 뷰포트 내 백건들에 인접한 흑건들만 도출
  const visibleBlackKeys = notes.filter(note => {
    if (!isBlackKeyMap[note]) return false;

    // 이 흑건에 바로 선행하는 백건 찾기
    const noteName = note.substring(0, note.length - 1);
    const octave = note.substring(note.length - 1);
    let precedingWhiteKeyNote: Note | undefined;
    switch (noteName) {
      case 'C#': precedingWhiteKeyNote = `C${octave}` as Note; break;
      case 'D#': precedingWhiteKeyNote = `D${octave}` as Note; break;
      case 'F#': precedingWhiteKeyNote = `F${octave}` as Note; break;
      case 'G#': precedingWhiteKeyNote = `G${octave}` as Note; break;
      case 'A#': precedingWhiteKeyNote = `A${octave}` as Note; break;
    }
    return precedingWhiteKeyNote ? visibleWhiteKeySet.has(precedingWhiteKeyNote) : false;
  });

  const getBlackKeyPosition = (note: Note): number | null => {
    const { whiteKeyWidth, blackKeyWidth } = dynamicStyles;
    const noteName = note.substring(0, note.length - 1);
    const octave = note.substring(note.length - 1);
    let precedingWhiteKeyNote: Note | undefined;
    switch (noteName) {
      case 'C#': precedingWhiteKeyNote = `C${octave}` as Note; break;
      case 'D#': precedingWhiteKeyNote = `D${octave}` as Note; break;
      case 'F#': precedingWhiteKeyNote = `F${octave}` as Note; break;
      case 'G#': precedingWhiteKeyNote = `G${octave}` as Note; break;
      case 'A#': precedingWhiteKeyNote = `A${octave}` as Note; break;
    }
    if (!precedingWhiteKeyNote) return null;
    const index = visibleWhiteKeys.indexOf(precedingWhiteKeyNote);
    if (index === -1) return null;
    // 뷰포트 상대적 위치로 흑건 위치 계산
    return (index + 1) * whiteKeyWidth - (blackKeyWidth / 2);
  };

  return (
    <View style={styles.rowContainer}>
      {visibleWhiteKeys.map(note => {
        const isVisible = visibleNotes.has(note);
        return (
          <PianoKey
            key={note}
            note={note}
            isBlack={false}
            isVisible={isVisible}
            width={dynamicStyles.whiteKeyWidth}
            height={dynamicStyles.whiteKeyHeight}
            onPressIn={handlers.handleNotePressIn}
            onPressOut={handlers.handleNotePressOut}
            showKeyLabels={showKeyLabels}
            keyboardLabel={noteToKeyMap[note]}
          />
        );
      })}
      {visibleBlackKeys.map(note => {
        const isVisible = visibleNotes.has(note);
        const leftPosition = getBlackKeyPosition(note);
        if (leftPosition === null) return null;
        return (
          <PianoKey
            key={note}
            note={note}
            isBlack={true}
            isVisible={isVisible}
            width={dynamicStyles.blackKeyWidth}
            height={dynamicStyles.blackKeyHeight}
            leftPosition={leftPosition}
            onPressIn={handlers.handleNotePressIn}
            onPressOut={handlers.handleNotePressOut}
            showKeyLabels={showKeyLabels}
            keyboardLabel={noteToKeyMap[note]}
          />
        );
      })}
    </View>
  );
};

export default function App() {

  const KEYBOARD_ENABLED = false;
  const VISUALIZER_MODE: 'ripple' | 'particle' = 'particle'; // 스위치 제공 ('ripple'로 변경 시 이전 물결로 복구)
  const SHOW_ANSWER_HINT = true; // 테스트용 정답 힌트 노출 스위치 (true 활성화 / false 비활성화)
  const [isReady, setIsReady] = useState(false);

  // 청능 훈련 상태 관리
  const [activeNotes, setActiveNotes] = useState<{ [key in Note]?: boolean }>({});
  const [isTraining, setIsTraining] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('3단계');
  const [progress, setProgress] = useState<MusicProgress>({});
  const [showMissionSuccess, setShowMissionSuccess] = useState(false);

  // 낙하노트 모드 상태 관리
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const scheduledNotesRef = useRef<{ note: Note; expectedTimestamp: number; hit: boolean; beat: number }[]>([]);
  const [hitNoteIds, setHitNoteIds] = useState<string[]>([]);
  const [soundFirstOffset, setSoundFirstOffset] = useState(0); // '귀 먼저' 모드 (기본 0, 옵션으로 500ms 등)

  const handleNoteSchedule = useCallback((note: Note, expectedTimestamp: number, beat: number) => {
    const playTime = expectedTimestamp - soundFirstOffset;
    const delay = playTime - Date.now();

    if (delay > 0) {
      setTimeout(() => playSound(note), delay);
    } else {
      playSound(note);
    }

    scheduledNotesRef.current.push({ note, expectedTimestamp, hit: false, beat });
  }, [soundFirstOffset]);

  // 옥타브 시프트 뷰포트 상태 (난이도에 따라 백건 개수 가변)
  const getViewportSize = () => {
    if (difficulty === '1단계') return 8;
    if (difficulty === '2단계') return 15;
    return 16; // 3단계(중급) 및 4단계(상급)에서 16건반 지원
  };
  const VIEWPORT_SIZE = getViewportSize();

  const [viewportStartIdx, setViewportStartIdx] = useState(14);

  // 1, 2, 3단계에서는 시작 옥타브 인덱스를 C3(14)로 강제 고정
  const isFixedViewport = difficulty === '1단계' || difficulty === '2단계' || difficulty === '3단계';
  const currentStartIdx = isFixedViewport ? 14 : viewportStartIdx;

  // 옥타브 버튼 애니메이션용 Shared Values
  const leftArrowOpacity = useSharedValue(1);
  const leftArrowTranslateX = useSharedValue(0);
  const rightArrowOpacity = useSharedValue(1);
  const rightArrowTranslateX = useSharedValue(0);

  // 옥타브 가이드 애니메이션 제어
  useEffect(() => {
    if (!isTraining || !currentNote) {
      leftArrowOpacity.value = withTiming(1, { duration: 200 });
      leftArrowTranslateX.value = withTiming(0, { duration: 200 });
      rightArrowOpacity.value = withTiming(1, { duration: 200 });
      rightArrowTranslateX.value = withTiming(0, { duration: 200 });
      return;
    }

    const noteWhiteIdx = whiteIdxRefById.get(currentNote);
    if (noteWhiteIdx == null) return;

    // 오직 4단계(상급) 모드에서만 화면 밖에 음이 있을 때 화살표 힌트 가이드 애니메이션 기동
    const isGuideActive = difficulty === '4단계';
    const showLeftGuide = isGuideActive && noteWhiteIdx < currentStartIdx;
    const showRightGuide = isGuideActive && noteWhiteIdx >= currentStartIdx + VIEWPORT_SIZE;

    if (showLeftGuide) {
      leftArrowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 500, easing: Easing.ease }),
          withTiming(1, { duration: 500, easing: Easing.ease })
        ),
        -1,
        true
      );
      leftArrowTranslateX.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 400, easing: Easing.ease }),
          withTiming(0, { duration: 400, easing: Easing.ease })
        ),
        -1,
        true
      );
    } else {
      leftArrowOpacity.value = withTiming(1, { duration: 200 });
      leftArrowTranslateX.value = withTiming(0, { duration: 200 });
    }

    if (showRightGuide) {
      rightArrowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 500, easing: Easing.ease }),
          withTiming(1, { duration: 500, easing: Easing.ease })
        ),
        -1,
        true
      );
      rightArrowTranslateX.value = withRepeat(
        withSequence(
          withTiming(6, { duration: 400, easing: Easing.ease }),
          withTiming(0, { duration: 400, easing: Easing.ease })
        ),
        -1,
        true
      );
    } else {
      rightArrowOpacity.value = withTiming(1, { duration: 200 });
      rightArrowTranslateX.value = withTiming(0, { duration: 200 });
    }
  }, [isTraining, currentNote, currentStartIdx, difficulty, VIEWPORT_SIZE]);

  // 터치 물결 효과용 Shared Values
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const rippleProgress = useSharedValue(0);
  const triggerTime = useSharedValue(0); // 파티클 트리거용 시간 Shared Value

  // 오디오 플레이어 캐시
  const soundCache = useRef<{ [key in Note]?: any }>({});
  const recentlyUsedNotes = useRef<Note[]>([]);
  const visualizerRef = useRef<ParticleVisualizerRef>(null); // 소리 별자리 및 파티클용 Ref

  const starContext = useContext(StarContext) as any;
  const clearContext = useContext(ClearContext) as any;

  const { height, width } = useWindowDimensions();

  // 자동 옥타브 포커싱 훅 결합 (기존 포커싱 기능은 완전히 비활성화하여 수동 이동 유도)
  useAutoFocusViewport({
    currentNote: null,
    viewportStartIdx,
    setViewportStartIdx,
    totalWhite: allNotes.filter(n => !isBlackKeyMap[n]).length,
    viewportSize: VIEWPORT_SIZE,
  });

  // 초기화 및 라이프사이클 관리
  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      try {
        // 화면 방향 고정 (가로)
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        // 글로벌 오디오 모드 설정
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'mixWithOthers',
        });
      } catch (e) {
        console.error('App initialization failed:', e);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    initializeApp();

    // 저장 기록 로드
    const loadProgress = async () => {
      try {
        const savedProgress = await AsyncStorage.getItem(MUSIC_PROGRESS_KEY);
        if (savedProgress) {
          setProgress(JSON.parse(savedProgress));
        }
      } catch (e) {
        console.error('Failed to load music progress.', e);
      }
    };
    loadProgress();

    return () => {
      isMounted = false;
      // 사운드 리소스 안전 해제 (메모리 누수 차단)
      for (const player of Object.values(soundCache.current)) {
        try {
          player?.release();
        } catch (e) {
          console.warn('Failed to release audio player on unmount', e);
        }
      }
      // 캐시 및 사용 내역 강제 소거로 핫 리로드 시 발생하는 release 충돌 해결
      soundCache.current = {};
      recentlyUsedNotes.current = [];
    };
  }, []);

  // 저장 기록 동기화
  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      AsyncStorage.setItem(MUSIC_PROGRESS_KEY, JSON.stringify(progress)).catch(e =>
        console.error('Failed to save music progress.', e)
      );
    }
  }, [progress]);

  const getVisibleNoteSet = () => {
    switch (difficulty) {
      case '1단계': return new Set(level1_absoluteBeginner);
      case '2단계': return new Set(level2_beginner);
      case '3단계': return new Set(level3_intermediate);
      case '4단계': return new Set(level4_advanced);
      case '5단계': return new Set(level5_specialTraining);
      default: return new Set(level3_intermediate);
    }
  };
  const visibleNoteSet = getVisibleNoteSet();

  const playSound = async (note: Note) => {
    try {
      let player = soundCache.current[note];
      if (!player) {
        if (recentlyUsedNotes.current.length >= CACHE_LIMIT) {
          const lruNote = recentlyUsedNotes.current.pop();
          if (lruNote && soundCache.current[lruNote]) {
            try {
              soundCache.current[lruNote].release();
            } catch (e) { }
            delete soundCache.current[lruNote];
          }
        }
        player = createAudioPlayer(soundFiles[note]);
        soundCache.current[note] = player;
      }
      recentlyUsedNotes.current = recentlyUsedNotes.current.filter(n => n !== note);
      recentlyUsedNotes.current.unshift(note);

      // 연타 등으로 이미 재생 중일 때 이전 음을 끊지 않고 포개어 재생 (폴리포니)
      if (player.playing) {
        const tempPlayer = createAudioPlayer(soundFiles[note]);
        tempPlayer.play();
        // 3초 뒤 재생 완료 후 자동 메모리 해제
        setTimeout(() => {
          try {
            tempPlayer.release();
          } catch (e) { }
        }, 3000);
      } else {
        player.seekTo(0);
        player.play();
      }
    } catch (error) {
      console.log(`'${note}' 음원 재생 실패:`, error);
    }
  };

  const playNextQuestion = useCallback(() => {
    let notesToUse: Note[];
    switch (difficulty) {
      case '1단계': notesToUse = level1_absoluteBeginner; break;
      case '2단계': notesToUse = level2_beginner; break;
      case '3단계': notesToUse = level3_intermediate; break;
      case '4단계': notesToUse = level4_advanced; break;
      case '5단계': notesToUse = level5_specialTraining; break;
      default: notesToUse = level3_intermediate; break;
    }
    const randomIndex = Math.floor(Math.random() * notesToUse.length);
    const randomNote = notesToUse[randomIndex];
    setCurrentNote(randomNote);
    playSound(randomNote);
  }, [difficulty]);

  const startTraining = () => {
    setIsTraining(true);
    setScore(0);
    setFeedback('훈련 시작!');
    setCurrentSong(null);
    playNextQuestion();
  };

  const startFallingNoteMode = () => {
    setIsTraining(true);
    setScore(0);
    setFeedback('낙하노트 훈련 시작!');
    setCurrentNote(null);
    scheduledNotesRef.current = [];
    setHitNoteIds([]);
    // 3단계(중급) 이하면 5음(펜타토닉) 중 랜덤 1곡, 4단계(상급) 이상이면 8음(백건) 중 랜덤 1곡
    const availableSongs = difficulty === '1단계' || difficulty === '2단계' || difficulty === '3단계' ? songs.filter(s => s.scale === 'penta5') : songs.filter(s => s.scale === 'white8');
    const pickedSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    setCurrentSong(pickedSong);
  };

  const stopTraining = () => {
    setIsTraining(false);
    setCurrentNote(null);
    setCurrentSong(null);
    setFeedback('');
  };

  const repeatSound = () => {
    if (currentNote) {
      playSound(currentNote);
    }
  };

  const handleNotePressIn = useCallback((note: Note, event: any) => {
    // 1. 소리 재생
    playSound(note);
    setActiveNotes(prev => ({ ...prev, [note]: true }));

    // 2. 터치한 절대 좌표 위치(pageX, pageY)를 이용한 물결(Ripple) 이펙트 트리거
    console.log(`[Touch debug] note: ${note}, hasEvent: ${!!event}, hasNativeEvent: ${!!(event && event.nativeEvent)}`);
    if (event && event.nativeEvent) {
      const { pageX, pageY } = event.nativeEvent;
      console.log(`[Touch debug] Coordinates: pageX=${pageX}, pageY=${pageY}`);
      touchX.value = pageX;
      touchY.value = pageY;
      triggerTime.value = Date.now(); // 파티클 트리거 시간 갱신

      rippleProgress.value = 0;
      rippleProgress.value = withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 })
      );
    }

    // 3. 청능 훈련 채점 판단
    if (isTraining) {
      if (currentSong) {
        const now = Date.now();
        const hitWindowMs = 300;
        const targetIndex = scheduledNotesRef.current.findIndex(sn => 
          !sn.hit && sn.note === note && Math.abs(sn.expectedTimestamp - now) <= hitWindowMs
        );
        
        if (targetIndex !== -1) {
          const hitNote = scheduledNotesRef.current[targetIndex];
          scheduledNotesRef.current[targetIndex].hit = true;
          setHitNoteIds(prev => [...prev, `${hitNote.note}-${hitNote.beat}`]);
          
          const newScore = score + 1;
          setScore(newScore);
          
          const index = score % 15;
          const skyWidth = width - 60;
          const x = 30 + (skyWidth * (index / 14));
          const y = 75 + Math.sin(index * 1.5) * 10;
          visualizerRef.current?.addStar(x, y);
          
          setFeedback('Great!');
        } else {
          setFeedback('Miss');
        }
      } else if (currentNote) {
        if (note === currentNote) {
        const newScore = score + 1;
        setScore(newScore);

        // 정답 시 콤보 별자리 생성: 화면 가로 폭 전체를 활용하여 흐르는 사인파 은하수 파동선 빌드 (하단 제어반 배치 반영)
        const index = score % 15; // 최대 15개 콤보 순환
        const skyWidth = width - 60; // 양쪽 마진 우회
        const x = 30 + (skyWidth * (index / 14)); // X축 가로 등간격 전진
        const y = 75 + Math.sin(index * 1.5) * 10; // Y축 완만한 위아래 물결 파동 구현 (옥타브 컨트롤러와 건반 사이 안착)
        visualizerRef.current?.addStar(x, y);

        const currentProgress = progress[difficulty] || { cumulativeSuccesses: 0, highestScore: 0 };
        const newCumulativeSuccesses = currentProgress.cumulativeSuccesses + 1;

        const updatedProgress = {
          ...progress,
          [difficulty]: {
            cumulativeSuccesses: newCumulativeSuccesses,
            highestScore: Math.max(currentProgress.highestScore, newScore),
          },
        };
        setProgress(updatedProgress);

        if (newCumulativeSuccesses >= 3) {
          starContext?.addStar(`music_${difficulty}`);
        }
        if (newScore >= 5) {
          clearContext?.markAsCleared(`music_${difficulty}`);
        }

        if (newScore === 5) {
          // 5점 최초 달성 시 성공 햅틱 및 화면 중앙 오버레이 피드백 제공
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowMissionSuccess(true);
          setFeedback('정답!');
          setTimeout(() => {
            setShowMissionSuccess(false);
            setFeedback('다음 문제');
            playNextQuestion();
          }, 2500);
        } else {
          setFeedback('정답!');
          setTimeout(() => {
            setFeedback('다음 문제');
            playNextQuestion();
          }, 1000);
        }
      } else {
        setScore(prev => (prev > 0 ? prev - 1 : 0));
        setFeedback('오답! 다시 들어보세요.');
        visualizerRef.current?.onWrong(); // 오답 시 별자리 흩어짐(초기화)
      }
    }
  }
  }, [isTraining, currentNote, currentSong, playNextQuestion, score, progress, difficulty, starContext, clearContext]);

  const handleNotePressOut = useCallback((note: Note) => {
    setActiveNotes(prev => {
      const newActiveNotes = { ...prev };
      delete newActiveNotes[note];
      return newActiveNotes;
    });
  }, []);

  const handleShiftLeft = () => {
    setViewportStartIdx(0);
  };

  const handleShiftRight = () => {
    setViewportStartIdx(14);
  };


  const BOTTOM_PANEL_HEIGHT = 115;
  const PIANO_AREA_PADDING = 20;
  const pianoAreaWidth = width - PIANO_AREA_PADDING;

  const dynamicWhiteKeyWidth = pianoAreaWidth / VIEWPORT_SIZE;
  const dynamicStyles = {
    whiteKeyWidth: dynamicWhiteKeyWidth,
    blackKeyWidth: dynamicWhiteKeyWidth * 0.6,
    whiteKeyHeight: height - BOTTOM_PANEL_HEIGHT - 90, // 하단 제어반 높이를 고려하여 산정
    blackKeyHeight: (height - BOTTOM_PANEL_HEIGHT - 90) * 0.65,
  };

  const handlers = { handleNotePressIn, handleNotePressOut };

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.fullScreen}>
          {/* 2. Midground Layer (Piano & 훈련 인터페이스) */}
          <View style={styles.midgroundLayer} pointerEvents="box-none">
            {/* 상단 피아노 건반 영역 */}
            <View style={styles.pianoArea} pointerEvents="box-none">
              {currentSong && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents="none">
                  <FallingNoteTrack 
                    song={currentSong}
                    isPlaying={isTraining}
                    onNoteSchedule={handleNoteSchedule}
                    viewportStartIdx={currentStartIdx}
                    dynamicWhiteKeyWidth={dynamicStyles.whiteKeyWidth}
                    whiteIdxMap={whiteIdxMap}
                    hitNoteIds={hitNoteIds}
                  />
                </View>
              )}
              {!isFixedViewport && (
                <View style={styles.octaveController}>
                  <Animated.View style={{
                    opacity: leftArrowOpacity,
                    transform: [{ translateX: leftArrowTranslateX }]
                  }}>
                    <TouchableOpacity
                      style={[
                        styles.octaveBtn,
                        viewportStartIdx === 0 && styles.octaveBtnDisabled,
                        (isTraining && currentNote && (whiteIdxRefById.get(currentNote) ?? 0) < viewportStartIdx && difficulty === '4단계') && styles.octaveBtnHighlight
                      ]}
                      onPress={handleShiftLeft}
                      disabled={viewportStartIdx === 0}
                    >
                      <Ionicons name="chevron-back" size={24} color="#fff" />
                      <Text style={styles.octaveBtnText}>옥타브 낮춤</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* 중앙 미니 피아노 맵 배치 */}
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <MiniKeyboardMap
                      viewportStartIdx={currentStartIdx}
                      setViewportStartIdx={setViewportStartIdx}
                      currentNote={currentNote}
                      isTraining={isTraining}
                      viewportSize={VIEWPORT_SIZE}
                    />
                  </View>

                  <Animated.View style={{
                    opacity: rightArrowOpacity,
                    transform: [{ translateX: rightArrowTranslateX }]
                  }}>
                    <TouchableOpacity
                      style={[
                        styles.octaveBtn,
                        viewportStartIdx === 14 && styles.octaveBtnDisabled,
                        (isTraining && currentNote && (whiteIdxRefById.get(currentNote) ?? 0) >= viewportStartIdx + VIEWPORT_SIZE && difficulty === '4단계') && styles.octaveBtnHighlight
                      ]}
                      onPress={handleShiftRight}
                      disabled={viewportStartIdx === 14}
                    >
                      <Text style={styles.octaveBtnText}>옥타브 높임</Text>
                      <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}

              <View style={styles.pianoContainer} pointerEvents="box-none">
                <View style={styles.pianoWrapper} pointerEvents="box-none">
                  {renderPianoViewportRow(
                    allNotes,
                    visibleNoteSet,
                    activeNotes,
                    handlers,
                    dynamicStyles,
                    KEYBOARD_ENABLED,
                    currentStartIdx,
                    VIEWPORT_SIZE
                  )}
                </View>
              </View>
            </View>

            {/* 하단 미션 제어반 */}
            <View style={styles.trainingContainer}>
              {/* 왼쪽 영역: 점수 및 피드백 */}
              <View style={styles.infoSection}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreText}>점수: {score}</Text>
                  <View style={{ marginLeft: 8 }}>
                    <MissionProgressIcon currentStep={Math.min(score, 5)} totalSteps={5} />
                  </View>
                </View>
                <Text style={styles.feedbackText}>{feedback}</Text>
                {SHOW_ANSWER_HINT && isTraining && currentNote && (
                  <Text style={styles.hintText}>★ 정답: {currentNote}</Text>
                )}
              </View>

              {/* 중앙 영역: 난이도 선택 */}
              <View style={styles.difficultySection}>
                <View style={styles.difficultyContainer}>
                  {difficultyLevels.map(({ name, label }) => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.difficultyButton, difficulty === name && styles.difficultyButtonActive]}
                      onPress={() => !isTraining && setDifficulty(name)}
                      disabled={isTraining}
                    >
                      <Text style={styles.difficultyButtonText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 오른쪽 영역: 훈련 액션 */}
              <View style={styles.actionSection}>
                {!isTraining && (
                  <TouchableOpacity
                    style={styles.trainingButton}
                    onPress={startFallingNoteMode}
                  >
                    <Text style={styles.buttonText}>낙하노트</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.trainingButton, isTraining && styles.trainingButtonActive]}
                  onPress={isTraining ? stopTraining : startTraining}
                >
                  <Text style={styles.buttonText}>{isTraining ? '훈련 종료' : '무작위 훈련'}</Text>
                </TouchableOpacity>
                {isTraining && (
                  <TouchableOpacity style={styles.repeatButton} onPress={repeatSound}>
                    <Text style={styles.buttonText}>다시 듣기</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* 미션 성공 오버레이 (터치 차단 포함) */}
          {showMissionSuccess && (
            <View style={styles.missionOverlay}>
              <View style={styles.missionOverlayBox}>
                <Text style={styles.missionOverlayText}>★ 미션 성공! ★</Text>
                <Text style={styles.missionOverlaySubText}>자유롭게 계속 도전해보세요!</Text>
              </View>
            </View>
          )}

          {/* 3. Ripple Effect Layer / Particle Visualizer (가장 상위 레이어 zIndex: 99 강제 배치) */}
          <View style={styles.rippleContainer} pointerEvents="none">
            {VISUALIZER_MODE === 'particle' ? (
              <ParticleVisualizer ref={visualizerRef} touchX={touchX} touchY={touchY} triggerTime={triggerTime} />
            ) : (
              <RippleLayer touchX={touchX} touchY={touchY} rippleProgress={rippleProgress} />
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'column',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  midgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    zIndex: 2,
  },
  trainingContainer: {
    width: '100%',
    height: 115,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(34, 34, 34, 0.85)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoSection: {
    flex: 1.2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hintText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  difficultySection: {
    flex: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSection: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    gap: 12,
  },
  repeatButton: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pianoArea: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  octaveController: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '95%',
    backgroundColor: 'rgba(41, 41, 41, 0.8)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  octaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  octaveBtnHighlight: {
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  octaveBtnDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  octaveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  octaveIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  octaveIndicatorText: {
    color: '#00e5ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  difficultyContainerWrapper: {
    width: '100%',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  pianoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  pianoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    position: 'relative',
    marginVertical: 8,
  },
  difficultyButton: {
    backgroundColor: '#555',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    margin: 4,
  },
  trainingButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingButtonActive: {
    backgroundColor: '#FF3B30',
  },
  difficultyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  feedbackText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  whiteKey: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
    // 2.5D 입체감 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 4,
    elevation: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  blackKey: {
    position: 'absolute',
    backgroundColor: 'black',
    borderRadius: 4,
    zIndex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
    // 2.5D 입체감 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 5,
    elevation: 15,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  keyTextLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  blackKeyTextLabel: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  whiteKeyLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  blackKeyLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  difficultyButtonActive: {
    backgroundColor: '#007BFF',
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  whiteKeyDisabled: {
    backgroundColor: '#666',
    borderColor: '#444',
    opacity: 0.25,
  },
  keyDisabled: {
    opacity: 0.25,
  },
  keyLabelDisabled: {
    color: '#555',
  },
  rippleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    elevation: 99,
  },
  missionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 115, // 하단 제어반(115px)을 제외한 피아노 영역 전체를 커버하여 터치 차단
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 90,
  },
  missionOverlayBox: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00e5ff',
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  missionOverlayText: {
    color: '#00e5ff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  missionOverlaySubText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
