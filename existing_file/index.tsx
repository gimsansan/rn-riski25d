import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { MissionProgressIcon } from '../components/MissionProgressIcon';
import { ClearContext } from '../context/ClearContext';
import { StarContext } from '../context/StarContext';
// import Rive from 'rive-react-native';

// Note 타입 정의 (전체 52음 복원)
type Note =
  | 'C1' | 'C#1' | 'D1' | 'D#1' | 'E1' | 'F1' | 'F#1' | 'G1' | 'G#1' | 'A1' | 'A#1' | 'B1'
  | 'C2' | 'C#2' | 'D2' | 'D#2' | 'E2' | 'F2' | 'F#2' | 'G2' | 'G#2' | 'A2' | 'A#2' | 'B2'
  | 'C3' | 'C#3' | 'D3' | 'D#3' | 'E3' | 'F3' | 'F#3' | 'G3' | 'G#3' | 'A3' | 'A#3' | 'B3'
  | 'C4' | 'C#4' | 'D4' | 'D#4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'G#4' | 'A4' | 'A#4' | 'B4'
  | 'C5' | 'C#5' | 'D5' | 'D#5';

// 사운드 파일 경로 (52개 수동 제공 M4A 파일 매핑)
const soundFiles: { [key in Note]: any } = {
  'C1': require('../assets/m4a-sounds/C1.m4a'), 'C#1': require('../assets/m4a-sounds/C_sharp1.m4a'),
  'D1': require('../assets/m4a-sounds/D1.m4a'), 'D#1': require('../assets/m4a-sounds/D_sharp1.m4a'),
  'E1': require('../assets/m4a-sounds/E1.m4a'), 'F1': require('../assets/m4a-sounds/F1.m4a'),
  'F#1': require('../assets/m4a-sounds/F_sharp1.m4a'), 'G1': require('../assets/m4a-sounds/G1.m4a'),
  'G#1': require('../assets/m4a-sounds/G_sharp1.m4a'), 'A1': require('../assets/m4a-sounds/A1.m4a'),
  'A#1': require('../assets/m4a-sounds/A_sharp1.m4a'), 'B1': require('../assets/m4a-sounds/B1.m4a'),
  'C2': require('../assets/m4a-sounds/C2.m4a'), 'C#2': require('../assets/m4a-sounds/C_sharp2.m4a'),
  'D2': require('../assets/m4a-sounds/D2.m4a'), 'D#2': require('../assets/m4a-sounds/D_sharp2.m4a'),
  'E2': require('../assets/m4a-sounds/E2.m4a'), 'F2': require('../assets/m4a-sounds/F2.m4a'),
  'F#2': require('../assets/m4a-sounds/F_sharp2.m4a'), 'G2': require('../assets/m4a-sounds/G2.m4a'),
  'G#2': require('../assets/m4a-sounds/G_sharp2.m4a'), 'A2': require('../assets/m4a-sounds/A2.m4a'),
  'A#2': require('../assets/m4a-sounds/A_sharp2.m4a'), 'B2': require('../assets/m4a-sounds/B2.m4a'),
  'C3': require('../assets/m4a-sounds/C3.m4a'), 'C#3': require('../assets/m4a-sounds/C_sharp3.m4a'),
  'D3': require('../assets/m4a-sounds/D3.m4a'), 'D#3': require('../assets/m4a-sounds/D_sharp3.m4a'),
  'E3': require('../assets/m4a-sounds/E3.m4a'), 'F3': require('../assets/m4a-sounds/F3.m4a'),
  'F#3': require('../assets/m4a-sounds/F_sharp3.m4a'), 'G3': require('../assets/m4a-sounds/G3.m4a'),
  'G#3': require('../assets/m4a-sounds/G_sharp3.m4a'), 'A3': require('../assets/m4a-sounds/A3.m4a'),
  'A#3': require('../assets/m4a-sounds/A_sharp3.m4a'), 'B3': require('../assets/m4a-sounds/B3.m4a'),
  'C4': require('../assets/m4a-sounds/C4.m4a'), 'C#4': require('../assets/m4a-sounds/C_sharp4.m4a'),
  'D4': require('../assets/m4a-sounds/D4.m4a'), 'D#4': require('../assets/m4a-sounds/D_sharp4.m4a'),
  'E4': require('../assets/m4a-sounds/E4.m4a'), 'F4': require('../assets/m4a-sounds/F4.m4a'),
  'F#4': require('../assets/m4a-sounds/F_sharp4.m4a'), 'G4': require('../assets/m4a-sounds/G4.m4a'),
  'G#4': require('../assets/m4a-sounds/G_sharp4.m4a'), 'A4': require('../assets/m4a-sounds/A4.m4a'),
  'A#4': require('../assets/m4a-sounds/A_sharp4.m4a'), 'B4': require('../assets/m4a-sounds/B4.m4a'),
  'C5': require('../assets/m4a-sounds/C5.m4a'), 'C#5': require('../assets/m4a-sounds/C_sharp5.m4a'),
  'D5': require('../assets/m4a-sounds/D5.m4a'), 'D#5': require('../assets/m4a-sounds/D_sharp5.m4a'),
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
  'q': 'C3',  'w': 'D3',  'e': 'E3',  'r': 'F3',  't': 'G3',  'y': 'A3',  'u': 'B3',
  'i': 'C4',  'o': 'D4',  'p': 'E4',  '[': 'F4',  ']': 'G4',  '\\': 'A4', 'a': 'B4',
  's': 'C5',  'd': 'D5',
  'Q': 'C#3', 'W': 'D#3',             'R': 'F#3', 'T': 'G#3', 'Y': 'A#3',
  'I': 'C#4', 'O': 'D#4',             '{': 'F#4', '}': 'G#4', '|': 'A#4',
  'S': 'C#5', 'D': 'D#5',
  'f': 'C1',  'g': 'D1',  'h': 'E1',  'j': 'F1',  'k': 'G1',  'l': 'A1',  ';': 'B1',
  "'": 'C2',  'z': 'D2',  'x': 'E2',  'c': 'F2',  'v': 'G2',  'b': 'A2',  'n': 'B2',
  'F': 'C#1', 'G': 'D#1',             'J': 'F#1', 'K': 'G#1', 'L': 'A#1',
  '"': 'C#2', 'Z': 'D#2',             'C': 'F#2', 'V': 'G#2', 'B': 'A#2',
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
  }
}

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
                  <TouchableOpacity
                      key={note}
                      disabled={!isVisible}
                      style={[ 
                        styles.whiteKey, 
                        { width: dynamicStyles.whiteKeyWidth, height: dynamicStyles.whiteKeyHeight }, 
                        activeNotes[note] && styles.whiteKeyPressed, 
                        !isVisible && styles.whiteKeyDisabled 
                      ]}
                      onPressIn={() => handlers.handleNotePressIn(note)}
                      onPressOut={() => handlers.handleNotePressOut(note)}
                      activeOpacity={1}
                  >
                      {/* 건반 하단에 음계 텍스트 표시 */}
                      <Text style={[styles.keyTextLabel, !isVisible && styles.keyLabelDisabled]}>{note}</Text>
                      {showKeyLabels && noteToKeyMap[note] && (
                        <Text style={[styles.whiteKeyLabel, !isVisible && styles.keyLabelDisabled]}>{noteToKeyMap[note]}</Text>
                      )}
                  </TouchableOpacity>
              );
          })}
          {visibleBlackKeys.map(note => {
              const isVisible = visibleNotes.has(note);
              const leftPosition = getBlackKeyPosition(note);
              if (leftPosition === null) return null;
              return (
                  <TouchableOpacity
                      key={note}
                      disabled={!isVisible}
                      style={[ 
                        styles.blackKey, 
                        { width: dynamicStyles.blackKeyWidth, height: dynamicStyles.blackKeyHeight, left: leftPosition }, 
                        activeNotes[note] && styles.blackKeyPressed, 
                        !isVisible && styles.keyDisabled 
                      ]}
                      onPressIn={() => handlers.handleNotePressIn(note)}
                      onPressOut={() => handlers.handleNotePressOut(note)}
                      activeOpacity={1}
                  >
                      {/* 흑건 하단에 음계 텍스트 표시 */}
                      <Text style={[styles.blackKeyTextLabel, !isVisible && styles.keyLabelDisabled]}>{note}</Text>
                      {showKeyLabels && noteToKeyMap[note] && (
                        <Text style={[styles.blackKeyLabel, !isVisible && styles.keyLabelDisabled]}>{noteToKeyMap[note]}</Text>
                      )}
                  </TouchableOpacity>
              );
          })}
      </View>
  );
};

export default function Music() {
  const KEYBOARD_ENABLED = false;

  const [activeNotes, setActiveNotes] = useState<{ [key in Note]?: boolean }>({});  // 활성 키 상태
  const [isTraining, setIsTraining] = useState(false); // 훈련 여부
  const [currentNote, setCurrentNote] = useState<Note | null>(null);  // 현재 문제 음계
  const [score, setScore] = useState(0);  // 점수
  const [feedback, setFeedback] = useState('');  // 피드백
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);  // 정답 애니메이션 표시 여부
  const [difficulty, setDifficulty] = useState<Difficulty>('3단계');  // 난이도
  const [progress, setProgress] = useState<MusicProgress>({});  // 진행 상태
  const [overlayVisible, setOverlayVisible] = useState(true);  // 오버레이 표시 여부
  const rotation = useSharedValue(0);  // 회전 애니메이션 값

  // 옥타브 시프트 뷰포트 관련 상태 (기본 14번째 백건 = C3 시작)
  const VIEWPORT_SIZE = 14; // 화면에 한 번에 노출될 백건 개수 (2옥타브 분량)
  const [viewportStartIdx, setViewportStartIdx] = useState(14); 

  // 새 문제 출제 시 화면 바깥에 있으면 자동으로 뷰포트 옥타브 시프트
  useAutoFocusViewport({
    currentNote,
    viewportStartIdx,
    setViewportStartIdx,
    totalWhite: allNotes.filter(n => !isBlackKeyMap[n]).length,
    viewportSize: VIEWPORT_SIZE,
  });

  const { height, width } = useWindowDimensions();  // 화면 크기

  useEffect(() => { 
    if (!overlayVisible) return;
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(90, { duration: 800 }),
      -1,
      false
    );
  }, [overlayVisible]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const soundCache = useRef<{ [key in Note]?: any }>({});
  const recentlyUsedNotes = useRef<Note[]>([]);
  
  const starContext = useContext(StarContext) as any;
  const clearContext = useContext(ClearContext) as any;

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await AsyncStorage.getItem(MUSIC_PROGRESS_KEY);
        if (savedProgress) {
          setProgress(JSON.parse(savedProgress));
        }
      } catch (e) {
        console.error("Failed to load music progress.", e);
      }
    };
    loadProgress();
  }, []);

  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      AsyncStorage.setItem(MUSIC_PROGRESS_KEY, JSON.stringify(progress))
        .catch(e => console.error("Failed to save music progress.", e));
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

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      setOverlayVisible(true);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      return;
    }
    const t = setTimeout(async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setOverlayVisible(false);
    }, 250);
    return () => clearTimeout(t);
  }, [isFocused]);

  useEffect(() => {
    return () => {
      for (const player of Object.values(soundCache.current)) {
        player?.release();
      }
    };
  }, []);

  const playSound = async (note: Note) => {
    try {
      let player = soundCache.current[note];
      if (!player) {
        if (recentlyUsedNotes.current.length >= CACHE_LIMIT) {
          const lruNote = recentlyUsedNotes.current.pop();
          if (lruNote && soundCache.current[lruNote]) {
            soundCache.current[lruNote].release();
            delete soundCache.current[lruNote];
          }
        }
        player = createAudioPlayer(soundFiles[note]);
        soundCache.current[note] = player;
      }
      recentlyUsedNotes.current = recentlyUsedNotes.current.filter(n => n !== note);
      recentlyUsedNotes.current.unshift(note);
      
      await player.seekTo(0);
      player.play();
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

  const handleNotePressIn = useCallback((note: Note) => {
    playSound(note);
    setActiveNotes(prev => ({ ...prev, [note]: true }));

    if (isTraining && currentNote) {
      if (note === currentNote) {
        const newScore = score + 1;
        setScore(newScore);

        const currentProgress = progress[difficulty] || { cumulativeSuccesses: 0, highestScore: 0 };
        const newCumulativeSuccesses = currentProgress.cumulativeSuccesses + 1;
        
        const updatedProgress = {
          ...progress,
          [difficulty]: {
            cumulativeSuccesses: newCumulativeSuccesses,
            highestScore: Math.max(currentProgress.highestScore, newScore),
          }
        };
        setProgress(updatedProgress);
        
        if (newCumulativeSuccesses >= 3) {
            starContext?.addStar(`music_${difficulty}`);
        }
        if (newScore >= 5) {
            clearContext?.markAsCleared(`music_${difficulty}`);
        }

        // 정답 시 1초 동안 Rive 애니메이션을 표시하고, 이후 다음 문제로 진행
        setShowSuccessAnim(true);
        setFeedback('정답!');
        setTimeout(() => {
          setShowSuccessAnim(false);
          setFeedback('다음 문제');
          playNextQuestion();
        }, 1000);
      } else {
        setScore(prev => prev > 0 ? prev - 1 : 0);
        setFeedback('오답! 다시 들어보세요.');
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

  // 옥타브 시프트 이동 버튼 제어
  const handleShiftLeft = () => {
    // 백건 기준 7개(1옥타브)씩 왼쪽으로 이동
    setViewportStartIdx(prev => Math.max(0, prev - 7));
  };

  const handleShiftRight = () => {
    // 전체 백건 개수 30개 중 뷰포트 크기 14개를 뺀 최대값은 16
    setViewportStartIdx(prev => Math.min(16, prev + 7));
  };

  // 현재 화면에 노출되고 있는 음역대의 라벨 계산
  const getViewportRangeLabel = () => {
    const whiteKeys = allNotes.filter(note => !isBlackKeyMap[note]);
    const startNote = whiteKeys[viewportStartIdx];
    const endNote = whiteKeys[viewportStartIdx + VIEWPORT_SIZE - 1];
    return `${startNote} ~ ${endNote}`;
  };

  // 52개 음 전체를 하나의 연속된 건반으로 그리되 뷰포트에서 보여줄 영역 슬라이싱
  const pianoNotes = allNotes;
  
  const CONTROL_PANEL_WIDTH = 240;
  const PIANO_AREA_PADDING = 20;
  const pianoAreaWidth = width - CONTROL_PANEL_WIDTH - PIANO_AREA_PADDING;

  const dynamicWhiteKeyWidth = pianoAreaWidth / VIEWPORT_SIZE;
  const dynamicStyles = {
    whiteKeyWidth: dynamicWhiteKeyWidth,
    blackKeyWidth: dynamicWhiteKeyWidth * 0.6,
    whiteKeyHeight: height - 100, // 슬라이더 공간 확보를 위해 약간 조절
    blackKeyHeight: (height - 100) * 0.65,
  };

  const handlers = { handleNotePressIn, handleNotePressOut };
  
  const progressItems = difficultyLevels.map(level => {
    const levelProgress = progress[level.name] || { cumulativeSuccesses: 0, highestScore: 0 };
    const starStatus = starContext?.starData[`music_${level.name}`] ? '★' : '☆';
    const clearStatus = clearContext?.clearData[`music_${level.name}`] ? '✓' : '✗';
    return {
      label: `${level.label} (${starStatus}, ${clearStatus})`,
      value: `누적 ${levelProgress.cumulativeSuccesses}회 / 최고 ${levelProgress.highestScore}점`
    };
  });

  if (overlayVisible) {
    return (
      <View style={styles.rotationOverlay}>
        <View style={styles.rotationContent}>
          <Animated.View style={rotationStyle}>
            <Ionicons name="phone-portrait-outline" size={100} color="rgba(255,255,255,0.9)" style={styles.rotationIcon} />
          </Animated.View>
        </View>
        <Text style={styles.rotationHintText}>가로 전환 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreen}>
      <View style={{ position: 'absolute', top: -20, left: 100, zIndex: 100 }}>
        <MissionProgressIcon
          currentStep={score}
          totalSteps={5}
        />
      </View>
      <View style={styles.trainingContainer}>
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

      <View style={styles.pianoArea}>
        {/* 옥타브 시프트 슬라이딩 네비게이션 */}
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

        <View style={styles.pianoContainer}>
          <View style={styles.pianoWrapper}>
            {renderPianoViewportRow(
              pianoNotes, 
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

      {/* Rive 정답 애니메이션 오버레이 (Expo Go 에러 방지를 위해 임시 주석 처리) */}
      {/* {showSuccessAnim && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: 999,
              elevation: 999,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
          pointerEvents="none"
        >
          <Rive
            resourceName="confetti"
            stateMachineName="State Machine 1"
            autoplay={true}
            style={{ width: 300, height: 300 }}
          />
        </View>
      )} */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rotationOverlay: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotationContent: {
    alignItems: 'center',
  },
  rotationIcon: {
    marginBottom: 0,
  },
  rotationHintText: {
    fontSize: 26,
    color: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    bottom: 80,
  },
  fullScreen: { 
    flex: 1, 
    backgroundColor: '#333',
    flexDirection: 'row',
  },
  trainingContainer: { 
    width: 240,
    height: '100%',
    paddingVertical: 20, 
    paddingHorizontal: 10, 
    backgroundColor: '#222', 
    alignItems: 'center', 
    justifyContent: 'space-around',
    borderRightWidth: 2, 
    borderRightColor: '#444',
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
    backgroundColor: '#292929',
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
    fontSize: 16 
  },
  whiteKey: { 
    borderWidth: 1, 
    borderColor: '#000', 
    backgroundColor: 'white', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    paddingBottom: 15, 
  },
  blackKey: { 
    position: 'absolute', 
    backgroundColor: 'black', 
    borderRadius: 4, 
    zIndex: 1, 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    paddingBottom: 12,
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
    fontWeight: '600' 
  },
  blackKeyLabel: { 
    fontSize: 10, 
    color: '#888', 
    fontWeight: '600' 
  },
  difficultyButtonActive: { 
    backgroundColor: '#007BFF', 
    shadowColor: '#007BFF', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 5, 
    elevation: 5 
  },
  whiteKeyPressed: { 
    backgroundColor: '#e0e0e0' 
  },
  blackKeyPressed: { 
    backgroundColor: '#333333' 
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
  hiddenInput: { 
    position: 'absolute', 
    width: 1, 
    height: 1, 
    opacity: 0 
  },
});