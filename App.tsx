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

// Add this after the imports
const PERSISTENCE_KEY = 'NAVIGATION_STATE';

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialState, setInitialState] = useState();
  const navigationRef = useRef<NavigationContainerRef<RootParamList>>(null);

  useEffect(() => {
    // Store navigation reference globally
    global.navigationRef = navigationRef;
  }, []);

  useEffect(() => {
    const checkAppSetupStatus = async () => {
      try {
        // Check if TOS and permissions are already accepted
        const [tosAccepted, permissionsAccepted, authToken, userRole, tokenExpiry, refreshToken] = await Promise.all([
          AsyncStorage.getItem('tosAccepted'),
          AsyncStorage.getItem('permissionsAccepted'),
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('userRole'),
          AsyncStorage.getItem('tokenExpiry'),
          AsyncStorage.getItem('refreshToken')
        ]);

        console.log('App initialization status:', {
          tosAccepted,
          permissionsAccepted,
          hasAuthToken: !!authToken,
          userRole,
          hasTokenExpiry: !!tokenExpiry,
          hasRefreshToken: !!refreshToken
        });

        // If user is authenticated, skip TOS and permissions screens
        if (authToken && userRole) {
          try {
            // Check if token is expired
            const isExpired = tokenExpiry && Date.now() > parseInt(tokenExpiry);
            
            if (isExpired && refreshToken) {
              // Attempt to refresh the token
              const response = await axios.post(`${BASEURL}/api/v1/auth/refresh`, {
                refresh_token: refreshToken
              });

              if (response.data?.data?.access_token) {
                // Store new tokens
                await AsyncStorage.multiSet([
                  ['authToken', response.data.data.access_token],
                  ['tokenExpiry', (Date.now() + response.data.data.expires_in * 1000).toString()]
                ]);

                // Update Redux store
                store.dispatch(setAccessToken(response.data.data.access_token));
                
                // Navigate to appropriate stack
                setInitialRoute(userRole === 'ARTIST' ? 'ArtistStack' : 'FanStack');
                setIsLoading(false);
                return;
              }
            }

            // Validate token by fetching user data
            console.log('Attempting to validate token with endpoint:', `${BASEURL}/api/v1/auth/me`);
            const response = await axios.post(`${BASEURL}/api/v1/auth/me`, {}, {
              headers: {
                Authorization: `Bearer ${authToken}`
              }
            });

            if (response.data?.data) {
              console.log('Token validation successful:', response.data);
              // Token is valid, update Redux store
              store.dispatch(setAccessToken(authToken));
              store.dispatch(setUserProfile(response.data.data));
              
              // Navigate to appropriate stack based on role
              setInitialRoute(userRole === 'ARTIST' ? 'ArtistStack' : 'FanStack');
              setIsLoading(false);
              return;
            }
          } catch (error: any) {
            console.error('Error validating token:', error);
            // If validation fails, try to refresh the token
            if (refreshToken) {
              console.log('Attempting token refresh after validation failure');
              try {
                const refreshResponse = await axios.post(`${BASEURL}/api/v1/auth/refresh`, {
                  refresh_token: refreshToken
                });

                if (refreshResponse.data?.data?.access_token) {
                  // Store new tokens
                  await AsyncStorage.multiSet([
                    ['authToken', refreshResponse.data.data.access_token],
                    ['tokenExpiry', (Date.now() + refreshResponse.data.data.expires_in * 1000).toString()]
                  ]);

                  // Update Redux store
                  store.dispatch(setAccessToken(refreshResponse.data.data.access_token));
                  setInitialRoute(userRole === 'ARTIST' ? 'ArtistStack' : 'FanStack');
                  setIsLoading(false);
                  return;
                }
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
              }
            }
            // If all auth attempts fail, clear storage but keep TOS and permissions status
            await clearAuthData();
          }
        }

        // Check TOS and permissions status
        if (tosAccepted === 'true' && permissionsAccepted === 'true') {
          console.log('TOS and permissions already accepted, going to login');
          setInitialRoute('LoginPage');
        } else if (tosAccepted === 'true') {
          // If TOS is accepted but permissions aren't, check if we actually need to show permissions
          const [locationPermission, notificationPermission] = await Promise.all([
            AsyncStorage.getItem('locationPermission'),
            AsyncStorage.getItem('notificationPermission')
          ]);
          
          console.log('Permission status:', {
            locationPermission,
            notificationPermission
          });

          if (locationPermission === 'true' && notificationPermission === 'true') {
            console.log('All permissions granted, marking as accepted');
            await AsyncStorage.setItem('permissionsAccepted', 'true');
            setInitialRoute('LoginPage');
          } else {
            console.log('Permissions not fully granted, showing permissions screen');
            setInitialRoute('PermissionsScreen');
          }
        } else {
          // If TOS is not accepted or is null, show TOS screen
          console.log('TOS not accepted or null, showing TOS screen');
          setInitialRoute('TermsAndPrivacyScreen');
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

      console.log('Auth data cleared, TOS and permissions status preserved:', {
        tosAccepted,
        permissionsAccepted
      });
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
      console.log('🔔 [App] FCM Token:', fcmToken);
      console.log('📱 [App] Device Platform:', Platform.OS);
      console.log('🔄 [App] FCM Token Length:', fcmToken.length);
      await AsyncStorage.setItem('fcmToken', fcmToken);
      console.log('✅ [App] FCM Token stored in AsyncStorage');
    } catch (error) {
      console.error('❌ [App] Error fetching FCM token:', error);
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
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer
          ref={navigationRef}
          initialState={initialState}
          onStateChange={(state) => {
            AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
          }}
          onReady={() => {
            // Ensure navigation ref is set when NavigationContainer is ready
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
    </Provider>
  );
};

export default App;
