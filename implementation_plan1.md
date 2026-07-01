# 🎹 PianoKeyboard Reanimated Optimization Plan

## Goal Description
현재 `PianoKeyboard.tsx`는 건반이 눌릴 때마다 React의 `useState`를 통해 `Set`을 통째로 갈아끼우며 전체 화면을 다시 렌더링(Re-render)하고 있습니다. 이 방식은 단일 터치에서는 문제가 없으나, 여러 손가락으로 피아노를 훑는(Glissando) 조작 시 안드로이드 기기에서 극심한 프레임 드랍을 유발할 수 있습니다.

이를 해결하기 위해, 애니메이션 상태를 React 렌더링 트리에서 완전히 분리하여 **60FPS를 보장하는 `react-native-reanimated`의 SharedValue와 `react-native-skia`의 자체 바인딩 시스템**으로 교체하는 최적화 작업을 진행합니다.

## User Review Required
> [!IMPORTANT]
> `react-native-gesture-handler`의 `PanGestureHandler`는 여러 손가락의 개별 좌표(Multi-touch)를 동시에 정밀하게 추적하는 데 한계가 있습니다. 피아노 건반처럼 10개의 손가락 좌표가 모두 필요한 경우, RN에 내장된 `onTouch` 이벤트 모델이 오히려 압도적으로 유리합니다.
> 
> 따라서 제스처 라이브러리로 전면 교체하지 않고, **RN 기본 다중 터치 이벤트(`onTouchMove`) + Reanimated `SharedValue` 업데이트 방식**을 결합하여 최상의 시너지를 내는 방향으로 구현하고자 합니다. 동의하시나요?

## Proposed Changes

### UI Components

#### [MODIFY] [components/PianoKeyboard.tsx](file:///d:/Projects/rn-riski25d/components/PianoKeyboard.tsx)
- **상태 관리 교체:** `useState<Set<number>>`를 삭제하고, `const activeKeys = useSharedValue<number[]>(new Array(24).fill(0))`로 24개 건반의 눌림 상태(0 또는 1)를 관리합니다.
- **렌더링 바이패스:** 터치 핸들러(`handleTouch`)에서 React State를 건드리지 않고, 오직 `activeKeys.value` 배열만 업데이트합니다.
- **사운드 트리거 최적화:** `useRef<Set<number>>`를 사용해 현재 사운드가 재생된 키들을 따로 추적하여 중복 사운드 재생을 막습니다.
- **Skia DerivedValue 바인딩:** Skia의 `RoundedRect` 렌더링 루프 안에 `useDerivedValue`를 선언하여, 각 건반이 `activeKeys` 배열에서 자신의 상태가 1이 될 때만 Y축 Offset과 색상이 즉시(UI Thread) 변경되도록 연결합니다.

## Verification Plan
### Manual Verification
- 에뮬레이터 또는 실제 기기에서 실행 후, 여러 손가락으로 건반을 동시에 문질러 봅니다.
- React의 리렌더링 없이 시각적 피드백(건반 튕김)이 60FPS로 극도로 부드럽게 돌아가는지, 소리 레이턴시는 없는지 확인합니다.
