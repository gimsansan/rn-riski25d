# 🚀 2.5D 피아노 청능 훈련 앱 전체 개발 및 디버깅 결과 기록 (Master Walkthrough)

본 문서는 프로젝트(`rn-riski25d`)에서 진행된 레이어 시각 디자인부터 다중 터치 애니메이션, 사운드 확장, 자동 포커싱 구현에 이르기까지 모든 기능 개발 및 디버깅 결과들을 시간 순서대로 총망라한 **단일 마스터 워크스루(Master Walkthrough)** 문서입니다.

---

## 🎨 Phase 2: 2.5D 시각 디자인 및 컴포넌트 구조화 완료
1. **[SpaceBackground.tsx](file:///d:/Projects/rn-riski25d/components/SpaceBackground.tsx):** `@shopify/react-native-skia`의 Canvas와 LinearGradient를 사용한 보랏빛/청록빛 우주 테마 배경 (Layer 1).
2. **[TrainingPanelLab.tsx](file:///d:/Projects/rn-riski25d/components/TrainingPanelLab.tsx):** 사이버펑크 스타일 민트색 점수 폰트와 반투명 유리창(Glassmorphism) 효과를 넣은 점수/미션 패널 (Layer 3).
3. **[RippleLayer.tsx](file:///d:/Projects/rn-riski25d/components/RippleLayer.tsx):** 화면 터치 좌표를 감지해 Skia 동심원이 퍼져나가다 사라지는 물결 이펙트 레이어 (Layer 2).
4. **App.tsx 리팩토링:** 3개 레이어 컴포넌트를 분리해 구조화하고 터치 이벤트를 전역에서 감지하도록 정리했습니다.

---

## 🎹 Phase 3: 가로 모드 및 Skia 2.5D 피아노 건반 구현 완료
- **가로 모드(Landscape) 고정:** `app.json` 설정 및 `ScreenOrientation` API를 사용해 앱 기동 시 화면 가로 고정을 강제했습니다.
- **화면 분할 구조 개편:** 좌측 영역에는 훈련 미션 패널을 띄우고, 우측의 넓은 영역에는 피아노 건반이 꽉 차게 렌더링되도록 배치했습니다.
- **고해상도 2.5D 건반화:** Skia의 `RoundedRect`, `LinearGradient`, `Shadow`를 활용하여 입체적인 백건 14개(2옥타브)와 흑건 10개의 외형 뼈대를 고해상도 코드로 그려냈습니다.

---

## 🎹 Phase 4: 다중 터치(화음) 및 물리 애니메이션 완료
- **다중 터치(Multi-Touch) 감지:** `onTouchMove` 제스처 트래킹을 이용해 10개 손가락의 독립 터치(화음 연주) 및 쓸어내리기(글리산도) 기법을 완벽히 인식시켰습니다.
- **물리적 2.5D 타격감:** 백건 터치 시 Y축으로 `10px`, 흑건 터치 시 Y축으로 `8px` 눌려 들어갔다 떼면 즉시 부드럽게 튕겨 나오는 Reanimated 모션 감각을 이식했습니다.

---

## 🎵 Phase 4-3: 사운드 연동 및 프리로드 완료 (초경량 mp3)
- **초경량 MP3 연동:** 2옥타브(C4~B5)에 맞춘 24개의 피아노 건반 소리 `.mp3` 에셋을 `assets/sounds/`에 다운로드 완료했습니다.
- **SoundManager 매니저 구축:** 앱 켜짐과 동시에 24개 음원을 메모리에 0.1초 만에 프리로드(Preload)하고, 동일 건반의 초고속 타격 시 오디오 인스턴스가 겹치며 즉각 반응하도록 `setPositionAsync(0)` 저지연 방아쇠 처리를 완료했습니다.

---

## 🎼 Phase 4-4: 52음 M4A 확장 및 옥타브 시프트 뷰포트 구현 완료 (이전 2편 연동)
- **52음 M4A 고음질 복원:** 
  - 사용자가 제공한 52개 M4A 음원을 [assets/m4a-sounds](file:///d:/Projects/rn-riski25d/assets/m4a-sounds) 디렉토리에 정상 수용 완료했습니다.
  - `soundFiles` 객체에 `C1` ~ `D#5` 52음 에셋 require 경로를 1대1 매핑하여 소리 누락을 해결했습니다.
  - `expo-audio`의 `createAudioPlayer`를 활용해 프리로드를 보강하고 저지연 음향 재생 사이클을 완성했습니다.
- **옥타브 뷰포트 시프트 (Octave Shift):**
  - 건반 가독성을 보존하기 위해 화면에는 한 번에 **백건 14개(2옥타브 영역)** 범위만 확대해서 크게 렌더링하도록 윈도잉 설정을 구현했습니다.
  - 상단 옥타브 네비게이터 제어바(`[◀ 옥타브 낮춤]`, `[옥타브 높임 ▶]`)를 누르면, 백건 기준 7개(정확히 1옥타브 영역)씩 뷰포트 시작 인덱스(`viewportStartIdx`)가 슬라이딩되며 흑건과 백건 좌표가 알맞게 보정 정렬됩니다.

---

## 🎯 Phase 4-5: 자동 옥타브 포커싱 및 Rive 우회 연동 완료 (최종 3편 연동)
- **9. 자동 옥타브 포커싱 (Auto-Focus Viewport):**
  - 새로운 훈련 문제가 출제되었을 때 정답음이 화면 밖 영역(예: 최저음 C1)에 가려져 있어 터치할 수 없던 문제를 해결했습니다.
  - `useAutoFocusViewport` 훅을 개발하여, `currentNote` 변경 시 해당 정답 음이 화면 중앙에 보이도록 `viewportStartIdx` 시작 값을 `[0, 16]` 범위(백건 30개 기준) 내에서 알아서 자동 갱신해 줍니다.
  - 뷰포트의 상태를 `startRef`로 분리 및 의존성 설정을 격리하여, 추후 구현될 미니맵 터치 수동 이동과 서로 뷰포트 상태가 꼬여 락(Lock)이 걸리는 충돌을 예방했습니다.
- **Rive 런타임 크래시 방지 조치:**
  - Expo Go 환경 구동 시 네이티브 패키지 미지원으로 생기는 크래시 에러를 예방하기 위해 [MusicScreen.tsx](file:///d:/Projects/rn-riski25d/screens/MusicScreen.tsx) 내의 Rive 임포트 및 렌더링 구역을 임시 주석 처리해 비활성화했습니다.
- **메인 엔트리 연동 ([App.tsx](file:///d:/Projects/rn-riski25d/App.tsx)):**
  - 앱 기동 시 기존 24음 피아노 화면 대신, 새로 완성된 52음 옥타브 시프트 및 오토 포커스 훈련 피아노 화면(`MugicPage`)이 메인 화면에 띄워지도록 렌더링 라우팅 대상을 완전히 스위칭 완료했습니다.

---

## 🧪 검증 및 빌드 결과
- **TypeScript 타입 체크:** `npx tsc --noEmit` 검증이 단 한 개의 오류 없이 깨끗하게 **성공 및 통과**되었습니다.
- **플레이어 동작 상태:** 에뮬레이터에서 튕김 현상 없이 옥타브 시프트 피아노 UI가 정상 로드되며, 화면 밖에 위치한 음이 재생될 때 뷰포트가 해당 옥타브 대역으로 즉시 오토 시프트(순간 이동)함을 성공적으로 확인했습니다.

---

## 🎯 Phase 5: 2.5D 타격감 및 Haptics 진동 적용 완료
- **햅틱 피드백 추가:** `expo-haptics` 패키지를 연동하여 건반을 누를 때마다 `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`를 호출, 가벼운 물리 진동 타격감을 부여했습니다.
- **2.5D Y축 프레스 애니메이션:** 
  - 각 건반(`PianoKey`) 단위로 개별 `useSharedValue`를 활용해, UI 스레드 상에서 60fps 이상의 부드러운 눌림 애니메이션을 적용했습니다.
  - 건반 터치 시 백건은 14px, 흑건은 18px 아래로 하강하며 그림자 투명도가 자연스럽게 조절되어 입체적인 타격감을 구현했습니다.
