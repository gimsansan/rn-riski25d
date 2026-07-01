# 🚀 고성능 2.5D 청능 훈련 앱 전체 구현 계획 (Master Plan)

이 문서는 본 프로젝트(`rn-riski25d`)에서 진행된 모든 설계 원칙과 단계별 구현 계획을 총망라한 마스터 플랜입니다. 향후 유지보수 및 다음 단계 개발 시 지침서로 활용됩니다.

---

## Phase 1: 2.5D 기반 아키텍처 환경 구축 (Rive + Skia)
무거운 3D(R3F) 프레임워크를 배제하고, 안드로이드 모바일 기기의 GPU 성능을 100% 활용할 수 있는 가볍고 화려한 2.5D 앱을 설계하는 단계입니다.

### 핵심 기술 스택
- **React Native Skia:** 2D GPU 셰이더, 화려한 빛(Glow)/파티클 효과, 벡터 도형(건반 등) 렌더링
- **React Native Reanimated:** 제스처 연동, 2.5D 시차(Parallax) 애니메이션, 즉각적인 햅틱 시각 효과
- **Rive (도입 예정):** 벡터 기반의 부드러운 상태머신(State Machine) 애니메이션 (캐릭터/복잡한 악기 액션)

### 3단 레이어(Layer) 아키텍처 원칙
1. **[Layer 1 - Background]:** `SpaceBackground` (Skia 기반 캔버스)
2. **[Layer 2 - Midground]:** 인터랙션 영역 (Skia 물결 이펙트, 피아노 건반, 추후 Rive 오브젝트)
3. **[Layer 3 - Foreground]:** UI 영역 (`TrainingPanelLab` 점수 패널 등)
*=> 기기의 자이로 센서를 이용해 세 레이어가 서로 다른 속도로 움직이는 2.5D Parallax 효과 적용*

---

## Phase 2: 시각 디자인 및 컴포넌트 구조화 (완료)
`App.tsx` 하나에 몰려있던 코드를 각 기능별로 예쁘게 분리하고 완성도 높은 시각 요소를 추가한 단계입니다.

- **`components/SpaceBackground.tsx`:** 우주 테마의 어두운 보랏빛/청록빛 LinearGradient 배경 구현.
- **`components/TrainingPanelLab.tsx`:** 사이버펑크 틱한 민트색 포인트 폰트와 반투명 유리창(Glassmorphism) 효과를 넣은 점수/미션 패널.
- **`components/RippleLayer.tsx`:** 화면 터치 시 좌표를 받아 Skia의 동심원이 퍼지며 사라지는 이펙트.

---

## Phase 3: 가로 모드 및 Skia 2.5D 피아노 건반 도입 (완료)
피아노 연주 UX에 맞게 앱을 가로 모드로 강제하고, Rive에 의존하기 전 Skia만으로 고해상도 건반을 만들어낸 단계입니다.

### 1. 화면 분할 레이아웃
- **가로 모드 고정:** `app.json` 및 `App.tsx`에서 Landscape로 강제 전환.
- **Flex Row 배치:** 좌측에는 `TrainingPanelLab` 패널을 띄워두고, 우측의 남는 거대한 공간을 피아노 건반이 채우도록 재편.

### 2. `components/PianoKeyboard.tsx` 시각화
- 2옥타브 분량의 백건(14개)과 흑건(10개)을 Skia의 `RoundedRect`로 수학적 계산을 통해 렌더링.
- 입체감을 부여하기 위해 건반마다 하단부 `Shadow` 및 미세한 `LinearGradient` 적용.

---

## Phase 4: 다중 터치(화음) 및 물리 애니메이션 (Next Step)
앞으로 진행될 차기 작업 계획입니다.

1. **제스처 라이브러리 도입:** 
   - `react-native-gesture-handler`를 설치하여 여러 손가락으로 동시에 건반을 짚거나(화음), 훑어내리는(글리산도) 조작을 완벽하게 지원.
2. **건반 눌림(Press) 애니메이션:** 
   - 터치한 건반 인덱스를 감지하여 Reanimated SharedValue를 변경.
   - 눌린 건반이 Z축으로 살짝 들어가거나 밝게 빛나는(Glow) 효과 추가.
3. **사운드 연동:**
   - 눌린 건반의 음계(Pitch)에 맞는 사운드 파일 재생. 
4. **최종 Rive 통합:**
   - 시각 효과가 마무리되면 실제 네이티브 빌드(`npx expo run:android`)를 진행하여 캐릭터 등의 Rive 애니메이션을 Midground에 안착시킴.
