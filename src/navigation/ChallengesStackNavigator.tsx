import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ChallengesStackParamList } from './types';
import { ChallengesScreen } from '../screens/Challenges/ChallengesScreen';

const Stack = createNativeStackNavigator<ChallengesStackParamList>();

export function ChallengesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
    </Stack.Navigator>
  );
}

