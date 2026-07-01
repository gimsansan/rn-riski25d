import { useEffect } from 'react';
import { Gyroscope } from 'expo-sensors';
import { useSharedValue, withSpring } from 'react-native-reanimated';

export const useParallax = () => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    let subscription: any;
    
    const subscribe = async () => {
      const isAvailable = await Gyroscope.isAvailableAsync();
      if (isAvailable) {
        Gyroscope.setUpdateInterval(16); // ~60fps
        subscription = Gyroscope.addListener(gyroscopeData => {
          // 모바일 기기의 y축(상하 회전) -> UI의 x축 시차
          // 모바일 기기의 x축(좌우 회전) -> UI의 y축 시차
          tiltX.value = withSpring(gyroscopeData.y * 50, { damping: 20 });
          tiltY.value = withSpring(gyroscopeData.x * 50, { damping: 20 });
        });
      }
    };

    subscribe();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { tiltX, tiltY };
};
