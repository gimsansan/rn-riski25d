import React from 'react';
import { StyleSheet, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withSequence } from 'react-native-reanimated';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MugicPage from './existing_file/index'
// Hooks
import { useParallax } from './hooks/useParallax';

// 분리된 컴포넌트 불러오기
import { SpaceBackground } from './components/SpaceBackground';
import { TrainingPanelLab } from './components/TrainingPanelLab';
import { RippleLayer } from './components/RippleLayer';
import { PianoKeyboard } from './components/PianoKeyboard';
import SoundManager from './components/SoundManager';

const AppContent = () => {
  const { tiltX, tiltY } = useParallax();
  const { width, height } = useWindowDimensions();

  // 물결 효과를 위한 Shared Values
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const rippleProgress = useSharedValue(0);

  // 화면을 터치했을 때 실행되는 함수
  const handlePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    // 터치 위치 업데이트
    touchX.value = locationX;
    touchY.value = locationY;

    // 물결 애니메이션 실행 (0 -> 1 -> 0)
    rippleProgress.value = 0;
    rippleProgress.value = withSequence(
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 0 }) // 애니메이션 끝나면 즉시 리셋
    );
  };

  // 2.5D Parallax 스타일 (전경 레이어용)
  const foregroundStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value },
        { translateY: tiltY.value },
      ],
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 화면 전체 터치 감지 영역 */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handlePress}>

        {/* 1. Background Layer (우주 배경) */}
        <View style={styles.backgroundLayer} pointerEvents="none">
          <SpaceBackground />
        </View>

        {/* 2. Midground Layer (Piano & 이펙트) */}
        <View style={styles.midgroundLayer} pointerEvents="box-none">
          {/* 피아노 건반 (우측 영역 차지) */}
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: width - 280 }}>
            <PianoKeyboard width={width - 280} height={height} />
          </View>
          <RippleLayer touchX={touchX} touchY={touchY} rippleProgress={rippleProgress} />
        </View>

      </Pressable>

      {/* 3. Foreground Layer (UI 패널, 터치 방해 안 하도록 분리) */}
      <Animated.View style={[styles.foregroundLayer, foregroundStyle]} pointerEvents="box-none">
        <TrainingPanelLab />
      </Animated.View>

    </SafeAreaView>
  );
};

export default function App() {
  React.useEffect(() => {
    // 앱이 켜질 때 가로 모드로 강제 고정
    //  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    // 사운드 매니저 초기화 (피아노 소리 24개 프리로드)
    //    SoundManager.init();

    /*     return () => {
          SoundManager.unloadAll();
        }; */
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    // (선택) 기존 AppContent에서 쓰던 SoundManager 초기화는 
    // 새 index.tsx 내부에서 직접 처리하므로 여기서는 지우거나 주석 처리해도 무방합니다.
    // SoundManager.init(); 

    return () => {
      // SoundManager.unloadAll();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <MugicPage />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // 기본 검정
  },
  layerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 100,
  },
  backgroundLayer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },
  midgroundLayer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  foregroundLayer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', // 세로 중앙 정렬
    alignItems: 'flex-start', // 가로 좌측 정렬 (패널 이동)
    padding: 30,
    zIndex: 3,
  },
});
