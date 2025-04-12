import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from 'react-native-splash-screen';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import store from './assets/redux/store';
import { BASEURL } from './assets/constants';
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
import DMsScreen from './screens/DMsScreen';
import ConversationThread from './screens/ConversationThread';
import PostDetailPage from './screens/artist/PostDetailsPage';
import VerifyAccount from './screens/VerifyAccount';
import DayOnesScreen from './screens/fan/DayOnesScreen';
import DMDetailPage from './screens/fan/DMDetailPage';
import SuperAdminDashboard from './screens/superadmin/SuperAdminDashboard';
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import NotificationsScreen from './screens/NotificationsScreen';
import { setAccessToken, setUserProfile, setUserID } from './assets/redux/actions';
import axios from 'axios';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

type RootParamList = {
  TermsAndPrivacyScreen: undefined;
  LoginPage: undefined;
  PermissionsScreen: undefined;
  RegArtistPage: undefined;
  RegFanPage: undefined;
  ArtistStack: undefined;
  FanStack: undefined;
  // ... other screen types ...
};

// Configure Google Sign-In
GoogleSignin.configure({
  iosClientId: '918802616844-2rkeh1hqa9jga6r90g0tpphqoocs0rm3.apps.googleusercontent.com',
  webClientId: '918802616844-2rkeh1hqa9jga6r90g0tpphqoocs0rm3.apps.googleusercontent.com', // Use the same client ID
  offlineAccess: true,
});

// Add this type declaration at the top of the file
declare global {
  var navigationRef: any;
}

const App = () => {
  const [initialRoute, setInitialRoute] = useState('TermsAndPrivacyScreen');
  const navigationRef = useRef<NavigationContainerRef<RootParamList>>(null);

  useEffect(() => {
    // Store navigation reference globally
    global.navigationRef = navigationRef;
  }, []);

  useEffect(() => {
    checkAppSetupStatus();
  }, []);

  const checkAppSetupStatus = async () => {
    try {
      const termsAccepted = await AsyncStorage.getItem('termsAccepted');
      const permissionsGranted = await AsyncStorage.getItem('permissionsGranted');
      const authToken = await AsyncStorage.getItem('authToken');
      const userRole = await AsyncStorage.getItem('userRole');

      console.log('App Setup Status:', {
        termsAccepted,
        permissionsGranted,
        hasAuthToken: !!authToken,
        userRole
      });

      // If terms and permissions are accepted but no auth token, go to login
      if (termsAccepted === 'true' && permissionsGranted === 'true' && !authToken) {
        console.log('Terms and permissions accepted, no auth token - navigating to LoginPage');
        setInitialRoute('LoginPage');
        return;
      }

      // If terms are accepted but no permissions, go to permissions screen
      if (termsAccepted === 'true' && permissionsGranted !== 'true') {
        console.log('Terms accepted but no permissions - navigating to PermissionsScreen');
        setInitialRoute('PermissionsScreen');
        return;
      }

      // If terms are not accepted, go to terms screen
      if (termsAccepted !== 'true') {
        console.log('Terms not accepted - navigating to TermsAndPrivacyScreen');
        setInitialRoute('TermsAndPrivacyScreen');
        return;
      }

      if (authToken) {
        try {
          // Validate token by fetching user data
          const response = await axios.get(`${BASEURL}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });

          if (response.data?.data?.user) {
            // Token is valid, update Redux store
            store.dispatch(setAccessToken(authToken));
            store.dispatch(setUserProfile(response.data.data.user));
            
            // Navigate to appropriate stack based on role
            setInitialRoute(userRole === 'ARTIST' ? 'ArtistStack' : 'FanStack');
          } else {
            // Token is invalid, clear storage and go to login
            await clearAuthData();
            setInitialRoute('LoginPage');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // Token validation failed, clear storage and go to login
          await clearAuthData();
          setInitialRoute('LoginPage');
        }
      }
    } catch (error) {
      console.error('Error checking app setup status:', error);
      setInitialRoute('LoginPage');
    } finally {
      // Hide splash screen after all checks are done
      SplashScreen.hide();
    }
  };

  const clearAuthData = async () => {
    try {
      // Clear Redux store
      store.dispatch(setAccessToken(null));
      store.dispatch(setUserProfile(null));
      store.dispatch(setUserID(null));

      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        'authToken',
        'userProfile',
        'userRole',
        'loggedInUser'
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  // Function to get FCM token
  const getFCMToken = async () => {
    try {
      // Only register for remote messages on Android
      if (Platform.OS === 'android') {
        await messaging().registerDeviceForRemoteMessages();
      }
      
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);
      await AsyncStorage.setItem('fcmToken', fcmToken);
    } catch (error) {
      console.error('Error fetching FCM token:', error);
    }
  };

  // Add useEffect to watch for changes in initialRoute
  useEffect(() => {
    console.log('Initial route changed to:', initialRoute);
    if (navigationRef.current && initialRoute) {
      console.log('Attempting to navigate to:', initialRoute);
      // Use type assertion to handle the navigation
      (navigationRef.current as any).navigate(initialRoute);
    }
  }, [initialRoute]);

  if (initialRoute === null) return null;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            // Ensure navigation ref is set when NavigationContainer is ready
            global.navigationRef = navigationRef;
            console.log('Navigation is ready, ref set');
          }}
        >
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen
              name="TermsAndPrivacyScreen"
              component={TermsAndPrivacyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PermissionsScreen"
              component={PermissionsScreen}
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
              name="Notifications"
              component={NotificationsScreen}
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
              name="DayOnesScreen"
              component={DayOnesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DMDetailPage"
              component={DMDetailPage}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SuperAdminDashboard"
              component={SuperAdminDashboard}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
