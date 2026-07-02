/**
 * useAutoFocusViewport.jsx
 * ------------------------------------------------------------------
 * 자동 옥타브 포커싱 (Auto-Focus Viewport)
 * 2.5D 청능 피아노 앱 · React Native (Expo SDK 57)
 *
 * 동작: 새 문제(currentNote)가 바뀌면, 그 음이 현재 14개 백건 뷰포트
 *       안에 있는지 검사하고, 밖이라면 그 음이 화면 중앙에 오도록
 *       viewportStartIdx(= slice 시작값)를 계산해 갱신한다.
 *
 * ─ 확정된 실제 코드 사실(A1~A4) ─
 *  A1. currentNote = 'C4' / 'C#4' 형태의 "문자열".
 *  A2. viewportStartIdx = 백건 배열 인덱스(백건 30개, 뷰포트 14개 → 0~16).
 *  A3. 렌더링 = whites.slice(start, start+size)로 14개만 그림.
 *      → translateX 슬라이드가 아니라 slice 시작값을 target으로 즉시 갱신.
 *  A4. whiteKeyWidth = pianoAreaWidth / VIEWPORT_SIZE (렌더 폭 상수).
 *      → 포커싱 로직 자체는 픽셀값이 필요 없어 이 훅에서는 쓰지 않음.
 *
 *  ※ 현재 방식은 "즉시 점프"다. 원래 기획(지시6)의 "부드러운 슬라이딩"이
 *    필요하면 렌더 구조를 translateX 트랙 기반으로 리팩토링해야 한다(별건).
 * ------------------------------------------------------------------
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

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

  return { notes, whites, whiteIdxRefById };
}

/* ══════════════════════════════════════════════════════════════
 * SECTION 2 · 포커싱 계산 (순수 함수)
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

/** currentNote를 canonical id로 변환 (A1: 실제로는 'C4' 같은 문자열) */
function resolveNoteId(currentNote) {
  if (typeof currentNote === 'string') return currentNote;      // 'C4', 'C#4'
  if (currentNote?.name != null && currentNote?.octave != null) {
    return `${currentNote.name}${currentNote.octave}`;          // 객체 대비 fallback
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════
 * SECTION 3 · 훅  (slice 시작값만 갱신)
 * ════════════════════════════════════════════════════════════ */

export function useAutoFocusViewport({
  currentNote,          // 현재 출제된 음 문자열 (A1)
  viewportStartIdx,     // 현재 slice 시작 백건 인덱스 (state, A2)
  setViewportStartIdx,  // 위 state setter
  keyboard,             // buildKeyboard() 결과
  viewportSize = 14,
}) {
  const totalWhite = keyboard.whites.length; // 30
  // 논리적 현재 시작값. 자동 포커싱을 currentNote 변경에만 반응시키고,
  // 미니맵 등 "수동 이동"과 충돌하지 않도록 최신 start를 ref로 읽는다.
  const startRef = useRef(viewportStartIdx);

  // 어떤 경로로든 viewportStartIdx가 바뀌면 ref를 최신으로 유지
  useEffect(() => {
    startRef.current = viewportStartIdx;
  }, [viewportStartIdx]);

  // 새 문제가 나올 때만 포커싱 (수동 이동 시엔 재실행되지 않음)
  useEffect(() => {
    const id = resolveNoteId(currentNote);
    if (id == null) return;
    const noteWhiteIdx = keyboard.whiteIdxRefById.get(id);
    if (noteWhiteIdx == null) return; // 범위 밖 음 → 무시

    const base = startRef.current;
    const target = computeFocusStart(noteWhiteIdx, base, viewportSize, totalWhite);
    if (target === base) return; // 이미 보임 → 이동 없음

    startRef.current = target;      // 즉시 논리 위치 갱신(연속 출제 대비)
    setViewportStartIdx(target);    // slice 시작값 갱신 → 리렌더로 새 14개 노출
    // currentNote만 의존
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNote]);
}

/* ══════════════════════════════════════════════════════════════
 * SECTION 4 · 사용 예시 (실제 코드와 동일한 slice 방식)
 *   건반 렌더러는 자리표시자 View임. 실제로는 Skia 건반으로 교체.
 * ════════════════════════════════════════════════════════════ */

const VIEWPORT_KEYS = 14;

export function KeyboardScreen({ currentNote }) {
  const keyboard = useMemo(() => buildKeyboard(), []); // C1 ~ D#5
  const [viewportStartIdx, setViewportStartIdx] = useState(0);

  // 새 문제가 화면 밖이면 viewportStartIdx를 자동으로 맞춰줌
  useAutoFocusViewport({
    currentNote,
    viewportStartIdx,
    setViewportStartIdx,
    keyboard,
    viewportSize: VIEWPORT_KEYS,
  });

  // A3: 실제 코드와 동일한 slice 윈도잉
  const visibleWhiteKeys = keyboard.whites.slice(
    viewportStartIdx,
    viewportStartIdx + VIEWPORT_KEYS,
  );

  return (
    <View style={{ flexDirection: 'row' }}>
      {/* ↓↓↓ 자리표시자. 실제로는 여기에 Skia 건반 렌더러 */}
      {visibleWhiteKeys.map((w) => (
        <View
          key={w.id}
          style={{
            flex: 1,
            height: 180,
            borderRightWidth: 1,
            borderColor: '#222',
            backgroundColor: '#fafafa',
          }}
        />
      ))}
    </View>
  );
}
