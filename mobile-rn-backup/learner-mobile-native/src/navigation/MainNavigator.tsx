import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import LearningHubScreen from '../screens/learning/LearningHubScreen';
import VirtualBrainScreen from '../screens/learning/VirtualBrainScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Learning Stack
const LearningStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="LearningHub"
      component={LearningHubScreen}
      options={{title: 'Learning Hub'}}
    />
    <Stack.Screen
      name="VirtualBrain"
      component={VirtualBrainScreen}
      options={{title: 'Virtual Brain'}}
    />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Learning') {
            iconName = focused ? 'brain' : 'brain';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'chart-line' : 'chart-line';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learning" component={LearningStack} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
