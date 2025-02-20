import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import DMsScreen from './screens/DMsScreen';
import ConversationThread from './screens/ConversationThread';
import PostDetailPage from './screens/artist/PostDetailsPage';
import VerifyAccount from './screens/VerifyAccount';
import DayOnesScreen from './screens/fan/DayOnesScreen';
import DMDetailPage from './screens/fan/DMDetailPage';
import SuperAdminDashboard from './screens/superadmin/SuperAdminDashboard';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    SplashScreen.hide();
    getFCMToken(); // Fetch FCM token on app start
    checkAppSetupStatus();
  }, []);

  // Function to get FCM token
  const getFCMToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);
      // Optionally store the token in AsyncStorage or send it to your backend
      await AsyncStorage.setItem('fcmToken', fcmToken);
    } catch (error) {
      console.error('Error fetching FCM token:', error);
    }
  };

  const checkAppSetupStatus = async () => {
    try {
      const termsAccepted = await AsyncStorage.getItem('termsAccepted');
      const permissionsGranted = await AsyncStorage.getItem('permissionsGranted');
      const authToken = await AsyncStorage.getItem('authToken');
      const userRole = await AsyncStorage.getItem('userRole');

      // Add debugging logs
      console.log('App Setup Status:', {
        termsAccepted,
        permissionsGranted,
        hasAuthToken: !!authToken,
        userRole
      });

      if (authToken && userRole) {
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
      setInitialRoute('TermsAndPrivacyScreen');
    }
  };

  // Add this function to handle logout
  const handleLogout = async () => {
    try {
      // Save terms and permissions status
      const termsAccepted = await AsyncStorage.getItem('termsAccepted');
      const permissionsGranted = await AsyncStorage.getItem('permissionsGranted');
      
      // Clear all AsyncStorage
      await AsyncStorage.clear();
      
      // Restore only terms and permissions
      await AsyncStorage.setItem('termsAccepted', termsAccepted || 'false');
      await AsyncStorage.setItem('permissionsGranted', permissionsGranted || 'false');
      
      // Clear any stored user data
      await AsyncStorage.removeItem('loggedInUser');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userRole');
      
      // Navigate to login
      setInitialRoute('LoginPage');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (initialRoute === null) return null;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
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
