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
- **데모용 UI 컴포넌트 정리:** 실제 청능 훈련 로직과 연결되지 않고 시차 데모용으로만 존재하던 `TrainingPanelLab` 패널과 자이로 센서 연동 훅(`useParallax`) 코드를 정리 및 삭제하고, 메인 피아노 건반이 화면 전체 가로 영역을 채우도록 레이아웃을 확장했습니다.

### 🔄 Phase 6: 메인 비주얼 이펙트 & MugicPage 비즈니스 로직 대통합 (완료)
- **단일 메인 엔트리 대통합:** 메인의 2번(터치 Ripple 물결) 비주얼 요소를 실제 청능 훈련 비즈니스 로직을 갖고 있는 `MugicPage` (`MusicScreen.tsx`)와 온전히 이식 및 병합하여 [App.tsx](file:///d:/2605_month/rn-riski_v2/App.tsx) 단일 엔트리 구조로 통합 완료했습니다.
- **절대 터치 좌표 물결 연동:** 개별 `PianoKey` 컴포넌트가 눌렸을 때(`onPressIn`), `event.nativeEvent.pageX/Y` 절대 좌표를 수신하여 `RippleLayer`로 전파, 손가락 터치 위치에 네온 물결이 정확하게 반응하여 퍼져나가게끔 설계했습니다.
- **레이어 zIndex 레이아웃 충돌 해결:** `RippleLayer`가 건반 및 훈련 패널 뷰에 가려져 렌더링되던 레이어 우선순위 버그를 수정하기 위해, 물결 레이어 컨테이너에 `zIndex: 99`와 `elevation: 99` 스타일을 강제 적용해 건반 터치 시 물결이 항상 가장 위에 노출되도록 긴급 조치했습니다.
- **오디오 캐시 락 버그 해결:** Fast Refresh(핫 리로드) 시 `useEffect` 클린업으로 인해 이미 해제된(`released`) `AudioPlayer` 인스턴스를 `useRef`가 중복 참조하여 음원 재생이 멈추던 버그를 분석 완료하고, 클린업 함수 실행 시 캐시 및 최근 재생 리스트를 빈 객체와 배열(`soundCache.current = {}; recentlyUsedNotes.current = [];`)로 강제 초기화하여 오동작을 원천 봉쇄했습니다.
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

## Verification Plan

### Automated Tests
- 없음 (UI 이펙트 전용 컴포넌트)

### Manual Verification
- 안드로이드 기기에서 건반을 타격할 때 입자들이 60fps에 준하는 속도로 매끄럽게 솟구쳤다가 흩어지는지 시각적 유효성 확인.
- 멀티 터치(화음 연주) 시 여러 곳에서 입자가 끊김 없이 동시에 잘 뿜어져 나오는지 확인.
- `VISUALIZER_MODE`를 `'ripple'`로 전환했을 때 기존 물결 모드로 정상 롤백되는지 정합성 확인.
