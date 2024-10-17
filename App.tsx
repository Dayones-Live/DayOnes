import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from 'react-native-splash-screen';
import { Provider } from 'react-redux';
import store from './assets/redux/store';
import messaging from '@react-native-firebase/messaging'; // Import Firebase Messaging
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { startWatchingLocation, stopWatchingLocation } from './assets/services/geolocationService';
import LoginPage from './screens/LoginPage';
import RegArtistPage from './screens/artist/RegArtistPage';
import RegFanPage from './screens/fan/RegFanPage';
import ArtistStack from './navigation/ArtistStack';
import FanStack from './navigation/FanStack';
import ProfileScreen from './screens/ProfileScreen';
import ArtistPostsPage from './screens/artist/ArtistPostsPage';
import SignaturePage from './screens/artist/SignaturePage';
import ArtistSignatures from './screens/artist/ArtistSignatures';
import PermissionsScreen from './screens/PermissionsScreen';
import EditScreen from './screens/artist/EditScreen';
import SplashVideoScreen from './screens/SplashVideoScreen';
import DMsScreen from './screens/DMsScreen';
import ConversationThread from './screens/ConversationThread'; // Import ConversationThread
import PostDetailPage from './screens/artist/PostDetailsPage';
import VerifyAccount from './screens/VerifyAccount';
import DayOnesScreen from './screens/fan/DayOnesScreen';
import DMDetailPage from './screens/fan/DMDetailPage'

const Stack = createStackNavigator();
const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    let unsubscribeFn: (() => void) | undefined;

    // Hide the splash screen (the default one, not the video one)
    SplashScreen.hide();

    // Start watching geolocation when the app starts
    startWatchingLocation();

    // Register the device for remote messages
    const registerForRemoteMessages = async () => {
      try {
        await messaging().registerDeviceForRemoteMessages(); // Register the device
        console.log('Device registered for remote messages.');
      } catch (error) {
        console.error('Error registering device for remote messages:', error);
      }
    };

    // Request notification permission and handle incoming messages
    const requestPermissionAndHandleNotifications = async () => {
      try {
        await registerForRemoteMessages();

        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permission granted.');

          const token = await messaging().getToken(); // Get the FCM token
          console.log('FCM Token:', token); // Log the FCM token

          const unsubscribe = messaging().onMessage(async (remoteMessage) => {
            console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
          });

          return unsubscribe;
        } else {
          console.log('Notification permission not granted.');
        }
      } catch (error) {
        console.error('Error requesting permission or handling notifications:', error);
      }
    };

    const setupNotifications = async () => {
      unsubscribeFn = await requestPermissionAndHandleNotifications();
    };

    setupNotifications();

    return () => {
      stopWatchingLocation();

      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="LoginPage">
            <Stack.Screen
              name="SplashVideoScreen"
              component={SplashVideoScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LoginPage"
              component={LoginPage}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegArtistPage"
              component={RegArtistPage}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegFanPage"
              component={RegFanPage}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ArtistStack"
              component={ArtistStack}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="FanStack"
              component={FanStack}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProfileScreen"
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ArtistPostsPage"
              component={ArtistPostsPage}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignaturePage"
              component={SignaturePage}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ArtistSignatures"
              component={ArtistSignatures}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PermissionsScreen"
              component={PermissionsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditScreen"
              component={EditScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DMsScreen"
              component={DMsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ConversationThread"
              component={ConversationThread}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PostDetailPage"
              component={PostDetailPage}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerifyAccount"
              component={VerifyAccount}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DayOnesScreen" // Add the DayOnesScreen here
              component={DayOnesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
            name="DMDetailPage" // Add the DayOnesScreen here
            component={DMDetailPage}
            options={{ headerShown: false }}
          />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
