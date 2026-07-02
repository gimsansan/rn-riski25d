/**
 * RippleGlissandoAura.tsx
 * ------------------------------------------------------------------
 * 3번: Ripple Glissando 궤적 + 롱프레스 오라 (이펙트 전용 오버레이)
 * RN (Expo SDK 57) · @shopify/react-native-skia · reanimated · gesture-handler
 *
 * 이 컴포넌트는 "이펙트만" 그립니다. 건반 자체는 당신의 기존 렌더러가 그대로 그리고,
 * 이 오버레이를 그 위에 절대배치(absolute)로 얹으세요.
 *
 * 폐지 API 주의: 예전 Skia useTouchHandler/onTouch는 폐지됨.
 *   → gesture-handler의 Gesture + shared value로 입력을 받고 Skia가 값을 읽어 렌더.
 *
 * ─ index.tsx 기준 확인된 명세(사용자 제공) ─
 *  · whiteKeyWidth=pianoAreaWidth/14, whiteKeyHeight=height-100
 *  · blackKeyWidth=whiteKeyWidth*0.6, blackKeyHeight=whiteKeyHeight*0.65
 *  · 흑건 x = (선행 백건 뷰포트 인덱스+1)*whiteKeyWidth - blackKeyWidth/2
 *  · 히트테스트: Y<blackKeyHeight면 흑건 X영역 먼저 판정 → 아니면 floor(X/whiteKeyWidth)
 *  · 음 재생: playSound(note) / 훈련판정 포함 handleNotePressIn(note)·handleNotePressOut(note)
 *
 * ─ 아직 미확인(Assumption, index.tsx 미열람) ─
 *  A1. Note 타입은 'C4'/'C#4' 문자열로 가정(type NoteId = string). 실제 Note 타입으로 교체 가능.
 *  A2. 이 오버레이가 "입력을 담당"하게 됨 → 기존 건반별 TouchableOpacity onPressIn/Out은
 *      제거/비활성화해야 이중 발화가 안 남. (글리산도는 개별 Touchable로는 불가)
 *  A3. 건반 y 시작점은 0(피아노 영역 상단)으로 가정.
 * ------------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Canvas, Path, Blur, Skia } from '@shopify/react-native-skia';

export type NoteId = string; // A1: 실제로는 당신의 Note 타입

export interface VisibleKey {
  note: NoteId;
  isBlack: boolean;
  x: number;      // 뷰포트 기준 left
  width: number;
  height: number; // 히트 높이 (백건=whiteKeyHeight, 흑건=blackKeyHeight)
}

interface Finger {
  pts: { x: number; y: number; t: number }[];
  note: NoteId | null;
  lastMoveT: number;
  down: boolean;
}

interface Props {
  width: number;   // = pianoAreaWidth (Canvas 폭)
  height: number;  // = whiteKeyHeight (Canvas 높이)
  keys: VisibleKey[];                    // 현재 화면에 보이는 건반들(백건14 + 겹치는 흑건), 뷰포트 기준 좌표
  onKeyEnter: (note: NoteId) => void;    // 새 건반 진입 → handleNotePressIn 권장(요청 반영)
  onKeyLeave: (note: NoteId) => void;    // 건반 이탈 → handleNotePressOut
  trailColor?: string;
  auraColor?: string;
  trailWidth?: number;
  trailMs?: number;   // 궤적 잔상 수명(ms)
  holdMs?: number;    // 롱프레스 오라 발동 임계(ms)
  maxPointsPerFinger?: number;
}

/* ── 히트테스트 (사용자 로직: 흑건 먼저, 그다음 백건) ────────── */
function hitTest(keys: VisibleKey[], x: number, y: number): NoteId | null {
  'worklet';
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k.isBlack && y <= k.height && x >= k.x && x <= k.x + k.width) return k.note;
  }
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (!k.isBlack && x >= k.x && x <= k.x + k.width && y <= k.height) return k.note;
  }
  return null;
}

function findKey(keys: VisibleKey[], note: NoteId): VisibleKey | null {
  'worklet';
  for (let i = 0; i < keys.length; i++) if (keys[i].note === note) return keys[i];
  return null;
}

const BLACK_AFTER: Record<string, string> = { C: 'C#', D: 'D#', F: 'F#', G: 'G#', A: 'A#' };
// E, B 뒤에는 흑건 없음

/**
 * 뷰포트에 보이는 건반(백건+겹치는 흑건)을 히트테스트용 배열로 만든다.
 * whites: buildKeyboard().whites (#9 파일) 또는 [{id,name,octave}, ...] 형태.
 * 이미 index.tsx가 렌더용 좌표를 가지고 있다면, 이 헬퍼 대신 그 좌표로 keys를 직접 만들어 넘겨도 됨.
 */
export function buildVisibleKeys(
  whites: { id: string; name: string; octave: number }[],
  viewportStartIdx: number,
  dims: { whiteKeyWidth: number; whiteKeyHeight: number; blackKeyWidth: number; blackKeyHeight: number },
  viewportSize = 14,
): VisibleKey[] {
  const { whiteKeyWidth, whiteKeyHeight, blackKeyWidth, blackKeyHeight } = dims;
  const visible = whites.slice(viewportStartIdx, viewportStartIdx + viewportSize);
  const keys: VisibleKey[] = [];
  visible.forEach((w, wi) => {
    keys.push({ note: w.id, isBlack: false, x: wi * whiteKeyWidth, width: whiteKeyWidth, height: whiteKeyHeight });
    const bn = BLACK_AFTER[w.name];
    if (bn) {
      keys.push({
        note: `${bn}${w.octave}`,
        isBlack: true,
        x: (wi + 1) * whiteKeyWidth - blackKeyWidth / 2, // 사용자 제공 공식
        width: blackKeyWidth,
        height: blackKeyHeight,
      });
    }
  });
  return keys;
}

export function RippleGlissandoAura({
  width,
  height,
  keys,
  onKeyEnter,
  onKeyLeave,
  trailColor = '#4EE6C8',   // 민트 네온
  auraColor = '#A78BFA',    // 바이올렛
  trailWidth = 6,
  trailMs = 450,
  holdMs = 350,
  maxPointsPerFinger = 48,
}: Props) {
  // 최신 keys / 콜백을 워클릿에서 안전하게 쓰기 위한 브리지
  const keysSV = useSharedValue<VisibleKey[]>(keys);
  useEffect(() => { keysSV.value = keys; }, [keys, keysSV]);

  const cbRef = useRef({ onKeyEnter, onKeyLeave });
  useEffect(() => { cbRef.current = { onKeyEnter, onKeyLeave }; });
  const emitEnter = useCallback((n: NoteId) => cbRef.current.onKeyEnter(n), []);
  const emitLeave = useCallback((n: NoteId) => cbRef.current.onKeyLeave(n), []);

  const fingers = useSharedValue<Record<number, Finger>>({});
  const nowSV = useSharedValue(0);
  const trailPath = useSharedValue(Skia.Path.Make());
  const auraPath = useSharedValue(Skia.Path.Make());

  // 오라 호흡(breathing)
  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [breathe]);
  const auraOpacity = useDerivedValue(() => 0.3 + 0.35 * breathe.value);

  // 튜닝값(생성 시 캡처 — 런타임 변경은 반영 안 됨)
  const MOVE_THRESHOLD = 4;

  // 매 프레임: 궤적/오라 Path 재구성 + 오래된 점 제거 (UI 스레드)
  useFrameCallback((frame) => {
    'worklet';
    const now = frame.timestamp;
    nowSV.value = now;

    const tp = Skia.Path.Make();
    const ap = Skia.Path.Make();
    const store = fingers.value;

    for (const idStr of Object.keys(store)) {
      const id = Number(idStr);
      const f = store[id];

      // 잔상 수명 지난 점 제거 → 꼬리가 서서히 짧아지며 페이드
      while (f.pts.length && now - f.pts[0].t > trailMs) f.pts.shift();
      // 손 뗐고 꼬리도 사라졌으면 정리
      if (!f.down && f.pts.length === 0) { delete store[id]; continue; }

      if (f.pts.length > 1) {
        tp.moveTo(f.pts[0].x, f.pts[0].y);
        for (let i = 1; i < f.pts.length; i++) tp.lineTo(f.pts[i].x, f.pts[i].y);
      }

      // 오라: 손가락이 눌린 채 임계시간 이상 "정지"해 있을 때
      if (f.down && f.note && now - f.lastMoveT > holdMs) {
        const k = findKey(keysSV.value, f.note);
        if (k) {
          const pad = 4;
          ap.addRRect(
            Skia.RRectXY(Skia.XYWHRect(k.x - pad, -pad, k.width + pad * 2, k.height + pad * 2), 8, 8),
          );
        }
      }
    }
    trailPath.value = tp;
    auraPath.value = ap;
  });

  // 멀티터치 입력 (화음/여러 손가락 동시 글리산도)
  const gesture = useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown((e, m) => {
          'worklet';
          for (const t of e.changedTouches) {
            const note = hitTest(keysSV.value, t.x, t.y);
            fingers.value[t.id] = {
              pts: [{ x: t.x, y: t.y, t: nowSV.value }],
              note,
              lastMoveT: nowSV.value,
              down: true,
            };
            if (note) runOnJS(emitEnter)(note);
          }
          m.activate(); // Manual 제스처를 활성 유지 → 이후 move 수신
        })
        .onTouchesMove((e) => {
          'worklet';
          for (const t of e.changedTouches) {
            const f = fingers.value[t.id];
            if (!f) continue;
            const last = f.pts[f.pts.length - 1];
            const moved = Math.abs(t.x - last.x) + Math.abs(t.y - last.y);
            f.pts.push({ x: t.x, y: t.y, t: nowSV.value });
            if (f.pts.length > maxPointsPerFinger) f.pts.shift();
            if (moved > MOVE_THRESHOLD) f.lastMoveT = nowSV.value; // 움직이면 오라 리셋

            const note = hitTest(keysSV.value, t.x, t.y);
            if (note !== f.note) {
              // 건반 경계를 넘는 순간에만 훈련판정 트리거
              if (f.note) runOnJS(emitLeave)(f.note);
              if (note) runOnJS(emitEnter)(note);
              f.note = note;
            }
          }
        })
        .onTouchesUp((e, m) => {
          'worklet';
          for (const t of e.changedTouches) {
            const f = fingers.value[t.id];
            if (!f) continue;
            if (f.note) runOnJS(emitLeave)(f.note);
            f.down = false; // 점은 남겨 꼬리가 페이드아웃되게, 프레임콜백이 정리
          }
          if (e.numberOfTouches === 0) m.end();
        })
        .onTouchesCancelled((e, m) => {
          'worklet';
          for (const t of e.changedTouches) {
            const f = fingers.value[t.id];
            if (f?.note) runOnJS(emitLeave)(f.note);
            if (f) f.down = false;
          }
          if (e.numberOfTouches === 0) m.end();
        }),
    // shared value/stable 콜백만 참조 → 재생성 불필요
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={[StyleSheet.absoluteFill, { width, height }]}>
        {/* 오라(뒤) — 채운 라운드렉트 + 블러 = 발광, 호흡 opacity */}
        <Path path={auraPath} color={auraColor} opacity={auraOpacity} style="fill">
          <Blur blur={14} />
        </Path>
        {/* 궤적(앞) — 스트로크 + 블러 = 네온 잔상 */}
        <Path
          path={trailPath}
          color={trailColor}
          style="stroke"
          strokeWidth={trailWidth}
          strokeCap="round"
          strokeJoin="round"
        >
          <Blur blur={6} />
        </Path>
      </Canvas>
    </GestureDetector>
  );
}

/* ── index.tsx 연동 예시 ─────────────────────────────────────
import { RippleGlissandoAura, buildVisibleKeys } from './RippleGlissandoAura';
// keyboard = buildKeyboard()  (#9 파일의 whites/notes 모델)

const dims = { whiteKeyWidth, whiteKeyHeight, blackKeyWidth, blackKeyHeight };
const overlayKeys = buildVisibleKeys(keyboard.whites, viewportStartIdx, dims);

<RippleGlissandoAura
  width={pianoAreaWidth}
  height={whiteKeyHeight}
  keys={overlayKeys}
  onKeyEnter={handleNotePressIn}   // 훈련판정 경로(요청하신 대로)
  onKeyLeave={handleNotePressOut}
/>
// 주의: 이 오버레이가 입력을 담당하므로, 기존 건반별 TouchableOpacity onPressIn/Out은 제거/비활성화.
──────────────────────────────────────────────────────────── */
