import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '@/store/useAppStore';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadPersistedState = useAppStore((s) => s.loadPersistedState);

  useEffect(() => {
    loadPersistedState().finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#080808' }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#080808" translucent />
        <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: '#080808' } }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
