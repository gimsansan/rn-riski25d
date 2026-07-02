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

const computeFocusStart = (noteWhiteIdx: number, currentStart: number, viewportSize: number, totalWhite: number) => {
  const end = currentStart + viewportSize - 1;
  if (noteWhiteIdx >= currentStart && noteWhiteIdx <= end) {
    return currentStart;
  }
  const maxStart = Math.max(0, totalWhite - viewportSize);
  const centered = noteWhiteIdx - Math.floor(viewportSize / 2);
  return Math.max(0, Math.min(centered, maxStart));
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

  // 옥타브 시프트 뷰포트 상태
  const VIEWPORT_SIZE = 14;
  const [viewportStartIdx, setViewportStartIdx] = useState(14);

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

  // 자동 옥타브 포커싱 훅 결합
  useAutoFocusViewport({
    currentNote,
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
    playNextQuestion();
  };

  const stopTraining = () => {
    setIsTraining(false);
    setCurrentNote(null);
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
    if (isTraining && currentNote) {
      if (note === currentNote) {
        const newScore = score + 1;
        setScore(newScore);

        // 정답 시 콤보 별자리 생성: 왼쪽 240px 제어반을 피해 가로로 흐르는 사인파 은하수 파동선 빌드
        const index = score % 15; // 최대 15개 콤보 순환
        const skyWidth = width - 240 - 60; // 좌측 제어판(240px) 및 양쪽 마진 우회
        const x = 240 + 30 + (skyWidth * (index / 14)); // X축 가로 등간격 전진
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

        setFeedback('정답!');
        setTimeout(() => {
          setFeedback('다음 문제');
          playNextQuestion();
        }, 1000);
      } else {
        setScore(prev => (prev > 0 ? prev - 1 : 0));
        setFeedback('오답! 다시 들어보세요.');
        visualizerRef.current?.onWrong(); // 오답 시 별자리 흩어짐(초기화)
      }
    }
  }, [isTraining, currentNote, playNextQuestion, score, progress, difficulty, starContext, clearContext]);

  const handleNotePressOut = useCallback((note: Note) => {
    setActiveNotes(prev => {
      const newActiveNotes = { ...prev };
      delete newActiveNotes[note];
      return newActiveNotes;
    });
  }, []);

  const handleShiftLeft = () => {
    setViewportStartIdx(prev => Math.max(0, prev - 7));
  };

  const handleShiftRight = () => {
    setViewportStartIdx(prev => Math.min(16, prev + 7));
  };

  const getViewportRangeLabel = () => {
    const whiteKeys = allNotes.filter(note => !isBlackKeyMap[note]);
    const startNote = whiteKeys[viewportStartIdx];
    const endNote = whiteKeys[viewportStartIdx + VIEWPORT_SIZE - 1];
    return `${startNote} ~ ${endNote}`;
  };

  const CONTROL_PANEL_WIDTH = 240;
  const PIANO_AREA_PADDING = 20;
  const pianoAreaWidth = width - CONTROL_PANEL_WIDTH - PIANO_AREA_PADDING;

  const dynamicWhiteKeyWidth = pianoAreaWidth / VIEWPORT_SIZE;
  const dynamicStyles = {
    whiteKeyWidth: dynamicWhiteKeyWidth,
    blackKeyWidth: dynamicWhiteKeyWidth * 0.6,
    whiteKeyHeight: height - 180, // 기존보다 약 80px 하향 조정하여 실제 피아노 1:5 비율과 대칭
    blackKeyHeight: (height - 180) * 0.65,
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
            {/* 좌측 미션 제어반 */}
            <View style={styles.trainingContainer}>
              <View style={{ position: 'absolute', top: -20, left: 100, zIndex: 100 }}>
                <MissionProgressIcon currentStep={score} totalSteps={5} />
              </View>
              <Text style={styles.scoreText}>점수: {score}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.trainingButton}
                  onPress={isTraining ? stopTraining : startTraining}
                >
                  <Text style={styles.buttonText}>{isTraining ? '훈련 종료' : '청능 훈련'}</Text>
                </TouchableOpacity>
                {isTraining && (
                  <TouchableOpacity style={styles.trainingButton} onPress={repeatSound}>
                    <Text style={styles.buttonText}>다시 듣기</Text>
                  </TouchableOpacity>
                )}
              </View>
              {SHOW_ANSWER_HINT && isTraining && currentNote && (
                <Text style={{ color: '#FF453A', fontSize: 18, fontWeight: 'bold', marginVertical: 6, textAlign: 'center' }}>
                  ★ 정답: {currentNote}
                </Text>
              )}
              <Text style={styles.feedbackText}>{feedback}</Text>
              <View style={styles.difficultyContainerWrapper}>
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
            </View>

            {/* 우측 피아노 건반 영역 */}
            <View style={styles.pianoArea} pointerEvents="box-none">
              <View style={styles.octaveController}>
                <TouchableOpacity
                  style={[styles.octaveBtn, viewportStartIdx === 0 && styles.octaveBtnDisabled]}
                  onPress={handleShiftLeft}
                  disabled={viewportStartIdx === 0}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                  <Text style={styles.octaveBtnText}>옥타브 낮춤</Text>
                </TouchableOpacity>
                <View style={styles.octaveIndicator}>
                  <Text style={styles.octaveIndicatorText}>현재 범위: {getViewportRangeLabel()}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.octaveBtn, viewportStartIdx === 16 && styles.octaveBtnDisabled]}
                  onPress={handleShiftRight}
                  disabled={viewportStartIdx === 16}
                >
                  <Text style={styles.octaveBtnText}>옥타브 높임</Text>
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.pianoContainer} pointerEvents="box-none">
                <View style={styles.pianoWrapper} pointerEvents="box-none">
                  {renderPianoViewportRow(
                    allNotes,
                    visibleNoteSet,
                    activeNotes,
                    handlers,
                    dynamicStyles,
                    KEYBOARD_ENABLED,
                    viewportStartIdx,
                    VIEWPORT_SIZE
                  )}
                </View>
              </View>
            </View>
          </View>

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
    flexDirection: 'row',
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
    flexDirection: 'row',
    zIndex: 2,
  },
  trainingContainer: {
    width: 240,
    height: '100%',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(34, 34, 34, 0.75)', // 우주 배경이 슬쩍 비치도록 반투명하게 변경 (Glassmorphism 연출)
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRightWidth: 2,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
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
    flexWrap: 'wrap',
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
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginVertical: 6,
    width: 200,
    alignItems: 'center',
  },
  difficultyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    minHeight: 50,
    textAlign: 'center',
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
    backgroundColor: '#c4c4c4',
    borderColor: '#888',
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyLabelDisabled: {
    color: '#777',
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
});
