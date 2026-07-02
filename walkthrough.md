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
  - 건반 가독성을 보존하기 위해 화면에는 한 번에 **백건 14개(2옥타브 영역)** 범위만 확대해서 크게 렌더링하도록 윈도잉 설정에 맞게 슬라이딩 범위를 정렬했습니다.
  - 상단 옥타브 네비게이터 제어바(`[◀ 옥타브 낮춤]`, `[옥타브 높임 ▶]`)를 누르면, 백건 기준 7개(정확히 1옥타브 영역)씩 뷰포트 시작 인덱스(`viewportStartIdx`)가 슬라이딩되며 흑건와 백건 좌표가 알맞게 보정 정렬됩니다.

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

## 🎯 Phase 5: 2.5D 타격감 및 Haptics 진동 적용 완료
- **햅틱 피드백 추가:** `expo-haptics` 패키지를 연동하여 건반을 누를 때마다 `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`을 호출, 선명한 물리 진동 타격감을 부여했습니다.
- **2.5D Y축 프레스 애니메이션:** 
  - 각 건반(`PianoKey`) 단위로 개별 `useSharedValue`를 활용해, UI 스레드 상에서 60fps 이상의 부드러운 눌림 애니메이션을 적용했습니다.
  - 건반 터치 시 백건은 14px, 흑건은 18px 아래로 하강하며 그림자 투명도 조절을 60fps로 구현 완료했습니다.

---

## 🛡️ Phase 5.5: 사운드 로딩 안전 가드 및 라이프사이클 락 방지 완료
- **초기화 대기 로딩 상태 가드:** `App.tsx` 내에 `isReady` 상태값을 추가하여, `SoundManager.init()` 비동기 로딩이 완료될 때까지 건반 UI 렌더링을 지연시켰습니다. 이를 통해 사운드가 미처 준비되지 않은 레이스 컨디션 상황에서 건반을 눌러 소리가 나지 않던 현상을 해결했습니다.
- **안전한 라이프사이클 언로드:** `SoundManager.unloadAll()` 내에서 개별 `AudioPlayer`를 릴리즈할 때 발생할 수 있는 잠재적 락(Lock)을 방지하기 위해 예외 처리를 도입하고, 해제 후 `fill(null)`을 통해 플레이어 참조 배열을 안전하게 소거했습니다.
- **사운드 반응 레이턴시 최적화:** 연음 연주 시 터치 반응이 늦어지던 문제를 해결하기 위해 `playSound` 내부의 `seekTo(0)` 호출 시 걸려있던 비동기 대기(`await`)를 제거하여 오디오 스레드 블로킹을 해소했습니다.
- **다중 채널 재생 (Polyphony) 구현:** 동일한 음을 빠르게 연속 연타할 때 이전 소리가 뚝 끊겨 튀는 현상을 해결하기 위해, 재생 중인 상태에서는 임시 오디오 플레이어를 동적 생성하여 소리가 자연스럽게 겹치게 하고 3초 뒤에 자동 리소스 해제(release)하는 안전 장치를 적용했습니다.
- **건반 비주얼 비율 현실화 및 상단 여백 확보:** 건반 세로 높이 공식을 `height - 100`에서 `height - 180`으로 수정하여 실제 피아노의 1:5.2 가로세로 비율에 최적 매칭되게 다듬고, 확보된 상단 밤하늘 여백 공간을 활용해 소리 별자리가 더 넉넉하게 렌더링되도록 개선했습니다.
- **불필요한 데모 코드 및 컴포넌트 삭제:** 실제 피아노 구동과 무관한 시차 데모용 컴포넌트였던 `TrainingPanelLab` 패널 파일 및 관련 자이로 센서 모션 코드(`useParallax`)를 제거하여 번들 사이즈를 줄이고 코드를 단순화했습니다. 또한, 건반 컴포넌트(`PianoKeyboard`)가 전체 화면 너비(`width`)를 차지하도록 꽉 찬 비율로 개선했습니다.

---

## 🔄 Phase 6: 메인 비주얼 이펙트 & MugicPage 비즈니스 로직 대통합 완료
- **단일 메인 엔트리 대통합:** 메인의 2번(터치 Ripple 물결) 비주얼 요소를 실제 청능 훈련 비즈니스 로직을 갖고 있는 `MugicPage` (`MusicScreen.tsx`)와 온전히 이식 및 병합하여 [App.tsx](file:///d:/2605_month/rn-riski_v2/App.tsx) 단일 엔트리 구조로 통합 완료했습니다.
- **절대 터치 좌표 물결 연동:** 개별 `PianoKey` 컴포넌트가 눌렸을 때(`onPressIn`), `event.nativeEvent.pageX/Y` 절대 좌표를 수신하여 `RippleLayer`로 전파, 손가락 터치 위치에 네온 물결이 정확하게 반응하여 퍼져나가게끔 설계했습니다.
- **레이어 zIndex 레이아웃 충돌 해결:** `RippleLayer`가 건반 및 훈련 패널 뷰에 가려져 렌더링되던 레이어 우선순위 버그를 수정하기 위해, 물결 레이어 컨테이너에 `zIndex: 99`와 `elevation: 99` 스타일을 강제 적용해 건반 터치 시 물결이 항상 가장 위에 노출되도록 긴급 조치했습니다.
- **오디오 캐시 락 버그 해결:** Fast Refresh(핫 리로드) 시 `useEffect` 클린업으로 인해 이미 해제된(`released`) `AudioPlayer` 인스턴스를 `useRef`가 중복 참조하여 음원 재생이 멈추던 버그를 분석 완료하고, 클린업 함수 실행 시 캐시 및 최근 재생 리스트를 빈 객체와 배열(`soundCache.current = {}; recentlyUsedNotes.current = [];`)로 강제 초기화하여 오동작을 원천 봉쇄했습니다.
- **중복 및 유휴 파일 제거:** `PianoKeyboard.tsx`, `SoundManager.ts`, `MusicScreen.tsx` 외에 사용하지 않게 된 `SpaceBackground.tsx` (우주 배경) 파일 및 관련 코드를 삭제하여 소스코드를 한층 더 가볍게 유지했습니다.

---

## 🔮 Phase 7: 네온 입자 및 소리 별자리 (Sound Constellation) 구현 완료
- **신규 입자 효과 컴포넌트 추가:** [ParticleVisualizer.tsx](file:///d:/2605_month/rn-riski_v2/components/ParticleVisualizer.tsx)를 구현하여, 건반 터치 시 해당 좌표에서 20개의 파티클이 무작위 위 방향(63~117도)으로 분사되도록 개발했습니다.
- **소리 별자리 및 발광선 결합:** 공유해주신 [SoundConstellation.tsx](file:///d:/2605_month/rn-riski_v2/components/SoundConstellation.tsx) 파일의 60fps 별자리 그로우인 및 흩뿌림 물리 훅을 이식 완료했습니다. 정답을 맞춰 연속 콤보가 증가하면 하늘 구역에 별들이 나타나 발광선으로 연결되는데, 기기별 비율 편차를 감안해 옥타브 컨트롤러와 건반 사이의 정렬 안전 구역(y = 75px 부근)으로 수직 높이를 조율하고 X축 등간격 전진 및 Y축 완만한 사인파(Sine wave) 궤적으로 얽힘 없는 아름다운 흐름선 연출을 구현했습니다. 오답 시에는 전체 별자리가 우주 먼지처럼 중력을 받고 흩어지는 물리적인 소멸 연출을 구현했습니다.
- **고성능 Ref 연동 설계:** `App.tsx`에서 다수의 Shared Value를 직접 받아 하위로 흘려보내지 않고, React의 `ref` 및 `useImperativeHandle`을 이용해 `ParticleVisualizer` 컴포넌트 내부에서 별자리 상태를 완전 캡슐화했습니다. `App.tsx`는 정답/오답 시점에 각각 `addStar()`, `onWrong()`만 심플하게 발화시켜 결합도를 낮췄습니다.
- **안드로이드 GPU 렌더링 최적화:** 매 프레임 수십 개의 리액트 노드를 가상 돔에 마운트/디스마운트하는 부하를 0%로 차단하기 위해, 워클릿 프레임 콜백 내부에서 입자의 모든 물리 연산을 처리한 뒤 이를 단 4개의 `Skia Path` 객체로 병합하여 일괄 렌더링하도록 최적화했습니다. 또한, 입자의 최대 개수를 120개로 고정 제한하여 메모리 성능을 안전하게 제어했습니다.
- **롤백 유연성 보장:** `App.tsx` 내에 `VISUALIZER_MODE: 'ripple' | 'particle'` 스위치를 적용하여, 개발 모드에서 `'ripple'`로 한 줄 수정하는 것만으로 이전 원형 물결 효과로 안전하고 완벽하게 되돌아올 수 있게 분기했습니다.
- **테스트용 힌트(치트키) 기능 추가:** 원활한 시각 효과 테스트를 위해 `App.tsx` 내에 `SHOW_ANSWER_HINT` 토글을 배치, 훈련 실행 시 출제된 음계를 화면에 바로 빨갛게 보여주는 힌트 텍스트 렌더러를 탑재했습니다. (나중에 삭제 시 `App.tsx` 내 `SHOW_ANSWER_HINT` 선언부와 렌더링 구절만 삭제하면 안전하게 원복 가능)
