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
import { Alert, Platform, AppState } from 'react-native';
import NotificationsScreen from './screens/NotificationsScreen';
import { setAccessToken, setUserProfile, setUserID } from './assets/redux/actions';
import axios from 'axios';
import useSetupNotificationsAndLocation from './assets/hooks/useSetupNotificationsAndLocation';
import { useSelector } from 'react-redux';
import { OneSignal, LogLevel, NotificationClickEvent, NotificationWillDisplayEvent } from 'react-native-onesignal';

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
  PostDetail: { postId: string };
  Profile: { userId: string };
  Chat: { chatId: string };
  EventDetail: { eventId: string };
  // ... other screen types ...
};

// Configure Google Sign-In
GoogleSignin.configure({
  iosClientId: '918802616844-2rkeh1hqa9jga6r90g0tpphqoocs0rm3.apps.googleusercontent.com',
  webClientId: '918802616844-2rkeh1hqa9jga6r90g0tpphqoocs0rm3.apps.googleusercontent.com',
  offlineAccess: true,
});

// Add this type declaration at the top of the file
declare global {
  var navigationRef: any;
}

// Add this after the imports
const PERSISTENCE_KEY = 'NAVIGATION_STATE';

// Add type for Redux state
interface RootState {
  auth: {
    user: {
      id: string;
      [key: string]: any;
    } | null;
  };
  [key: string]: any;
}

// Create a separate component for the app content
const AppContent = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialState, setInitialState] = useState();
  const navigationRef = useRef<NavigationContainerRef<RootParamList>>(null);
  const user = useSelector((state: RootState) => state?.auth?.user || null);
  const appState = useRef('active');

  useEffect(() => {
    // Store navigation reference globally
    global.navigationRef = navigationRef;
  }, []);

  // Initialize OneSignal
  useEffect(() => {
    // Store event handlers in refs for cleanup
    const clickHandler = (event: NotificationClickEvent) => {
      console.log('🔔 OneSignal notification opened:', event);
      
      // Handle notification opened event
      if (event.notification.additionalData) {
        try {
          const parsedData = typeof event.notification.additionalData === 'string' 
            ? JSON.parse(event.notification.additionalData) 
            : event.notification.additionalData;
          console.log('Parsed notification data:', parsedData);
          
          // Handle navigation based on notification data
          if (parsedData.type === 'message' && parsedData.conversation_id) {
            // Navigate to conversation
            if (navigationRef.current) {
              navigationRef.current.navigate('Chat', {
                chatId: parsedData.conversation_id
              });
            }
          }
        } catch (error) {
          console.error('Error parsing notification data:', error);
        }
      }
    };

    const foregroundHandler = (event: NotificationWillDisplayEvent) => {
      console.log('📨 OneSignal notification received:', event);
      
      // Let the system handle the notification display
      // We don't need to do anything here as OneSignal will handle the push notification
      // Just log the event for debugging
      if (event.notification.additionalData) {
        try {
          const parsedData = typeof event.notification.additionalData === 'string' 
            ? JSON.parse(event.notification.additionalData) 
            : event.notification.additionalData;
          console.log('Parsed notification data:', parsedData);
        } catch (error) {
          console.error('Error parsing notification data:', error);
        }
      }
    };

    // Add event listeners
    OneSignal.Notifications.addEventListener('click', clickHandler);
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundHandler);

    // Cleanup listeners on unmount
    return () => {
      OneSignal.Notifications.removeEventListener('click', clickHandler);
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay', foregroundHandler);
    };
  }, []);

  useEffect(() => {
    const checkAppSetupStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check TOS and permissions status
        const [tosAccepted, permissionsAccepted] = await Promise.all([
          AsyncStorage.getItem('tosAccepted'),
          AsyncStorage.getItem('permissionsAccepted')
        ]);

        // Check if user is logged in
        const authToken = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('userData');

        if (authToken && userData) {
          // User is logged in, check permissions
          if (permissionsAccepted === 'true') {
            console.log('User logged in and permissions granted, proceeding to main app');
            setInitialRoute('ArtistStack');
          } else {
            console.log('User logged in but permissions not granted, showing permissions screen');
            setInitialRoute('PermissionsScreen');
          }
        } else {
          // User is not logged in
          if (tosAccepted === 'true' && permissionsAccepted === 'true') {
            console.log('TOS and permissions accepted, going to login');
            setInitialRoute('LoginPage');
          } else if (tosAccepted === 'true') {
            console.log('TOS accepted but permissions not granted, showing permissions screen');
            setInitialRoute('PermissionsScreen');
          } else {
            console.log('TOS not accepted, showing TOS screen');
            setInitialRoute('TermsAndPrivacyScreen');
          }
        }
      } catch (error) {
        console.error('Error checking app setup status:', error);
        setInitialRoute('TermsAndPrivacyScreen');
      } finally {
        setIsLoading(false);
      }
    };

    checkAppSetupStatus();
  }, []);

  const clearAuthData = async () => {
    try {
      // First, get the current TOS and permissions status
      const [tosAccepted, permissionsAccepted] = await Promise.all([
        AsyncStorage.getItem('tosAccepted'),
        AsyncStorage.getItem('permissionsAccepted')
      ]);

      // Clear only auth-related data
      await AsyncStorage.multiRemove([
        'authToken',
        'refreshToken',
        'tokenExpiry',
        'userRole',
        'userData'
      ]);

      // Restore TOS and permissions status if they existed
      if (tosAccepted) {
        await AsyncStorage.setItem('tosAccepted', tosAccepted);
      }
      if (permissionsAccepted) {
        await AsyncStorage.setItem('permissionsAccepted', permissionsAccepted);
      }

      // Clear Redux store
      store.dispatch(setAccessToken(null));
      store.dispatch(setUserProfile(null));
      store.dispatch(setUserID(null));

      // Clear OneSignal external user ID
      // OneSignal.removeExternalUserId(); // Uncomment when ready to use

      console.log('Auth data cleared, TOS and permissions status preserved:', {
        tosAccepted,
        permissionsAccepted
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
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

  if (isLoading || !initialRoute) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer
        ref={navigationRef}
        initialState={initialState}
        onStateChange={(state) => {
          AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
        }}
        onReady={() => {
          global.navigationRef = navigationRef;
          console.log('Navigation is ready, ref set');
        }}
      >
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
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
  );
};

// Main App component that wraps everything with Provider
const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;