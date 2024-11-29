import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import FHomePage from '../screens/fan/FHomePage'; // Fan's Home Page
import MyCollectionsPage from '../screens/fan/MyCollectionsPage'; // "My Collections" page
import DayOnesScreen from '../screens/fan/DayOnesScreen'; // DayOnes screen
import DMsScreen from '../screens/DMsScreen'; // Direct Messages screen

const Tab = createBottomTabNavigator();

const FanStack = () => {
  return (
    <Tab.Navigator
      initialRouteName="FHomePage"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'My Collections':
              iconName = 'star';
              break;
            case 'DayOnes': // DayOnes icon
              iconName = 'comment'; // Different messaging icon for DayOnes
              break;
            case "DM's":
              iconName = 'envelope-o'; // Regular DMs icon
              break;
            default:
              iconName = 'circle';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF0080',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={FHomePage}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="My Collections"
        component={MyCollectionsPage}
        options={{ tabBarLabel: 'My Collections' }}
      />
      <Tab.Screen
        name="DayOnes" // Add DayOnes to the tab bar
        component={DayOnesScreen}
        options={{ tabBarLabel: 'DayOnes' }}
      />
      <Tab.Screen
        name="DM's"
        component={DMsScreen}
        options={{ tabBarLabel: "DM's" }}
      />
    </Tab.Navigator>
  );
};

export default FanStack;
