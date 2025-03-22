import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FHomePage from '../screens/fan/FHomePage'; // Fan's Home Page
import MyCollectionsPage from '../screens/fan/MyCollectionsPage'; // "My Collections" page
import DayOnesScreen from '../screens/fan/DayOnesScreen'; // DayOnes screen
import DMsScreen from '../screens/DMsScreen'; // Direct Messages screen
import FanOnboardingTutorial from '../screens/fan/FanOnboardingTutorial';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

// Create a stack navigator for the Home tab
const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="FHomePage" component={FHomePage} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
};

const FanStack = ({ navigation }) => {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  const checkTutorialStatus = async () => {
    try {
      const tutorialComplete = await AsyncStorage.getItem('fanTutorialComplete');
      console.log('Tutorial Status Check:', {
        tutorialComplete,
        isNull: tutorialComplete === null,
        value: tutorialComplete,
      });
      
      setShowTutorial(!tutorialComplete);
      console.log('Show Tutorial Set to:', !tutorialComplete);
    } catch (error) {
      console.error('Error checking tutorial status:', error);
      setShowTutorial(true);
      console.log('Show Tutorial defaulted to true due to error');
    }
  };

  const handleTutorialComplete = () => {
    console.log('Tutorial Complete Handler Called');
    setShowTutorial(false);
  };

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
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
              case 'DayOnes':
                iconName = 'comment';
                break;
              case "DM's":
                iconName = 'envelope-o';
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
          component={HomeStackScreen}
          options={{ tabBarLabel: 'Home', tabBarTestID: 'homeButton' }}
        />
        <Tab.Screen
          name="My Collections"
          component={MyCollectionsPage}
          options={{ tabBarLabel: 'My Collections', tabBarTestID: 'collectionsButton' }}
        />
        <Tab.Screen
          name="DayOnes"
          component={DayOnesScreen}
          options={{ tabBarLabel: 'DayOnes', tabBarTestID: 'messagesButton' }}
        />
        <Tab.Screen
          name="DM's"
          component={DMsScreen}
          options={{ tabBarLabel: "DM's", tabBarTestID: 'dmsButton' }}
        />
      </Tab.Navigator>

      <FanOnboardingTutorial
        isVisible={showTutorial}
        onComplete={handleTutorialComplete}
        navigation={navigation}
      />
    </>
  );
};

export default FanStack;
