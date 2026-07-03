/**
 * songs.ts
 * ------------------------------------------------------------------
 * 낙하노트 훈련모드용 곡 데이터 (음 + 타이밍 목록)
 *
 * 구성: 자작 펜타토닉 2곡(5음) + 국제 퍼블릭 도메인 2곡(8음)
 *   - 5음(penta5): C4·D4·E4·G4·A4   (반음 없는 장5음계 → 어떤 순서든 곡이 됨)
 *   - 8음(white8): C4·D4·E4·F4·G4·A4·B4·C5   (백건 1옥타브 = 도레미파솔라시도)
 *
 * 타이밍: beat = 판정선에 도달해야 하는 시점(박 단위). bpm=72(느리게).
 *   낙하 시작시점 = (beat - leadBeats). leadBeats는 엔진이 낙하 속도로 결정.
 *   동시 낙하 없음(한 음씩). 각 음은 기존 soundFiles 샘플을 재생.
 *
 * ※ 낙하노트 엔진 자체는 아직 미구현. 이 파일은 '데이터'만 제공.
 *    (Not verified: 엔진 연동/실기기 재생은 미확인)
 * ※ Note 타입: 원칙적으론 App.tsx의 Note를 export해 공유하는 게 이상적.
 *    실용상 지금은 자기완결을 위해 여기서 재정의 — App.tsx 값과 반드시 동일해야 함.
 */

export type Note =
  | 'C1' | 'C#1' | 'D1' | 'D#1' | 'E1' | 'F1' | 'F#1' | 'G1' | 'G#1' | 'A1' | 'A#1' | 'B1'
  | 'C2' | 'C#2' | 'D2' | 'D#2' | 'E2' | 'F2' | 'F#2' | 'G2' | 'G#2' | 'A2' | 'A#2' | 'B2'
  | 'C3' | 'C#3' | 'D3' | 'D#3' | 'E3' | 'F3' | 'F#3' | 'G3' | 'G#3' | 'A3' | 'A#3' | 'B3'
  | 'C4' | 'C#4' | 'D4' | 'D#4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'G#4' | 'A4' | 'A#4' | 'B4'
  | 'C5' | 'C#5' | 'D5' | 'D#5';

export type SongScale = 'penta5' | 'white8';

export interface SongNote {
  note: Note;   // 재생할 음 (App.tsx의 Note / soundFiles 키와 동일)
  beat: number; // 판정선 도달 시점(박)
}

export interface Song {
  id: string;
  title: string;
  origin: 'original' | 'public_domain';
  scale: SongScale;
  palette: Note[]; // 이 곡이 쓰는 음 집합 (건반 필터 / 레인 구성용)
  bpm: number;     // 느리게: 72
  notes: SongNote[];
}

// 음 집합 (레인/건반 구성에 그대로 사용)
const PENTA5: Note[] = ['C4', 'D4', 'E4', 'G4', 'A4'];
const WHITE8: Note[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

export const songs: Song[] = [
  // ── 자작 1 (펜타토닉 5음) ──────────────────────────────
  {
    id: 'orig_starlight',
    title: '별빛 산책',
    origin: 'original',
    scale: 'penta5',
    palette: PENTA5,
    bpm: 72,
    notes: [
      { note: 'C4', beat: 0 }, { note: 'D4', beat: 1 }, { note: 'E4', beat: 2 }, { note: 'G4', beat: 3 },
      { note: 'A4', beat: 4 }, { note: 'G4', beat: 5 }, { note: 'E4', beat: 6 }, { note: 'D4', beat: 7 },
      { note: 'C4', beat: 9 }, { note: 'E4', beat: 10 }, { note: 'G4', beat: 11 }, { note: 'A4', beat: 12 },
      { note: 'G4', beat: 13 }, { note: 'E4', beat: 14 }, { note: 'D4', beat: 15 }, { note: 'C4', beat: 16 },
    ],
  },

  // ── 자작 2 (펜타토닉 5음) ──────────────────────────────
  {
    id: 'orig_ripple',
    title: '물놀이',
    origin: 'original',
    scale: 'penta5',
    palette: PENTA5,
    bpm: 72,
    notes: [
      { note: 'G4', beat: 0 }, { note: 'A4', beat: 1 }, { note: 'G4', beat: 2 }, { note: 'E4', beat: 3 },
      { note: 'D4', beat: 4 }, { note: 'E4', beat: 5 }, { note: 'G4', beat: 6 }, { note: 'A4', beat: 7 },
      { note: 'G4', beat: 9 }, { note: 'E4', beat: 10 }, { note: 'D4', beat: 11 }, { note: 'C4', beat: 12 },
      { note: 'D4', beat: 13 }, { note: 'E4', beat: 14 }, { note: 'D4', beat: 15 }, { note: 'C4', beat: 16 },
    ],
  },

  // ── 퍼블릭 도메인 1 (백건 8음) ─────────────────────────
  // 반짝반짝 작은별 (원곡 "Ah! vous dirai-je, maman", 18세기 · PD)
  {
    id: 'pd_twinkle',
    title: '반짝반짝 작은별',
    origin: 'public_domain',
    scale: 'white8',
    palette: WHITE8,
    bpm: 72,
    notes: [
      { note: 'C4', beat: 0 }, { note: 'C4', beat: 1 }, { note: 'G4', beat: 2 }, { note: 'G4', beat: 3 },
      { note: 'A4', beat: 4 }, { note: 'A4', beat: 5 }, { note: 'G4', beat: 6 },
      { note: 'F4', beat: 8 }, { note: 'F4', beat: 9 }, { note: 'E4', beat: 10 }, { note: 'E4', beat: 11 },
      { note: 'D4', beat: 12 }, { note: 'D4', beat: 13 }, { note: 'C4', beat: 14 },
    ],
  },

  // ── 퍼블릭 도메인 2 (백건 8음) ─────────────────────────
  // 메리의 어린 양 (전통 멜로디 · PD)
  {
    id: 'pd_mary',
    title: '메리의 어린 양',
    origin: 'public_domain',
    scale: 'white8',
    palette: WHITE8,
    bpm: 72,
    notes: [
      { note: 'E4', beat: 0 }, { note: 'D4', beat: 1 }, { note: 'C4', beat: 2 }, { note: 'D4', beat: 3 },
      { note: 'E4', beat: 4 }, { note: 'E4', beat: 5 }, { note: 'E4', beat: 6 },
      { note: 'D4', beat: 8 }, { note: 'D4', beat: 9 }, { note: 'D4', beat: 10 },
      { note: 'E4', beat: 12 }, { note: 'G4', beat: 13 }, { note: 'G4', beat: 14 },
      { note: 'E4', beat: 16 }, { note: 'D4', beat: 17 }, { note: 'C4', beat: 18 }, { note: 'D4', beat: 19 },
      { note: 'E4', beat: 20 }, { note: 'E4', beat: 21 }, { note: 'E4', beat: 22 }, { note: 'E4', beat: 23 },
      { note: 'D4', beat: 25 }, { note: 'D4', beat: 26 }, { note: 'E4', beat: 27 }, { note: 'D4', beat: 28 },
      { note: 'C4', beat: 29 },
    ],
  },
];

// 선택지별 조회 헬퍼 (5음 / 8음 두 갈래)
export const songsByScale = (scale: SongScale): Song[] =>
  songs.filter((s) => s.scale === scale);
