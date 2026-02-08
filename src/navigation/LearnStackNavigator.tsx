import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LearnStackParamList } from './types';
import { LearnHomeScreen } from '../screens/Learn/LearnHomeScreen';
import { LearnDetailScreen } from '../screens/Learn/LearnDetailScreen';
import { QuizScreen } from '../screens/Learn/QuizScreen';

const Stack = createNativeStackNavigator<LearnStackParamList>();

export function LearnStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LearnHome" component={LearnHomeScreen} />
      <Stack.Screen name="LearnDetail" component={LearnDetailScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
    </Stack.Navigator>
  );
}

