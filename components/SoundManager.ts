import { createAudioPlayer, setAudioModeAsync, AudioPlayer, preload } from 'expo-audio';

// Metro Bundler는 동적 require를 허용하지 않으므로 24개 파일을 명시적으로 매핑합니다.
const soundFiles = [
  require('../assets/sounds/note_0.mp3'),
  require('../assets/sounds/note_1.mp3'),
  require('../assets/sounds/note_2.mp3'),
  require('../assets/sounds/note_3.mp3'),
  require('../assets/sounds/note_4.mp3'),
  require('../assets/sounds/note_5.mp3'),
  require('../assets/sounds/note_6.mp3'),
  require('../assets/sounds/note_7.mp3'),
  require('../assets/sounds/note_8.mp3'),
  require('../assets/sounds/note_9.mp3'),
  require('../assets/sounds/note_10.mp3'),
  require('../assets/sounds/note_11.mp3'),
  require('../assets/sounds/note_12.mp3'),
  require('../assets/sounds/note_13.mp3'),
  require('../assets/sounds/note_14.mp3'),
  require('../assets/sounds/note_15.mp3'),
  require('../assets/sounds/note_16.mp3'),
  require('../assets/sounds/note_17.mp3'),
  require('../assets/sounds/note_18.mp3'),
  require('../assets/sounds/note_19.mp3'),
  require('../assets/sounds/note_20.mp3'),
  require('../assets/sounds/note_21.mp3'),
  require('../assets/sounds/note_22.mp3'),
  require('../assets/sounds/note_23.mp3'),
];

class SoundManager {
  private soundObjects: (AudioPlayer | null)[] = new Array(24).fill(null);
  private isLoaded = false;

  async init() {
    if (this.isLoaded) return;
    
    // 오디오 모드 설정 (레이턴시 최소화, iOS 무음 모드 무시)
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });

    // 24개 사운드 병렬 프리로드
    const loadPromises = soundFiles.map(async (file, index) => {
      try {
        await preload(file);
        this.soundObjects[index] = createAudioPlayer(file);
      } catch (e) {
        console.warn(`Failed to load sound index ${index}`, e);
      }
    });

    await Promise.all(loadPromises);
    this.isLoaded = true;
    console.log('All piano sounds preloaded successfully!');
  }

  async play(index: number) {
    if (index < 0 || index >= 24) return;
    
    const sound = this.soundObjects[index];
    console.log(`SoundManager.play called for index: ${index}, sound loaded: ${!!sound}`);
    if (sound) {
      try {
        // 이미 재생 중이면 처음부터 다시 재생
        await sound.seekTo(0);
        sound.play();
      } catch (e) {
        console.warn(`Failed to play sound index ${index}`, e);
      }
    }
  }

  // 메모리 해제
  async unloadAll() {
    this.soundObjects.forEach((sound) => {
      if (sound) {
        sound.remove();
      }
    });
    this.isLoaded = false;
  }
}

export default new SoundManager();
