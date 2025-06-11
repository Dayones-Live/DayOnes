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
import useNotifications from './assets/hooks/useNotifications';

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
  ConversationThread: {
    conversationId: string;
    userId: string;
    username: string;
    profilePicture: string;
    isNewConversation: boolean;
  };
  DMDetailPage: { postId: string };
  PostDetailPage: { postId: string };
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

// Add interface for notification data
interface NotificationData {
  type: string;
  conversation_id?: string;
  post_id?: string;
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
    if (navigationRef.current) {
      global.navigationRef = navigationRef;
      console.log('Navigation reference set globally');
    }
  }, [navigationRef.current]);

  // Use our new notification hook with proper typing
  useNotifications({
    onNotificationClick: async (data: NotificationData) => {
      console.log('🔔 Notification clicked:', data);
      
      try {
        // Get user data to determine navigation
        const loggedInUser = await AsyncStorage.getItem('userData');
        if (!loggedInUser) {
          console.error('No user data found');
          return;
        }
        const parsedUser = JSON.parse(loggedInUser);
        const isFan = parsedUser.data.role === 'USER';

        // Handle different notification types
        if (data.type === 'message' && data.conversation_id) {
          // Handle message notification
          try {
            const authToken = await AsyncStorage.getItem('authToken');
            if (!authToken) {
              console.error('No auth token found');
              return;
            }

            const response = await fetch(`${BASEURL}/api/v1/conversation/${data.conversation_id}`, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            });
            
            if (response.ok) {
              const responseData = await response.json();
              const conversation = responseData.data;
              
              const otherUser = conversation.sender.email === parsedUser.data.email 
                ? conversation.reciever 
                : conversation.sender;

              if (navigationRef.current) {
                navigationRef.current.navigate('ConversationThread', {
                  conversationId: data.conversation_id,
                  userId: otherUser.id,
                  username: otherUser.full_name,
                  profilePicture: otherUser.avatar_url || 'https://example.com/default-avatar.png',
                  isNewConversation: false
                });
              }
            }
          } catch (error) {
            console.error('Error fetching conversation details:', error);
          }
        } else if (data.type === 'comment' && data.post_id) {
          // Handle post comment notification
          if (navigationRef.current) {
            if (isFan) {
              navigationRef.current.navigate('DMDetailPage', { 
                postId: data.post_id 
              });
            } else {
              navigationRef.current.navigate('PostDetailPage', { 
                postId: data.post_id 
              });
            }
          }
        }
      } catch (error) {
        console.error('Error handling notification click:', error);
      }
    },
    onNotificationReceived: (data: NotificationData) => {
      console.log('📨 Notification received:', data);
      // Handle notification received event if needed
    }
  });

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
        const [authToken, userData] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('userData')
        ]);

        if (authToken && userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            // Update Redux store with user data
            store.dispatch(setUserProfile(parsedUserData));
            
            // User is logged in, check permissions
            if (permissionsAccepted === 'true') {
              console.log('User logged in and permissions granted, proceeding to main app');
              // Navigate to appropriate stack based on role
              setInitialRoute(parsedUserData.data.role === 'ARTIST' ? 'ArtistStack' : 'FanStack');
            } else {
              console.log('User logged in but permissions not granted, showing permissions screen');
              setInitialRoute('PermissionsScreen');
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
            setInitialRoute('LoginPage');
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
      }
      setIsLoading(false);
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
    <NavigationContainer
      ref={navigationRef}
      initialState={initialState}
      onStateChange={(state) => {
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
      }}
      onReady={() => {
        if (navigationRef.current) {
          global.navigationRef = navigationRef;
          console.log('Navigation is ready, ref set');
        }
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
  );
};

// Main App component that wraps everything with Provider
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </QueryClientProvider>
  );
};

export default App;