# 🚀 2.5D 청능 훈련 피아노 앱 마스터 구현 계획 (Master Plan)

본 문서는 프로젝트(`rn-riski25d`)의 초반 성능 최적화 철학부터 시작하여, 52음 M4A 확장, 옥타브 뷰포트 시프트, 그리고 지능형 자동 포커싱 시스템에 이르기까지 진행된 모든 설계 원칙과 개발 이정표를 시간 순서대로 통합 정리한 단일 마스터 계획서입니다.

---

## 📐 핵심 기술 아키텍처 및 최적화 원칙 (이전 1편 연동)

1. **60FPS 보장을 위한 UI 스레드 바이패스:**
   - React Native의 `useState` 상태 변경으로 화면 전체를 리렌더링(Re-render)하는 방식은 다중 터치나 부드러운 조작 시 극심한 프레임 드랍을 유발합니다.
   - 이를 극복하기 위해 터치에 따른 Y축 이동 및 그림자 변화 등은 Reanimated의 `SharedValue`와 `useAnimatedStyle`을 활용하여 **UI 스레드에서 직접 60fps 이상의 애니메이션으로 구동**되도록 설계합니다.
2. **개별 건반 컴포넌트 최적화:**
   - 개별 건반을 `PianoKey` 컴포넌트로 모듈화하여 `React.memo`로 감싸고, 각각 독립적인 애니메이션 및 `onPressIn` / `onPressOut` 이벤트를 처리하도록 구현하여 불필요한 전체 렌더링을 방지합니다.

---

## 📅 단계별 구현 타임라인 (Chronological Phases)

### 🌌 Phase 1: 2.5D 기반 3단 레이어 구축 (완료)
안드로이드 GPU 가속을 100% 활용하는 화려한 2.5D 공간 레이어 원칙을 정의했습니다.
1. **[Layer 1 - Background]:** Skia 기반 우주 은하 배경
2. **[Layer 2 - Midground]:** 인터랙션 건반 및 터치 물결 레이어
3. **[Layer 3 - Foreground]:** 반투명 점수/미션 유리 패널

### 🎨 Phase 2: 시각 디자인 및 컴포넌트 모듈화 (완료)
- **`SpaceBackground.tsx`:** 어두운 보랏빛/청록빛 네온 우주 캔버스.
- **`TrainingPanelLab.tsx`:** 사이버펑크 민트색 강조 폰트 및 Glassmorphism 반투명 유리 카드.
- **`RippleLayer.tsx`:** 터치 좌표를 추적해 Skia로 동심원이 퍼져나가는 고속 애니메이션 레이어.

### 🎹 Phase 3: 가로 모드 및 2.5D 피아노 건반 시각화 (완료)
- 화면을 가로(Landscape)로 고정하고, 좌측 240px 공간은 유리 미션 제어반이 차지하며, 우측의 모든 잔여 영역은 2.5D 피아노 건반이 꽉 채우도록 구조화했습니다.

### 🎼 Phase 4: 52음 M4A 확장 및 옥타브 시프트/자동 포커싱 통합 (완료)
- **52음 M4A 포팅 및 저지연 재생:** `expo-audio`의 `createAudioPlayer`를 활용해 프리로드를 보강하고 지연 없는 재생 라이프사이클을 가동했습니다.
- **옥타브 뷰포트 시프트 (Octave Shift):** 화면에는 백건 14개만 큼직하게 렌더링하고, 옥타브 버튼 조작으로 1옥타브씩 화면이 슬라이딩되는 시프트 메커니즘을 완성했습니다.
- **자동 옥타브 포커싱 (Auto-Focus Viewport):** 신규 문제가 재생될 때 정답 건반이 화면 밖에 있으면 정답음이 화면 중앙 영역에 보이도록 뷰포트 시작 인덱스를 자동 갱신해 줍니다.

### 📳 Phase 5: 2.5D 타격감 및 Haptics 진동 적용 (완료)
- **햅틱(Haptic) 피드백 연동:** `expo-haptics` 라이브러리를 추가하여, 건반 터치 시 적절한 세기(Medium)의 물리적 진동 효과를 발생시켜 실제 피아노를 누르는 듯한 타격감을 제공합니다.
- **2.5D Y축 프레스 애니메이션:** `useSharedValue`를 활용하여 개별 건반 UI 스레드 상에서 백건 14px, 흑건 18px이 하강하는 눌림 모션과 그림자 투명도 조절을 60fps로 구현 완료했습니다.

### 🛡️ Phase 5.5: 사운드 로딩 안전 가드 및 라이프사이클 락 방지 (완료)
- **초기화 대기 로딩 인디케이터:** `SoundManager.init()`이 완전히 완료되어 사운드 플레이어들이 준비될 때까지 사용자 조작을 방지하는 `isReady` 로딩 상태 가드를 적용했습니다.
- **안전한 라이프사이클 언로드:** 빠른 마운트/언마운트 시 발생할 수 있는 교착 상태와 누수를 막기 위해, `SoundManager.unloadAll()`에서 각 사운드 플레이어 릴리즈(`release()`) 시 예외 처리를 감싸고 참조 배열을 확실히 비우도록 개선했습니다.
- **사운드 반응 레이턴시 최적화:** 연음 연주 시 터치 반응이 늦어지던 문제를 해결하기 위해 `playSound` 내부의 `seekTo(0)` 호출 시 걸려있던 비동기 대기(`await`)를 제거하여 오디오 스레드 블로킹을 해소했습니다.
- **다중 채널 재생 (Polyphony) 구현:** 동일한 음을 빠르게 연속 연타할 때 이전 소리가 뚝 끊겨 튀는 현상을 해결하기 위해, 재생 중인 상태에서는 임시 오디오 플레이어를 동적 생성하여 소리가 자연스럽게 겹치게 하고 3초 뒤에 자동 리소스 해제(release)하는 안전 장치를 적용했습니다.
- **건반 비주얼 비율 현실화 및 상단 여백 확보:** 건반 세로 높이 공식을 `height - 100`에서 `height - 180`으로 수정하여 실제 피아노의 1:5.2 가로세로 비율에 최적 매칭되게 다듬고, 확보된 상단 밤하늘 여백 공간을 활용해 소리 별자리가 더 넉넉하게 렌더링되도록 개선했습니다.
- **데모용 UI 컴포넌트 정리:** 실제 청능 훈련 로직과 연결되지 않고 시차 데모용으로만 존재하던 `TrainingPanelLab` 패널과 자이로 센서 연동 훅(`useParallax`) 코드를 정�## 🎹 Phase 8: 난이도별 동적 뷰포트 고정 및 옥타브 이동 자동 가이드 (확정)

입문~중급 단계의 불필요한 조작 피로를 덜고, 상급/전문 단계에서만 화면 슬라이딩 방식을 정밀하게 유도하기 위해 난이도별 동적 뷰포트 시스템을 도입합니다.

### 1. 주요 구현 사양

1. **난이도별 동적 뷰포트 고정 및 옥타브 버튼 숨김:**
   * **1단계 (입문):** 백건 8개 (`C3`~`C4`) 범위 고정 ➡️ `VIEWPORT_SIZE = 8`, `viewportStartIdx = 14` 강제 고정. 옥타브 조절 버튼 숨김.
   * **2단계 (초급):** 백건 15개 (`C3`~`C5`) 범위 고정 ➡️ `VIEWPORT_SIZE = 15`, `viewportStartIdx = 14` 강제 고정. 옥타브 조절 버튼 숨김.
   * **3단계 (중급):** 백건 14개 (`C3`~`B4` 백건+흑건 24음) 범위 고정 ➡️ `VIEWPORT_SIZE = 14`, `viewportStartIdx = 14` 강제 고정. 옥타브 조절 버튼 숨김.
   * **4~5단계 (상급/전문):** 52음 전체 영역 사용 ➡️ `VIEWPORT_SIZE = 14`, `viewportStartIdx` 조작 가능(초기값 14). **옥타브 조절 버튼 표시.**
2. **동적 옥타브 이동 화살표 가이드 (4단계 상급에 한정):**
   * 4단계(상급)에서 출제된 정답 음(`currentNote`)이 화면 밖에 있을 때만 작동합니다.
   * **동작:** 
     - 정답 음이 왼쪽 바깥에 있으면 왼쪽 화살표 버튼에 **소프트 펄스(Opacity Glow)** + **방향 넛지(Nudge X축 이동)** 작동.
     - 정답 음이 오른쪽 바깥에 있으면 오른쪽 화살표 버튼에 애니메이션 작동.
     - 정답 음이 화면 영역 내로 복귀하면 가이드 애니메이션 즉시 정지.
3. **건반 활성화/비활성화 시각 구분 강화:**
   * 현재 선택된 난이도의 유효 음계 목록에 속하지 않는 무반응 건반은 `opacity: 0.25` 및 어두운 색상(`backgroundColor: '#666'`)으로 톤다운(Dimmed) 처리합니다.
   * 유효 건반들만 선명한 색상을 유지합니다.

---

## Proposed Changes

### [MODIFY] [App.tsx](file:///d:/Projects/rn-riski25d/App.tsx)
- `VIEWPORT_SIZE`를 `difficulty`에 따라 동적으로 설정 (`1단계: 8, 2단계: 15, 그 외: 14`).
- `viewportStartIdx` 대신 `isFixedViewport` 여부에 따라 `currentStartIdx`를 고정값 `14`로 적용.
- `1~3단계`에서 `octaveController` 렌더링을 완전히 제거(숨김).
- `4단계`에서 정답이 화면 바깥에 있을 경우 화살표 가이드 애니메이션(펄스 & 넛지) 작동.
- 비활성 건반 스타일에 대해 `opacity: 0.25` 강제 적용으로 시각적 대비 극대화.current = [];`)로 강제 초기화하여 오동작을 원천 봉쇄했습니다.
- **중복 및 유휴 파일 제거:** `PianoKeyboard.tsx`, `SoundManager.ts`, `MusicScreen.tsx` 외에 사용하지 않게 된 `SpaceBackground.tsx` (우주 배경) 파일 및 관련 코드를 삭제하여 소스코드를 한층 더 가볍게 유지했습니다.

---

## 🔮 Phase 7: 네온 입자 및 소리 별자리 (Sound Constellation) 연동 (완료)

건반 타격 시 네온 입자가 상승하는 효과와 함께, 연속 정답 콤보 시 상단 밤하늘 공간에 소리 별자리가 한 점씩 수놓아지며 발광 선으로 연결되는 이펙트 오버레이를 단일 Canvas 및 GPU 렌더링 파이프라인으로 통합 연동했습니다. 다양한 기기 비례에서도 옥타브 컨트롤러 뒤에 가려지지 않도록 버튼바와 건반 사이의 안전 구역(y = 75px 부근)으로 사인파(Sine Wave) 별자리 궤도를 조율했으며, 오답 시 별들이 중력을 받아 흩어지는 물리 루프가 작동합니다.

## User Review Required
> [!IMPORTANT]
> - **롤백 및 모드 스위치 제공**: `App.tsx` 내에 `VISUALIZER_MODE: 'ripple' | 'particle'` 옵션을 제공하여, 마음에 들지 않으면 코드 한 줄 수정으로 기존 원형 물결 이펙트로 즉시 안전하게 되돌릴 수 있게 합니다.
> - **고성능 Ref 캡슐화**: Shared Value들을 다수 전송하는 Props Drilling을 없애고, React `ref`와 `useImperativeHandle`을 통해 부모 컴포넌트(`App.tsx`)가 `addStar(x,y)`, `onWrong()` 메서드만 직접 격리 호출하도록 설계하여 컴포넌트 간 결합도를 최소화했습니다.
> - **단일 Canvas 및 GPU 가속 통합**: 별도의 Canvas나 루프를 중복 생성하지 않고, 기존 `ParticleVisualizer` 내 단일 Canvas에 `<ConstellationRender>` 레이어를 결합하여 안드로이드 디바이스의 GPU 최적화 효율을 최고조로 당겼습니다.

## Proposed Changes

---

### 🎨 비주얼라이저 컴포넌트

#### [NEW] [ParticleVisualizer.tsx](file:///d:/2605_month/rn-riski_v2/components/ParticleVisualizer.tsx)
- Skia `Canvas`와 Reanimated `useFrameCallback`을 이용한 입자 생성기(Particle Emitter) 구현.
- 각 터치 입력이 발생할 때마다 20~25개의 개별 입자들을 생성하고, 매 프레임 물리 연산(위로 솟구치게 하는 Y축 음수 속도, 무작위 X축 확산 속도, 감쇠 마찰력, 투명도 페이드아웃)을 적용하여 은하수 효과 연출.

#### [MODIFY] [App.tsx](file:///d:/2605_month/rn-riski_v2/App.tsx)
- `VISUALIZER_MODE` 상수를 선언하여 모드 분기 처리.
- 건반 터치 이벤트 발생 시(`handleNotePressIn`), 터치 좌표 정보를 `ParticleVisualizer`로 연동하여 입자 방출 트리거.
- 스위치 설정에 따라 `RippleLayer` 혹은 `ParticleVisualizer`가 선택적으로 렌더링되도록 결합.
- `SHOW_ANSWER_HINT` 변수를 추가하여, 테스트 모드 활성화 시 좌측 제어반에 출제된 정답 음계를 임시 출력하도록 렌더링 결합.

## 🎹 Phase 8: 지능형 옥타브 안내 가이드 및 건반 시각 구분 강화 (계획)

입문~중급 단계의 원활한 학습을 돕고, 무반응 건반에 의한 혼동을 해결하기 위해 안내 가이드 및 건반 시각 분리 시스템을 도입합니다.

### 1. 주요 구현 사양

1. **불필요한 범위 텍스트 제거:**
   - `App.tsx` 내의 옥타브 제어 패널 중앙에 위치한 비직관적 텍스트 `"현재 범위: C3 - G5"`(`octaveIndicator`)를 완전히 제거하여 화면을 깔끔하게 유지합니다.
2. **동적 옥타브 이동 화살표 가이드 (1단계 입문, 2단계 초급, 3단계 중급에 한정):**
   - **적용 조건:** 훈련 진행 중(`isTraining === true`)이며, 출제된 정답 음(`currentNote`)이 존재할 때 작동합니다.
   - **판단 로직:** 
     - 정답 음의 백건 인덱스가 현재 화면 왼쪽 바깥(`idx < viewportStartIdx`)에 있는 경우 ➡️ 왼쪽 옥타브 버튼 애니메이션 기동.
     - 정답 음의 백건 인덱스가 현재 화면 오른쪽 바깥(`idx >= viewportStartIdx + VIEWPORT_SIZE`)에 있는 경우 ➡️ 오른쪽 옥타브 버튼 애니메이션 기동.
     - 정답 음이 화면 영역 내부로 들어오면 애니메이션을 즉시 중지하고 정상 상태로 복귀시킵니다.
   - **애니메이션 디테일:** 
     - **소프트 펄스(Pulsing Glow):** Reanimated를 사용해 버튼의 테두리/빛(네온 느낌) 불투명도를 `0.3`에서 `1.0` 사이로 1초 주기로 호흡하듯 변화시킵니다.
     - **방향 넛지(Directional Nudge):** 옥타브 이동 화살표 아이콘이 해당 이동 방향(왼쪽/오른쪽)으로 미세하게 튕기는 모션(X축 `5px` 흔들림)을 펄스와 함께 반복 적용합니다.
   - **난이도별 격리:** 상급/전문(4단계, 5단계) 모드에서는 이 깜빡임 힌트 가이드 애니메이션이 작동하지 않도록 억제합니다.
3. **건반 활성화/비활성화 시각 구분 강화:**
   - 현재 선택된 난이도(`difficulty`)의 유효 음계 목록에 속하지 않는 건반(비활성/무반응 키)은 투명도를 `opacity: 0.25` 수준으로 톤다운(Dimmed) 처리하고 배경색을 어둡게 누릅니다.
   - 훈련 대상인 활성 건반들만 온전한 불투명도와 선명한 대비(흰색/검은색)를 유지하여 사용자가 연주할 수 있는 키들을 확실하게 인지하게 만듭니다.

---

## Proposed Changes

### [MODIFY] [App.tsx](file:///d:/Projects/rn-riski25d/App.tsx)
- `octaveIndicator` 제거 및 옥타브 버튼 영역 스타일링 정리.
- `difficulty`에 따른 활성 건반 식별 변수 `activeLevelNotes` 계산 및 `PianoKey`에 `isActive` 여부 전달하도록 수정.
- Reanimated를 이용한 옥타브 이동 버튼 바운스/펄스 애니메이션 로직 추가.
- `PianoKey` 컴포넌트 내부에서 `isActive` 상태에 따른 회색조 톤다운(Dimmed) 스타일 적용.

## 🎹 Phase 10: 제어반 하단(가로) 이동 및 16건반 확장

부모 앱 이식성에 대비하고 터치 감도와 시인성을 극대화하기 위해 기존의 좌측 세로 제어반을 하단 가로 레이아웃으로 변경하고, 3단계(중급) 및 4단계(상급)에서 한 화면에 표시되는 백건 개수를 16개로 확장합니다.

### 1. 주요 구현 사양

1. **제어반 하단 수평 배치:**
   - 기존의 좌측 세로형 `trainingContainer`(폭 240px)를 화면 하단 가로형 컨테이너(높이 약 115px)로 전면 재구성합니다.
   - 정보 영역(점수/피드백), 난이도 선택 버튼, 훈련 제어 버튼을 좌-중-우 3열 수평 배치하여 손가락 동선과 시선을 최적화합니다.
2. **건반 폭 최대 확장 및 16건반 적용:**
   - 좌측 제어반이 사라짐에 따라 확보된 가로 전체 너비를 건반 영역이 활용하도록 수정합니다.
   - 3단계 및 4단계의 화면당 건반 개수(`VIEWPORT_SIZE`)를 기존 14개에서 **16개**로 늘려 건반 터치 크기를 유지하면서 한 번에 더 많은 음계를 보여줍니다.
3. **옥타브 이동 1회 클릭 단순화:**
   - 건반 수가 16개로 확장됨에 따라 전체 백건(30개) 범위가 `0`과 `14` 두 개의 페이지 시작 인덱스로 완벽하게 커버됩니다.
   - 옥타브 이동 버튼 클릭 시 `0` ↔ `14`로 토글식 전환되도록 단순화하여 탐색 속도를 대폭 개선합니다.

---

## Proposed Changes

### [MODIFY] [App.tsx](file:///d:/Projects/rn-riski25d/App.tsx)
- `getViewportSize`에서 3단계/4단계에 대해 `16` 반환하도록 변경.
- `handleShiftLeft`, `handleShiftRight`를 `0` 및 `14` 페이지 토글 로직으로 수정.
- `CONTROL_PANEL_WIDTH` 관련 가로 계산식 제거 및 하단 제어반 높이를 기준으로 세로 비율 조정.
- `styles` 내 `trainingContainer` 및 관련 서브 컨테이너들의 가로형 배치 스타일 정의.
- `MiniKeyboardMap` 컴포넌트 호출 시 현재 뷰포트 크기(`viewportSize`) 속성을 Props로 동적 연동.
- 불필요한 `난이도 선택` 라벨 텍스트 및 관련 스타일(`sectionLabel`)을 제거하여 세로 여백 공간 확보.
- `showMissionSuccess` 상태를 신설하여 5점(미션 성공) 달성 시 화면 중앙 피아노 건반 영역에 반투명 터치 차단 오버레이 안내창 렌더링.

#### [MODIFY] [MiniKeyboardMap.tsx](file:///d:/Projects/rn-riski25d/components/MiniKeyboardMap.tsx)
- `viewportSize` Props 규격을 추가하고 하이라이트 박스의 가로폭을 하드코딩 `14`가 아닌 `viewportSize` 크기로 자동 계산 연동.
- 16건반 스냅 영역에 맞춰 미니맵 터치 시 좌측 영역은 `0`, 우측 영역은 `14`로 스냅 지점이 토글 동작하도록 터치 감지 범위 보정.

---

## Verification Plan

### Automated Tests
- 없음 (UI 이펙트 전용 컴포넌트)

### Manual Verification
- 안드로이드 기기에서 건반을 타격할 때 입자들이 60fps에 준하는 속도로 매끄럽게 솟구쳤다가 흩어지는지 시각적 유효성 확인.
- 멀티 터치(화음 연주) 시 여러 곳에서 입자가 끊김 없이 동시에 잘 뿜어져 나오는지 확인.
- `VISUALIZER_MODE`를 `'ripple'`로 전환했을 때 기존 물결 모드로 정상 롤백되는지 정합성 확인.

## 이식성 구조 설계

- **이식성(Portability)을 고려한 동적 높이 렌더링 공식 최적화:**
  - 추후 메인 앱(부모 앱)에 모듈로 이식될 때 부모의 '하단 탭 바'가 차지하는 높이만큼 모듈 전체의 가용 `height`가 줄어들게 됩니다.
  - 이를 대비해 피아노 건반 높이를 `whiteKeyHeight: height - BOTTOM_PANEL_HEIGHT(115) - 90` 공식으로 계산하도록 구현했습니다.
  - 이 수학적 비율 계산 덕분에 부모 탭 바 높이가 차감되더라도 상단 옥타브 컨트롤러 영역이나 하단 훈련 제어반 레이아웃이 침범당하지 않으며, 피아노 건반 부분만 `flex: 1` 기반으로 비율에 맞게 안전하게 축소되어 깨짐 없는 완벽한 이식을 보장합니다.
## 🎵 Phase 11: 낙하노트 엔진 (Falling Note Track) 격리 구현

청능(청각) 개선 및 치료 목적을 위한 다감각(시각+청각+운동) 훈련의 핵심 기능인 "낙하노트(Falling Note)" 엔진을 구현합니다.
인계문(`청능앱_낙하노트_인계.md`)의 실무 권장 지침("골격 먼저, 레이어 나중")에 따라, 기존 복잡한 `App.tsx`에 바로 병합하지 않고 **별도의 독립 컴포넌트로 완전히 격리하여 우선 구현 및 검증**합니다.

### 1. 설계 확정 사항 (고급 모델 피드백 반영)

1. **테스트 화면 격리 방식 (Early-Return DEV Flag):**
   - `App.tsx` 내에 상태를 섞는 토글 버튼 대신, 파일 최상단에 `const ENABLE_FALLING_NOTE_TEST = true;` 데브 플래그를 두고 early-return 방식으로 화면 전체를 데모로 스왑합니다. 이를 통해 기존 훈련 상태 및 오디오와 전혀 얽히지 않는 순수 격리 검증을 달성합니다.
2. **관심사 분리 및 오디오 스케줄링 (Event Emission):**
   - 트랙 컴포넌트 안에서 직접 소리를 내지 않습니다.
   - 단순한 `onNoteHit`(판정선 닿았을 때 방출)를 넘어, **"귀 먼저(Sound First)"** 모드를 위해 부모가 `beat - audioOffset` 시점에 미리 소리를 스케줄할 수 있도록 **예정 시각(Scheduled Time)을 알려주는 방식**의 이벤트를 설계합니다.
3. **시계(Clock) 동기화:**
   - 시각-청각 드리프트(어긋남)를 막기 위해 `currentTime`은 Reanimated의 `useFrameCallback`이 제공하는 `frame.timestamp`와 동일한 시계를 공유하여 애니메이션과 오디오 스케줄링을 일치시킵니다.

### Proposed Changes

#### [NEW] [components/FallingNoteTrack.tsx](file:///d:/Projects/rn-riski25d/components/FallingNoteTrack.tsx)
- `data/songs.ts`에서 전달받은 `Song` 데이터를 Props로 수신.
- `useFrameCallback`을 활용해 재생 시간(`currentTime`)을 정밀 추적 (bpm 72 기준).
- 수수한 톤의 가로 레인(Lane), 노트 블록, 하단 판정선(Judgment Line) 렌더링.
- 노트의 `beat` 정보와 `leadBeats`를 비교하여 Y 좌표를 동적 계산.
- 판정선 도달 예정 시각을 부모에게 스케줄할 수 있는 구조로 콜백 방출.

#### [MODIFY] [App.tsx](file:///d:/Projects/rn-riski25d/App.tsx)
- 최상단에 `const ENABLE_FALLING_NOTE_TEST = false;` 플래그 추가.
- 해당 플래그가 `true`일 경우 기존 피아노 뷰 대신 `FallingNoteTrack` 컴포넌트를 즉시 렌더링 (단일 데모 화면 스왑).

### Verification Plan
- `ENABLE_FALLING_NOTE_TEST = true` 설정 후 앱 새로고침 시 데모 화면이 뜨는지 확인.
- `bpm 72` 기준으로 노트들이 상단에서 생성되어 하단 판정선까지 등속으로 일정한 타이밍에 하강하는지 확인.
- 부모 컴포넌트(`App.tsx`)가 예정된 타이밍에 맞춰 정확히 오디오 재생 호출을 스케줄링할 수 있는지 콜백 및 로그 확인.

### 🐛 Hotfix 반영
- **구문 오류 수정:** `components/FallingNoteTrack.tsx` 내 `useDerivedValue` import 위치 문제(Syntax Error)를 파일 최상단으로 이동하여 수정.
- **타입 오류 수정:** `@shopify/react-native-skia`에서 지원하지 않는 `Rect`의 `r`(둥근 모서리) 속성 에러를 해결하기 위해 `Rect`를 `RoundedRect` 컴포넌트로 교체했습니다.

## 🎵 Phase 12: 낙하노트 메인 앱 통합 및 상호작용(Audio/Touch) 구현 (계획)

낙하노트 뼈대(Phase 11) 검증이 완료됨에 따라, 이를 실제 피아노 UI와 오디오 시스템이 존재하는 `App.tsx`에 병합하고 사용자 터치 판정 로직을 연결합니다.

### 1. 주요 구현 사양

1. **메인 UI 병합 및 건반 정렬 (Visual Alignment):**
   - `ENABLE_FALLING_NOTE_TEST` 조기 반환(Early Return) 플래그를 제거하여 메인 앱 로직과 결합.
   - `FallingNoteTrack`을 피아노 건반 영역과 맞물리도록 배치.
   - 트랙의 레인 폭(`laneWidth`)과 X 좌표를 `App.tsx`의 동적 건반 폭(`dynamicWhiteKeyWidth`) 및 뷰포트 시작 인덱스와 완벽하게 일치시킴 (백건 기준으로 하강).

2. **오디오 스케줄링 및 '귀 먼저(Sound First)' 모드:**
   - `App.tsx`에서 `onNoteSchedule(note, expectedTimestamp)` 이벤트를 수신.
   - `Date.now()` 기준으로 `expectedTimestamp - audioOffset` 시점에 `setTimeout`을 통해 오디오 재생을 사전 예약.
   - `audioOffset`이 0이면 판정선 도달 시 동시 재생, 양수(예: 500ms)이면 시각적 도달보다 먼저 소리가 남.

3. **터치 판정 (Hit Detection) 로직:**
   - 사용자가 피아노 건반을 터치(`handleNotePressIn`)할 때, 현재 시각과 떨어지고 있는 노트들의 예상 도달 시각을 대조.
   - 오차 범위(예: ±300ms) 내에 일치하는 건반 터치 시 **Hit(정답)** 판정:
     - 점수 상승 및 별자리 이펙트 발동.
     - `FallingNoteTrack`에 해당 노트를 명시적으로 소멸(히트 이펙트)시키도록 신호 전달.
   - 범위를 벗어나거나 엉뚱한 건반을 누르면 **Miss(오답)** 판정 (피드백 출력).

### User Review Required
> [!IMPORTANT]
> - **'귀 먼저' 모드 오디오 재생 피드백:** '귀 먼저' 모드에서는 노트가 판정선에 닿기 전에 소리가 먼저 나옵니다. 사용자가 타이밍에 맞춰 정답 터치를 성공했을 때, **타격감을 위해 소리를 한 번 더 재생**할지, 아니면 **시각적 이펙트(별자리 등)와 물리 진동(햅틱)만** 주고 소리는 생략할지 결정이 필요합니다. (기본 제안: 터치 시 소리 한 번 더 재생하여 다감각 피드백 유지)

### Proposed Changes

#### [MODIFY] [App.tsx](file:///d:/Projects/rn-riski25d/App.tsx)
- `FallingNoteTrack` 렌더링을 배경 레이어 앞, 피아노 영역 뒤에 병합.
- 건반 너비(`dynamicWhiteKeyWidth`) 및 오프셋 좌표를 Props로 전달.
- 오디오 스케줄링 예약 및 건반 터치 시 히트 판정(Hit/Miss) 상태 관리.

#### [MODIFY] [components/FallingNoteTrack.tsx](file:///d:/Projects/rn-riski25d/components/FallingNoteTrack.tsx)
- Props로 받은 좌표계를 사용해 건반과 동일한 위치에 노트가 떨어지도록 `getLaneX` 등 수정.
- Hit된 노트를 화면에서 감추거나 파괴되는 애니메이션을 추가하기 위한 상태 연동.
