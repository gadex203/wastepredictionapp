import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ScanStackParamList } from './types';
import { ScanScreen } from '../screens/Scan/ScanScreen';
import { ResultScreen } from '../screens/Result/ResultScreen';

const Stack = createNativeStackNavigator<ScanStackParamList>();

export function ScanStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}

