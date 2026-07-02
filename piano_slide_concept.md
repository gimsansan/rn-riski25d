# 🎹 React Native Pressable vs Skia Canvas 터치 매핑 분석 (글리산도 구현 원리)

본 문서는 기존 일반 컴포넌트 방식(`Pressable` 기반)과 이번 데모에 적용된 `Skia Canvas` 기반 좌표 매핑 방식의 터치 메커니즘 차이 및 글리산도(슬라이드 연주) 구현 원리를 분석합니다.

---

## 📊 터치 메커니즘 비교 요약

| 구분 | Pressable 기반 건반 (기존 `MusicScreen`) | Skia Canvas 기반 건반 (데모 `AppContent`) |
| :--- | :--- | :--- |
| **터치 감지 주체** | 개별 건반 컴포넌트 (`AnimatedPressable`) | 건반 영역 전체를 감싸는 단일 부모 뷰 (`View`) |
| **슬라이드 (글리산도)**| **불가능** (최초 터치 지점의 건반만 작동) | **가능** (손가락이 지나가는 좌표를 실시간 추적) |
| **이벤트 처리 방식** | React Native의 `onPressIn` / `onPressOut` | 부모 뷰의 `onTouchStart` / `onTouchMove` / `onTouchEnd` |
| **렌더링 스레드** | React Native Bridge 및 JS 스레드 | Reanimated SharedValue 기반 **UI 스레드 바이패스** |
| **프레임 레이트** | 건반 상태 변경에 따른 전체 재렌더링 유발 가능 | 재렌더링 없이 GPU 가속을 통해 직접 드로잉 (60fps+) |

---

## 1. 개별 Pressable 방식의 한계 (글리산도 불가능 원인)

일반 React Native의 `Pressable` 이나 `TouchableOpacity` 컴포넌트는 개별적으로 터치 이벤트를 캡처합니다.

* **최초 터치 지점 고정**: 사용자가 하나의 건반을 터치(`PressIn`)한 채로 손가락을 옆 건반으로 밀어도, 터치 이벤트는 **최초로 터치가 시작되었던 건반 컴포넌트가 계속 점유**하고 있습니다.
* **이벤트 전파 차단**: 손가락이 다른 건반의 영역으로 진입하더라도, 그 건반의 `onPressIn` 이벤트는 발생하지 않습니다.
* **사용자 경험**: 글리산도를 하려면 손가락을 건반 하나를 칠 때마다 뗐다가 다시 대야 하는 부자연스러운 연주만 가능합니다.

---

## 2. Skia Canvas 좌표 매핑 방식의 원리 (글리산도 실시간 동작)

데모(`components/PianoKeyboard.tsx`)에 적용된 방식은 개별 건반 컴포넌트가 이벤트를 받지 않고, **건반 영역 전체를 덮고 있는 하나의 단일 부모 View**에서 제스처를 감지합니다.

```tsx
// 부모 View에서 모든 터치 이벤트를 수집
<View 
  style={StyleSheet.absoluteFill}
  onTouchStart={handleTouch}
  onTouchMove={handleTouch} // 움직일 때마다 좌표 추적
  onTouchEnd={handleTouchEnd}
>
  <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
     {/* Skia로 건반 드로잉 */}
  </Canvas>
</View>
```

### 🛠️ 동작 메커니즘
1. **고속 좌표 추적**: 손가락을 쓸어내릴 때 `onTouchMove` 이벤트가 발생하며, 손가락의 X, Y 좌표(`locationX`, `locationY`)를 부모 View가 수집합니다.
2. **수학적 건반 판별 (`getKeyIndexFromPosition`)**: 
   * 입력된 X 좌표를 백건 너비(`whiteKeyWidth`)로 나누어 현재 터치된 백건의 인덱스를 계산합니다.
   * Y 좌표가 흑건 영역 내에 있다면 흑건의 좌표 범위와 대조하여 흑건 인덱스를 판별합니다.
3. **상태 즉시 업데이트**: 판별된 인덱스의 `SharedValue`를 `1`로 업데이트하고, 범위를 벗어난 건반은 `0`으로 돌립니다.
4. **UI 스레드 바이패스 드로잉**: Reanimated의 `useDerivedValue`로 연결된 Skia `RoundedRect`가 리렌더링 없이 GPU 가속을 통해 즉시 하강 효과(Y축 offset)와 그림자 옅어짐을 그려냅니다.

---

## 💡 결론 및 시사점

* **글리산도(슬라이드 연주)**는 개별 컴포넌트 배치 방식에서는 모바일 네이티브 제스처 캡처 한계로 인해 구현하기가 극히 어렵습니다.
* 반드시 **단일 부모 제스처 감지 레이어 + 좌표-건반 매핑 연산 + UI 스레드 드로잉** 구조를 채택해야만 모바일 환경에서 딜레이 없이 리얼한 연주 경험을 전달할 수 있습니다.
