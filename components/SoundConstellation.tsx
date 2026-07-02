/**
 * SoundConstellation.tsx
 * ------------------------------------------------------------------
 * 7번: 소리 별자리(Sound Constellation) — 통합 이펙트(드롭인)
 * 정답 → 별 생성 / 연속 정답 → 별들을 발광선으로 연결 / 오답 → 흩어짐 물리 후 초기화
 */

import { useCallback, useEffect } from 'react';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
  withRepeat,
  withTiming,
  runOnUI,
} from 'react-native-reanimated';
import { Path, Blur, Skia } from '@shopify/react-native-skia';

interface Star {
  x: number;
  y: number;
  bornAt: number;    // ms
  vx: number;        // px/s (흩어짐용)
  vy: number;
  scattering: boolean;
  scatterAt: number; // ms
}

export interface ConstellationConfig {
  maxStars?: number;
  baseRadius?: number;
  fadeInMs?: number;   // 별 등장 그로우인
  growMs?: number;     // 별자리 마지막 선분 자라나는 시간
  scatterMs?: number;  // 흩어짐 소멸 시간
  gravity?: number;    // px/s^2
  scatterSpeed?: number; // px/s
  twinkleMs?: number;
}

export interface Constellation {
  addStar: (x: number, y: number) => void;
  onWrong: () => void;
  starPath: ReturnType<typeof useSharedValue<any>>;
  linePath: ReturnType<typeof useSharedValue<any>>;
  starOpacity: ReturnType<typeof useDerivedValue<number>>;
}

export function useConstellation(cfg: ConstellationConfig = {}): Constellation {
  const MAX = cfg.maxStars ?? 15;
  const BASE_R = cfg.baseRadius ?? 3.5;
  const FADE_IN = cfg.fadeInMs ?? 220;
  const GROW = cfg.growMs ?? 320;
  const SCATTER = cfg.scatterMs ?? 700;
  const GRAVITY = cfg.gravity ?? 900;
  const SPEED = cfg.scatterSpeed ?? 260;
  const TWINKLE_MS = cfg.twinkleMs ?? 900;

  const stars = useSharedValue<Star[]>([]);
  const nowSV = useSharedValue(0);
  const prevT = useSharedValue(0);
  const starPath = useSharedValue(Skia.Path.Make());
  const linePath = useSharedValue(Skia.Path.Make());

  const twinkle = useSharedValue(0);
  useEffect(() => {
    twinkle.value = withRepeat(withTiming(1, { duration: TWINKLE_MS }), -1, true);
  }, [twinkle, TWINKLE_MS]);
  const starOpacity = useDerivedValue(() => 0.7 + 0.3 * twinkle.value);

  // 정답: 별 하나 추가 (좌표는 화면 절대좌표)
  const addStar = useCallback(
    (x: number, y: number) => {
      runOnUI((px: number, py: number) => {
        'worklet';
        const now = nowSV.value;
        const arr = stars.value;
        const base = arr.length >= MAX ? arr.slice(1) : arr; // 꽉 차면 오래된 것 제거
        stars.value = [
          ...base,
          { x: px, y: py, bornAt: now, vx: 0, vy: 0, scattering: false, scatterAt: 0 },
        ];
      })(x, y);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 오답: 전체 별을 바깥 방향 속도로 흩뿌리고 초기화
  const onWrong = useCallback(() => {
    runOnUI(() => {
      'worklet';
      const now = nowSV.value;
      stars.value = stars.value.map((s) => ({
        ...s,
        scattering: true,
        scatterAt: now,
        vx: (Math.random() * 2 - 1) * SPEED,
        vy: -Math.random() * SPEED, // 살짝 위로 튀며
      }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 매 프레임: 물리 + 별/별자리선 Path 재구성
  useFrameCallback((frame) => {
    'worklet';
    const now = frame.timestamp;
    nowSV.value = now;
    let dt = (now - prevT.value) / 1000;
    prevT.value = now;
    if (dt > 0.05 || dt < 0) dt = 0.016; // 첫 프레임/스파이크 보정

    const arr = stars.value;
    const sp = Skia.Path.Make();
    const lp = Skia.Path.Make();
    const alive: Star[] = [];
    const linePts: { x: number; y: number; bornAt: number }[] = [];

    for (let i = 0; i < arr.length; i++) {
      const s = arr[i];
      let { x, y, vx, vy } = s;
      const age = now - s.bornAt;
      const grow = Math.min(1, age / FADE_IN);
      let r = BASE_R * (grow * (2 - grow)); // easeOut 그로우인

      if (s.scattering) {
        const sAge = now - s.scatterAt;
        if (sAge >= SCATTER) continue; // 소멸 → 제거
        x += vx * dt;
        y += vy * dt;
        vy += GRAVITY * dt;
        vx *= 0.985;
        r *= 1 - sAge / SCATTER; // 줄어들며 사라짐
      } else {
        linePts.push({ x, y, bornAt: s.bornAt }); // 살아있는 별만 별자리 연결
      }

      if (r > 0.2) sp.addCircle(x, y, r);
      alive.push({ ...s, x, y, vx, vy });
    }

    // 별자리 선: 생성 순서대로 폴리라인 + 마지막 선분 자라남
    if (linePts.length >= 2) {
      lp.moveTo(linePts[0].x, linePts[0].y);
      for (let i = 1; i < linePts.length - 1; i++) lp.lineTo(linePts[i].x, linePts[i].y);
      const a = linePts[linePts.length - 2];
      const b = linePts[linePts.length - 1];
      const g = Math.min(1, (now - b.bornAt) / GROW);
      lp.lineTo(a.x + (b.x - a.x) * g, a.y + (b.y - a.y) * g);
    }

    stars.value = alive;
    starPath.value = sp;
    linePath.value = lp;
  });

  return { addStar, onWrong, starPath, linePath, starOpacity };
}

/**
 * 기존 <Canvas> 안에 넣는 렌더 조각. (입자 Path 옆에 배치)
 * 별자리 선 → 별 순서로 그려 별이 선 위에 오게 함.
 */
export function ConstellationRender({
  starPath,
  linePath,
  starOpacity,
  starColor = '#FFE9A8', // 소프트 골드
  lineColor = '#5DE6C4', // 민트 네온
}: Pick<Constellation, 'starPath' | 'linePath' | 'starOpacity'> & {
  starColor?: string;
  lineColor?: string;
}) {
  return (
    <>
      <Path path={linePath} color={lineColor} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round">
        <Blur blur={4} />
      </Path>
      <Path path={starPath} color={starColor} style="fill" opacity={starOpacity}>
        <Blur blur={3} />
      </Path>
    </>
  );
}

/** 별을 무작위 하늘 위치에 두고 싶을 때(정점 좌표 대신). 화면 절대좌표. */
export function randomSkyPoint(bounds: { left: number; right: number; top: number; bottom: number }) {
  const { left, right, top, bottom } = bounds;
  return { x: left + Math.random() * (right - left), y: top + Math.random() * (bottom - top) };
}
