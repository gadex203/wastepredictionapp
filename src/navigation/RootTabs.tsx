import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { RootTabParamList } from './types';
import { ScanStackNavigator } from './ScanStackNavigator';
import { LearnStackNavigator } from './LearnStackNavigator';
import { StatsStackNavigator } from './StatsStackNavigator';
import { ChallengesStackNavigator } from './ChallengesStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'ScanTab'
              ? 'scan-outline'
              : route.name === 'LearnTab'
                ? 'book-outline'
                : route.name === 'StatsTab'
                  ? 'stats-chart-outline'
                  : route.name === 'ChallengesTab'
                    ? 'trophy-outline'
                    : 'person-circle-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ScanTab" component={ScanStackNavigator} options={{ title: 'Tarama' }} />
      <Tab.Screen name="LearnTab" component={LearnStackNavigator} options={{ title: 'Öğren' }} />
      <Tab.Screen name="StatsTab" component={StatsStackNavigator} options={{ title: 'İstatistikler' }} />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesStackNavigator}
        options={{ title: 'Görevler' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
