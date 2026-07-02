/**
 * useAutoFocusViewport.jsx
 * ------------------------------------------------------------------
 * 자동 옥타브 포커싱 (Auto-Focus Viewport)
 * 2.5D 청능 피아노 앱 · React Native (Expo SDK 57) · Reanimated
 *
 * 동작: 새 문제(currentNote)가 바뀌면, 그 음이 현재 14개 백건 뷰포트
 *       안에 있는지 검사하고, 밖이라면 그 음이 화면 중앙에 오도록
 *       viewportStartIdx를 계산해 부드럽게 슬라이드 이동시킨다.
 *
 * ─ 통합 시 확인해야 할 가정(Assumption) ─
 *  A1. currentNote 형태: "C#4" 문자열 / {name:'C#',octave:4} 객체 /
 *      0~51 인덱스 중 무엇이든 허용(resolveNoteId 참고).
 *  A2. viewportStartIdx = "백건 배열 인덱스"(백건 30개, 뷰포트 14개 → 0~16).
 *      전체 52음 인덱스 기준이라면 매핑을 바꿔야 함.  ← 아직 미확인
 *  A3. 건반 렌더링 = "전체 트랙을 그려두고 translateX로 밀어 14개만
 *      보이는" 구조로 가정. 14개만 slice해서 그린다면 translateX 대신
 *      slice 시작값에 target을 적용.  ← 아직 미확인
 *  A4. whiteKeyWidth(백건 1개 폭, px)를 상수로 주입. 보통 screenWidth/14.
 * ------------------------------------------------------------------
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

/* ══════════════════════════════════════════════════════════════
 * SECTION 1 · 건반 모델 (self-contained, 외부 파일 의존 없음)
 * ════════════════════════════════════════════════════════════ */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

const pitchClass = (name) => NOTE_NAMES.indexOf(name);
const toSemitone = (name, octave) => octave * 12 + pitchClass(name);

/**
 * C1 ~ D#5(기본) 범위의 건반 모델을 만든다. (52음 / 백건 30개)
 * @returns {{
 *   notes: Array<{id,name,octave,isBlack,semitone}>,   // 52개
 *   whites: Array<{id,name,octave}>,                    // 30개
 *   whiteIdxRefById: Map<string, number>,               // 음 → 포커싱용 백건 인덱스
 *   idByIndex: (n:number)=>string|null,                 // 0~51 인덱스 → id
 * }}
 */
export function buildKeyboard(
  start = { name: 'C', octave: 1 },
  end = { name: 'D#', octave: 5 },
) {
  const s = toSemitone(start.name, start.octave);
  const e = toSemitone(end.name, end.octave);

  const notes = [];
  const whites = [];
  const whiteIdxRefById = new Map();
  let whiteCount = 0;
  let lastWhiteIdx = 0;

  for (let semi = s; semi <= e; semi++) {
    const name = NOTE_NAMES[semi % 12];
    const octave = Math.floor(semi / 12);
    const isBlack = BLACK.has(name);
    const id = `${name}${octave}`;
    notes.push({ id, name, octave, isBlack, semitone: semi });

    if (isBlack) {
      // 흑건은 바로 왼쪽 백건을 기준으로 포커싱 (C1이 백건이라 항상 성립)
      whiteIdxRefById.set(id, lastWhiteIdx);
    } else {
      whiteIdxRefById.set(id, whiteCount);
      whites.push({ id, name, octave });
      lastWhiteIdx = whiteCount;
      whiteCount += 1;
    }
  }

  return {
    notes,
    whites,
    whiteIdxRefById,
    idByIndex: (n) => notes[n]?.id ?? null,
  };
}

/* ══════════════════════════════════════════════════════════════
 * SECTION 2 · 포커싱 계산 (순수 함수 · 애니메이션과 무관)
 * ════════════════════════════════════════════════════════════ */

/**
 * 목표 viewportStartIdx를 계산한다.
 *  - 이미 보이면 currentStart를 그대로 반환(= 이동 없음)
 *  - 밖이면 그 음이 중앙에 오도록 정렬 후 [0, total-size]로 clamp
 */
export function computeFocusStart(noteWhiteIdx, currentStart, viewportSize, totalWhite) {
  const end = currentStart + viewportSize - 1;
  if (noteWhiteIdx >= currentStart && noteWhiteIdx <= end) {
    return currentStart; // 이미 뷰포트 안 → 이동 없음
  }
  const maxStart = Math.max(0, totalWhite - viewportSize);
  const centered = noteWhiteIdx - Math.floor(viewportSize / 2);
  return Math.max(0, Math.min(centered, maxStart)); // 중앙 정렬 + 경계 clamp
}

/** currentNote(문자열/객체/인덱스)를 canonical id("C#4")로 변환 (A1) */
function resolveNoteId(currentNote, keyboard) {
  if (currentNote == null) return null;
  if (typeof currentNote === 'number') return keyboard.idByIndex(currentNote);
  if (typeof currentNote === 'string') return currentNote; // "C#4" 형태 가정
  if (currentNote.name != null && currentNote.octave != null) {
    return `${currentNote.name}${currentNote.octave}`;
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════
 * SECTION 3 · 훅
 * ════════════════════════════════════════════════════════════ */

export function useAutoFocusViewport({
  currentNote,            // 현재 출제된 음 (A1)
  viewportStartIdx,       // 현재 뷰포트 시작 백건 인덱스 (state, A2)
  setViewportStartIdx,    // 위 state setter
  whiteKeyWidth,          // 백건 1개 폭 px (A4)
  keyboard,               // buildKeyboard() 결과
  viewportSize = 14,
  duration = 450,
}) {
  const totalWhite = keyboard.whites.length; // 30
  // translateX: 트랙을 왼쪽으로 밀어 현재 뷰포트를 보여줌 (A3)
  const translateX = useSharedValue(-viewportStartIdx * whiteKeyWidth);
  // 논리적 현재 시작값(빠른 연속 문제에서도 정확히 계산하기 위한 ref)
  const startRef = useRef(viewportStartIdx);

  // (1) 새 문제가 나올 때마다 포커싱
  useEffect(() => {
    const id = resolveNoteId(currentNote, keyboard);
    if (id == null) return;
    const noteWhiteIdx = keyboard.whiteIdxRefById.get(id);
    if (noteWhiteIdx == null) return;

    const base = startRef.current;
    const target = computeFocusStart(noteWhiteIdx, base, viewportSize, totalWhite);
    if (target === base) return; // 이미 보임 → 이동 없음

    startRef.current = target; // 즉시 논리 위치 갱신(연속 출제 대비)
    translateX.value = withTiming(
      -target * whiteKeyWidth,
      { duration, easing: Easing.out(Easing.cubic) },
      (finished) => {
        'worklet';
        if (finished) runOnJS(setViewportStartIdx)(target); // 미니맵 등 외부 동기화
      },
    );
    // currentNote만 의존: 문제가 바뀔 때만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNote]);

  // (2) 외부(미니맵 #10 등)에서 viewportStartIdx를 직접 바꾼 경우 동기화
  useEffect(() => {
    if (viewportStartIdx === startRef.current) return; // 자기 자신이 낸 변경 → 무시
    startRef.current = viewportStartIdx;
    translateX.value = withTiming(-viewportStartIdx * whiteKeyWidth, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportStartIdx]);

  // 트랙에 붙일 애니메이션 스타일
  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { translateX, trackStyle };
}

/* ══════════════════════════════════════════════════════════════
 * SECTION 4 · 사용 예시
 *   건반 렌더러는 "자리표시자 View"임. 실제로는 당신의 Skia 건반으로 교체.
 *   (이 예시만으로도 슬라이드 동작은 바로 확인 가능)
 * ════════════════════════════════════════════════════════════ */

const VIEWPORT_KEYS = 14;

export function KeyboardScreen({ currentNote }) {
  const { width } = Dimensions.get('window');
  const whiteKeyWidth = width / VIEWPORT_KEYS;          // A4
  const keyboard = useMemo(() => buildKeyboard(), []);  // C1 ~ D#5

  const [viewportStartIdx, setViewportStartIdx] = useState(0);

  const { trackStyle } = useAutoFocusViewport({
    currentNote,
    viewportStartIdx,
    setViewportStartIdx,
    whiteKeyWidth,
    keyboard,
    viewportSize: VIEWPORT_KEYS,
  });

  const trackWidth = keyboard.whites.length * whiteKeyWidth; // 30 * w

  return (
    // 뷰포트: 14개만 보이도록 overflow hidden
    <View style={{ width, overflow: 'hidden' }}>
      <Animated.View
        style={[{ width: trackWidth, flexDirection: 'row' }, trackStyle]}
      >
        {/*
          ↓↓↓ 여기를 당신의 Skia 건반 렌더러로 교체하세요.
          지금은 백건 30개 자리표시자만 그림. 흑건은 Skia에서 겹쳐 그리면 됨.
        */}
        {keyboard.whites.map((w) => (
          <View
            key={w.id}
            style={{
              width: whiteKeyWidth,
              height: 180,
              borderRightWidth: 1,
              borderColor: '#222',
              backgroundColor: '#fafafa',
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}
