import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootTabs } from './src/navigation/RootTabs';
import { AppStateProvider, useAppHydration } from './src/state/AppStateProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <NavigationContainer>
            <AppRoot />
            <StatusBar style="dark" />
          </NavigationContainer>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppRoot() {
  const hydrated = useAppHydration();
  if (!hydrated) return null;
  return <RootTabs />;
}
