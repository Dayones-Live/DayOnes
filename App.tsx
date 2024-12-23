import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider} from 'react-redux';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from 'react-native-splash-screen';
import store from './assets/redux/store';
import TermsAndPrivacyScreen from './auth/TermsAndPrivacyScreen';
import LoginPage from './screens/LoginPage';
import PermissionsScreen from './screens/PermissionsScreen';
import RegArtistPage from './screens/artist/RegArtistPage';
import RegFanPage from './screens/fan/RegFanPage';
import ArtistStack from './navigation/ArtistStack';
import FanStack from './navigation/FanStack';
import ProfileScreen from './screens/ProfileScreen';
import ArtistPostsPage from './screens/artist/ArtistPostsPage';
import SignaturePage from './screens/artist/SignaturePage';
import ArtistSignatures from './screens/artist/ArtistSignatures';
import EditScreen from './screens/artist/EditScreen';
import SplashVideoScreen from './screens/SplashVideoScreen';
import DMsScreen from './screens/DMsScreen';
import ConversationThread from './screens/ConversationThread';
import PostDetailPage from './screens/artist/PostDetailsPage';
import VerifyAccount from './screens/VerifyAccount';
import DayOnesScreen from './screens/fan/DayOnesScreen';
import DMDetailPage from './screens/fan/DMDetailPage';
import SuperAdminDashboard from './screens/superadmin/SuperAdminDashboard'; // Import the new screen
import messaging from '@react-native-firebase/messaging';
import {Alert} from 'react-native';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    SplashScreen.hide();
    checkAppSetupStatus();
  }, []);

  // useEffect(() => {
  //   // Listener for foreground messages
  //   const unsubscribe = messaging().onMessage(async remoteMessage => {
  //     // Display an alert with the notification title and body
  //     Alert.alert(
  //       'A New FCM Message Arrived!',
  //       remoteMessage.notification?.body || 'No message body',
  //     );
  //   });

  //   return unsubscribe; // Cleanup the listener on component unmount
  // }, []);

  const checkAppSetupStatus = async () => {
    try {
      const termsAccepted = await AsyncStorage.getItem('termsAccepted');
      const permissionsGranted = await AsyncStorage.getItem(
        'permissionsGranted',
      );
      const authToken = await AsyncStorage.getItem('authToken');
      const userRole = await AsyncStorage.getItem('userRole');

      // Log AsyncStorage values for debugging
      console.log('termsAccepted:', termsAccepted);
      console.log('permissionsGranted:', permissionsGranted);
      console.log('authToken:', authToken);
      console.log('userRole:', userRole);

      if (authToken && userRole) {
        // Check if the token is valid (example for JWT, adjust as needed)
        const tokenPayload = JSON.parse(atob(authToken.split('.')[1])); // Decode JWT payload
        const isTokenExpired = tokenPayload.exp * 1000 < Date.now();
        if (isTokenExpired) {
          console.warn('Auth token is expired.');
          setInitialRoute('LoginPage');
          return;
        }

        // User is logged in; navigate to the appropriate stack
        setInitialRoute(userRole === 'ARTIST' ? 'ArtistStack' : 'FanStack');
      } else if (termsAccepted === 'true') {
        if (permissionsGranted === 'true') {
          setInitialRoute('LoginPage');
        } else {
          setInitialRoute('PermissionsScreen');
        }
      } else {
        setInitialRoute('TermsAndPrivacyScreen');
      }
    } catch (error) {
      console.error('Error checking app setup status:', error);
      setInitialRoute('TermsAndPrivacyScreen'); // Default to TOS on error
    }
  };

  if (initialRoute === null) return null; // Prevent rendering until initial route is determined

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen
              name="TermsAndPrivacyScreen"
              component={TermsAndPrivacyScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="PermissionsScreen"
              component={PermissionsScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="LoginPage"
              component={LoginPage}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="SplashVideoScreen"
              component={SplashVideoScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="RegArtistPage"
              component={RegArtistPage}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="RegFanPage"
              component={RegFanPage}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="ArtistStack"
              component={ArtistStack}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="FanStack"
              component={FanStack}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="ProfileScreen"
              component={ProfileScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="ArtistPostsPage"
              component={ArtistPostsPage}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="SignaturePage"
              component={SignaturePage}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="ArtistSignatures"
              component={ArtistSignatures}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="EditScreen"
              component={EditScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="DMsScreen"
              component={DMsScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="ConversationThread"
              component={ConversationThread}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="PostDetailPage"
              component={PostDetailPage}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="VerifyAccount"
              component={VerifyAccount}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="DayOnesScreen"
              component={DayOnesScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="DMDetailPage"
              component={DMDetailPage}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="SuperAdminDashboard"
              component={SuperAdminDashboard}
              options={{headerShown: false}} // Add the Super Admin Dashboard
            />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
