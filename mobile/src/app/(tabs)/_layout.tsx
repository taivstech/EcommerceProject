import AppTabs from '@/components/app-tabs';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useSegments } from 'expo-router';

export default function TabLayout() {
  const segments = useSegments();

  useEffect(() => {
    const onBackPress = () => {
      // Nếu đang ở màn hình thuộc tabs (ví dụ: (tabs)/index, (tabs)/explore...)
      // thì nhấn nút Back trên Android sẽ thoát app thay vì báo lỗi GO_BACK
      const isOnTabScreen = segments[0] === '(tabs)';
      if (isOnTabScreen && segments.length <= 2) {
        BackHandler.exitApp();
        return true; // Chặn hành vi mặc định (tránh lỗi GO_BACK)
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [segments]);

  return <AppTabs />;
}
