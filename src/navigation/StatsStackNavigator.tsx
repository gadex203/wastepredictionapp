import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { StatsStackParamList } from './types';
import { StatsScreen } from '../screens/Stats/StatsScreen';
import { HistoryScreen } from '../screens/Stats/HistoryScreen';

const Stack = createNativeStackNavigator<StatsStackParamList>();

export function StatsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}

