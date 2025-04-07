import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASEURL } from '../constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import store from '../redux/store';
import { setAccessToken, setUserProfile } from '../redux/actions';

// Initialize Google Sign-In as soon as the module is imported
GoogleSignin.configure({
  iosClientId: '918802616844-2rkeh1hqa9jga6r90g0tpphqoocs0rm3.apps.googleusercontent.com',
  webClientId: '918802616844-2rkeh1hqa9jga6r90g0tpphqoocs0rm3.apps.googleusercontent.com',
  offlineAccess: true
});

// Handle Google Sign-In
export const handleGoogleSignIn = async () => {
  try {
    // Check if Google Play Services is available
    await GoogleSignin.hasPlayServices();

    // Sign in and get user info
    console.log('Starting Google Sign-In...');
    const signInResult = await GoogleSignin.signIn();
    console.log('Google Sign-In Result:', signInResult);

    if (!signInResult?.data?.idToken) {
      console.error('No ID token in response. Full response:', signInResult);
      throw new Error('Failed to get ID token from Google');
    }

    // Send Google ID token to backend
    console.log('Sending ID token to backend...', BASEURL);
    const response = await axios.post(`${BASEURL}/api/v1/auth/google`, {
      idToken: signInResult.data.idToken
    });

    console.log('Backend response:', response.data);

    // Validate response structure
    if (!response.data?.data?.access_token || !response.data?.data?.user) {
      console.error('Invalid response structure:', response.data);
      throw new Error('Invalid response from server');
    }

    // Extract user data and tokens from response
    const { access_token, refresh_token, expires_in, user } = response.data.data;

    // Store auth data in AsyncStorage
    try {
      await AsyncStorage.multiSet([
        ['authToken', access_token],
        ['refreshToken', refresh_token],
        ['tokenExpiry', (Date.now() + expires_in * 1000).toString()],
        ['userRole', user.role],
        ['userData', JSON.stringify(user)]
      ]);
      console.log('Auth data stored in AsyncStorage successfully');
    } catch (storageError) {
      console.error('Error storing auth data in AsyncStorage:', storageError);
      throw new Error('Failed to store authentication data');
    }

    // Store auth data in Redux
    try {
      store.dispatch(setAccessToken(access_token));
      store.dispatch(setUserProfile(user));
      console.log('Auth data stored in Redux successfully');
    } catch (reduxError) {
      console.error('Error storing auth data in Redux:', reduxError);
      throw new Error('Failed to update application state');
    }

    return {
      token: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      user
    };

  } catch (error) {
    console.error('Google Sign-In Error:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Backend Error Details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }

    // Handle specific error cases
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play services are not available');
    } else if (error.response?.status === 401) {
      // Handle authentication errors
      const message = error.response.data?.message || 'Authentication failed';
      throw new Error(`Authentication failed: ${message}`);
    } else if (error.response) {
      // Handle other backend errors
      const message = error.response.data?.message || 'Server error occurred';
      throw new Error(`Server error: ${message}`);
    } else {
      // Handle other errors
      throw new Error(`Sign in failed: ${error.message}`);
    }
  }
};

// Sign out
export const signOut = async () => {
  try {
    // Sign out from Google
    await GoogleSignin.signOut();
    
    // Clear all auth-related data
    await AsyncStorage.multiRemove([
      'authToken',
      'userRole',
      'userData',
      'fcmToken' // Also clear FCM token on sign out
    ]);

    console.log('Successfully signed out and cleared data');
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out properly');
  }
};

// Check if user is signed in
export const isSignedIn = async () => {
  try {
    const [isGoogleSignedIn, authToken] = await Promise.all([
      GoogleSignin.isSignedIn(),
      AsyncStorage.getItem('authToken')
    ]);

    return isGoogleSignedIn && !!authToken;
  } catch (error) {
    console.error('Error checking sign-in status:', error);
    return false;
  }
}; 