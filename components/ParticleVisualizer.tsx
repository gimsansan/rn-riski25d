import React, { useImperativeHandle, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Path, Blur } from '@shopify/react-native-skia';
import Animated, {
  SharedValue,
  useSharedValue,
  useFrameCallback,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Skia } from '@shopify/react-native-skia';
import { useConstellation, ConstellationRender } from './SoundConstellation';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  isMint: boolean; // 색상 유형 (민트색 혹은 보라색)
}

interface ParticleVisualizerProps {
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  triggerTime: SharedValue<number>;
}

export interface ParticleVisualizerRef {
  addStar: (x: number, y: number) => void;
  onWrong: () => void;
}

export const ParticleVisualizer = forwardRef<ParticleVisualizerRef, ParticleVisualizerProps>(({
  touchX,
  touchY,
  triggerTime,
}, ref) => {
  // UI 스레드에서 독점 관리할 실시간 파티클 배열
  const particles = useSharedValue<Particle[]>([]);

  // Skia Path Shared Values (React 리렌더링 없이 GPU 드로잉 갱신)
  const mintStrongPath = useSharedValue(Skia.Path.Make());
  const mintWeakPath = useSharedValue(Skia.Path.Make());
  const violetStrongPath = useSharedValue(Skia.Path.Make());
  const violetWeakPath = useSharedValue(Skia.Path.Make());

  // 소리 별자리 훅 결합
  const constellation = useConstellation({ maxStars: 15 });

  // 부모(App.tsx)가 ref.current.addStar() 등으로 직접 호출할 수 있게 노출 (명시적 캡슐화)
  useImperativeHandle(ref, () => ({
    addStar: (x: number, y: number) => constellation.addStar(x, y),
    onWrong: () => constellation.onWrong(),
  }));

  // 1. 터치 감지 시 파티클 무리 생성 (Emitter)
  useAnimatedReaction(
    () => triggerTime.value,
    (nowTime, prevTime) => {
      if (nowTime === 0 || nowTime === prevTime) return;

      const emitterX = touchX.value;
      const emitterY = touchY.value;
      const newParticles: Particle[] = [];
      const particleCount = 20; // 1회 터치당 방출 입자 수

      for (let i = 0; i < particleCount; i++) {
        // Y축 솟구침을 중심으로 좌우 30도 범위 무작위 분사
        const angle = Math.PI * (0.35 + Math.random() * 0.3); // 약 63도 ~ 117도
        const speed = Math.random() * 5 + 3.5; // 상승 속력
        const vx = Math.cos(angle) * speed;
        const vy = -Math.sin(angle) * speed - 1.8; // 수직 상승력 부여

        const size = Math.random() * 3.8 + 2.2; // 입자 반경 (2.2px ~ 6.0px)
        const isMint = Math.random() > 0.45; // 55% 민트, 45% 보라색 배합

        newParticles.push({
          x: emitterX,
          y: emitterY,
          vx,
          vy,
          size,
          alpha: 1.0,
          isMint,
        });
      }

      const current = particles.value;
      const combined = [...current, ...newParticles];

      // 저사양 안드로이드 기기 과부하 방지를 위해 활성 입자 최대 개수를 120개로 고정 제한
      if (combined.length > 120) {
        particles.value = combined.slice(combined.length - 120);
      } else {
        particles.value = combined;
      }
    }
  );

  // 2. 물리 갱신 및 Path 빌드 루프 (매 프레임 60fps 구동)
  useFrameCallback(() => {
    'worklet';
    const current = particles.value;
    if (current.length === 0) {
      mintStrongPath.value = Skia.Path.Make();
      mintWeakPath.value = Skia.Path.Make();
      violetStrongPath.value = Skia.Path.Make();
      violetWeakPath.value = Skia.Path.Make();
      return;
    }

    const nextParticles: Particle[] = [];
    const gravity = 0.12; // 약한 중력 작용 (솟구쳤다가 살짝 하강 휘어짐 유도)
    const friction = 0.975; // 공기 저항 감쇠

    const mStrong = Skia.Path.Make();
    const mWeak = Skia.Path.Make();
    const vStrong = Skia.Path.Make();
    const vWeak = Skia.Path.Make();

    for (let i = 0; i < current.length; i++) {
      const p = current[i];
      const nextAlpha = p.alpha - 0.022; // 약 45프레임 동안 생존 후 완전 페이드아웃
      if (nextAlpha <= 0) continue; // GC 대상 입자 자동 탈락

      const nextVx = p.vx * friction;
      const nextVy = (p.vy + gravity) * friction;
      const nextX = p.x + nextVx;
      const nextY = p.y + nextVy;
      const nextSize = Math.max(0.5, p.size * 0.965); // 상승하면서 점차 크기도 줄어듦

      nextParticles.push({
        x: nextX,
        y: nextY,
        vx: nextVx,
        vy: nextVy,
        size: nextSize,
        alpha: nextAlpha,
        isMint: p.isMint,
      });

      // 투명도에 따라 강한 중심광(Strong)과 외부 번짐광(Weak) 패스로 결합
      if (p.isMint) {
        if (nextAlpha > 0.5) {
          mStrong.addCircle(nextX, nextY, nextSize);
        } else {
          mWeak.addCircle(nextX, nextY, nextSize);
        }
      } else {
        if (nextAlpha > 0.5) {
          vStrong.addCircle(nextX, nextY, nextSize);
        } else {
          vWeak.addCircle(nextX, nextY, nextSize);
        }
      }
    }

    particles.value = nextParticles;

    // 최종 드로잉 패스 일제 갱신
    mintStrongPath.value = mStrong;
    mintWeakPath.value = mWeak;
    violetStrongPath.value = vStrong;
    violetWeakPath.value = vWeak;
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. 민트 네온 입자 */}
      <Path path={mintStrongPath} color="rgba(0, 255, 170, 0.85)">
        <Blur blur={1.5} />
      </Path>
      <Path path={mintWeakPath} color="rgba(0, 255, 170, 0.35)">
        <Blur blur={3.2} />
      </Path>

      {/* 2. 보라 네온 입자 */}
      <Path path={violetStrongPath} color="rgba(167, 139, 250, 0.85)">
        <Blur blur={1.5} />
      </Path>
      <Path path={violetWeakPath} color="rgba(167, 139, 250, 0.35)">
        <Blur blur={3.2} />
      </Path>

      {/* 3. 소리 별자리 및 발광선 렌더 (단일 Canvas 내 병합 드로잉) */}
      <ConstellationRender
        starPath={constellation.starPath}
        linePath={constellation.linePath}
        starOpacity={constellation.starOpacity}
      />
    </Canvas>
  );
});
