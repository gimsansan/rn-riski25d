# 인계문 — 2.5D 청능 피아노 앱 · 다음 작업: **#5 Sound Trail 입자 비주얼라이저**

## 0. 사용법
- 새 채팅 **첫 메시지에 이 문서를 통째로 붙여넣기**.
- 아래 §3의 두 파일(`useAutoFocusViewport.jsx`, `RippleGlissandoAura.tsx`)도 **함께 업로드**하면 바로 재사용 가능.

---

## 1. 프로젝트
- **스택:** React Native (Expo SDK 57) + `@shopify/react-native-skia` + `react-native-reanimated` + `expo-audio` + `react-native-gesture-handler`
- **앱:** 가로 모드 전용 피아노 청능(聽能) 훈련 게임. `C1`~`D#5`(52음) M4A 음원 사전 로드.
- 핵심 화면: `index.tsx` (예: `d:/Projects/rn-riski25d`).

## 2. 확정된 사실 (이 대화에서 확인됨 — 추측 아님)
- **건반 모델:** 52음(C1~D#5), 백건 30개. 화면엔 **백건 14개(2옥타브)만 slice 렌더**.
- `viewportStartIdx` = **백건 배열 인덱스(0~16)**. 렌더: `whites.slice(start, start+14)`.
- `currentNote` = **`'C4'` / `'C#4'` 문자열**.
- **건반 치수(index.tsx):** `whiteKeyWidth = pianoAreaWidth/14`, `whiteKeyHeight = height-100`, `blackKeyWidth = whiteKeyWidth*0.6`, `blackKeyHeight = whiteKeyHeight*0.65`.
- **흑건 x** = `(선행 백건 뷰포트 인덱스+1)*whiteKeyWidth - blackKeyWidth/2`.
- **히트테스트:** `Y<blackKeyHeight`면 흑건 X영역 먼저 판정 → 아니면 `floor(X/whiteKeyWidth)`로 백건.
- **오디오 함수:** `playSound(note)` / `handleNotePressIn(note)`·`handleNotePressOut(note)`(후자는 훈련 점수 판정 포함).

## 3. 이미 만든 것 (첨부 권장 — 새 채팅에 올리면 재사용)
- **`useAutoFocusViewport.jsx`** — #9 자동 옥타브 포커싱(✅ 코드 제공됨, 통합/테스트는 사용자 몫).
  - `buildKeyboard()` → `{ notes[52]{id,name,octave,isBlack,semitone}, whites[30]{id,name,octave}, whiteIdxRefById:Map }`
  - `computeFocusStart(noteWhiteIdx, currentStart, size, totalWhite)` (순수 함수), `useAutoFocusViewport({...})` 훅. **slice 시작값 갱신 방식**(translateX 아님).
- **`RippleGlissandoAura.tsx`** — #3 글리산도 궤적 + 롱프레스 오라(✅ 코드 제공됨).
  - `buildVisibleKeys(whites, viewportStartIdx, dims)` → `VisibleKey[] { note, isBlack, x, width, height }`  ← **#5 입자 발생 좌표를 여기서 얻으면 됨**
  - Skia 오버레이 `<Canvas>` + `Gesture.Manual` 멀티터치 + `useFrameCallback` 구조.
  - ⚠️ 이 오버레이가 **입력을 담당** → 기존 건반별 `TouchableOpacity onPressIn/Out`은 제거/비활성화 상태여야 함(이중 발화 방지).

---

## 4. 다음 작업: #5 Sound Trail 입자 비주얼라이저
**목표(문서 지시2 / 질문7):** 건반 타격 시, 그 건반 X에서 **화면 상단으로 수직으로 뿜어 오르는 네온 입자 트레일**. 입자는 Y 위 방향 + 무작위 X 확산으로 **물리(속도·중력 감쇠)** 이동, `expo-audio` **디케이(Decay)와 싱크**되어 소리 소멸 시 불꽃처럼 페이드아웃.

**권장 접근(이 대화에서 세운 아키텍처 재사용):**
- **렌더:** Skia 오버레이 `<Canvas>`. #3 오버레이에 합쳐 하나의 Canvas+`useFrameCallback`로 갈지, 별도 Canvas로 갈지는 **결정 필요**(아래).
- **물리:** `useFrameCallback`로 매 프레임 입자 위치 갱신(`vy` 적분 + gravity 감쇠, `vx` 무작위). 모든 연산 UI 스레드. 입자 배열은 `useSharedValue`에 보관.
- **발생 위치:** 타격된 건반의 `x + width/2`. `buildVisibleKeys(...)`의 `VisibleKey`에서 좌표 획득.
- **트리거:** 타격 시점(= `handleNotePressIn` 또는 `playSound` 호출 지점)에서 해당 건반에 입자 버스트 생성.
- **페이드:** `expo-audio` 노트 재생 길이/decay에 맞춰 입자 lifetime 설정.
- **네온:** 입자에 `<Blur>` + 밝은 색. 헤비 파티클은 Skia에 위임(프레임 드랍 방지).

**결정/확인 필요:**
1. #3 오버레이와 **통합 vs 별도 Canvas** (통합하면 클럭 하나로 관리, 코드는 커짐).
2. `expo-audio`가 노트별 **재생 길이/decay 곡선을 어떻게 노출**하는지 → 입자 수명 결정에 필요(현재 미확인).
3. 성능 예산: 화음(동시 타건) 시 **총 입자 수 상한**.

---

## 5. 현재 API 사실 (버전 민감 · 이 대화에서 검색 확인, 2026-07 기준)
- Skia `useTouchHandler`/`onTouch` **폐지** → gesture-handler `Gesture` + shared value 사용, **Skia가 shared value를 그대로 읽어 렌더**(createAnimatedComponent 불필요).
- **reanimated v4 + gesture-handler**가 현재 표준. 헤비 드로잉/파티클은 Skia에 위임.
- (참고) Fabric 새 아키텍처는 RN 0.76부터 기본, 0.82에서 구 아키텍처 영구 비활성화. Rive Renderer 120fps.
- 버전 바뀌는 항목은 **답 전에 최신 검색** 권장.

## 6. 작업 스타일 (이 프로젝트에서 지켜온 것)
- **질문엔 답부터.** 코드/파일 생성은 **명시적 요청 시에만**.
- **안 읽은 파일 내용은 추측 금지** — 필요하면 `확인 필요`로 표시. 가정은 `Assumption:`으로 명시.
- 코드 보일 때 **실무 사용 빈도(흔함/가끔/드묾)** 표기.
- **"이상(원칙) vs 현실(권장)"을 분리**해 같이 명시, 입장은 대화 내내 일관 유지.
- 파일은 **1개만** 생성.
- (요청 문장 끝 "간단"/"간" → 최대한 간단히. "알기 쉽게" → 쉽고·가독성·시각적으로. "인터랙티브 아티팩트로" → 정적 SVG 대신 실행 가능한 .jsx.)

## 7. 전체 기능 번호 (이 대화 합의 번호 — 사용자가 "N번"으로 지칭)
1 건반 2.5D 타격 프레스 · 2 터치 Ripple 물결 · **3 Ripple Glissando 궤적+롱프레스 오라 ✅** · 4 성운 네온 배경 · **5 Sound Trail 입자 ⬅ 다음** · 6 음역대별 Color-to-Pitch 번짐 · 7 소리 별자리 · 8 옥타브 좌우 슬라이딩 전환 · **9 자동 옥타브 포커싱 ✅** · 10 피아노 미니맵 · 11 Glassmorphism 제어판 · 12 자이로 Parallax

**완료(코드 제공): #3, #9** / **다음: #5**
