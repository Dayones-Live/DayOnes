import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASEURL } from '../constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import store from '../redux/store';
import { setAccessToken, setUserProfile } from '../redux/actions';
import { decode } from 'base-64';
import { CommonActions } from '@react-navigation/native';

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

    // Get additional user info
    const userInfo = await GoogleSignin.getCurrentUser();
    const userData = {
      idToken: signInResult.data.idToken,
      email: userInfo.user.email,
      name: userInfo.user.name,
      photo: userInfo.user.photo,
      createIfNotExists: true // Flag to indicate we want to create user if not exists
    };

    // Send Google ID token to backend
    console.log('Sending ID token to backend...', BASEURL);
    const response = await axios.post(`${BASEURL}/api/v1/auth/google`, userData);

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

// Handle Apple Sign-In
export const handleAppleSignIn = async () => {
  try {
    console.log('=== Starting Apple Sign-In Process ===');
    console.log('1. Initiating Apple Sign-In request...');
    
    // Perform the Apple Sign-In request
    const appleAuthResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    console.log('2. Apple Sign-In Response Received:');
    console.log('Full Apple Response:', JSON.stringify(appleAuthResponse, null, 2));
    console.log('Identity Token Present:', !!appleAuthResponse.identityToken);
    console.log('Email Present:', !!appleAuthResponse.email);
    console.log('Full Name Present:', !!appleAuthResponse.fullName);
    
    // Add detailed logging for Apple's response
    console.log('Apple Sign-In Response Details:');
    console.log('- Identity Token Length:', appleAuthResponse.identityToken?.length || 0);
    console.log('- Email:', appleAuthResponse.email || 'Not provided (this is normal for subsequent sign-ins)');
    console.log('- Full Name Object:', appleAuthResponse.fullName ? JSON.stringify(appleAuthResponse.fullName, null, 2) : 'Not provided (this is normal for subsequent sign-ins)');
    console.log('- Real User Status:', appleAuthResponse.realUserStatus);
    console.log('- User ID:', appleAuthResponse.user);
    console.log('- Authorization Code Present:', !!appleAuthResponse.authorizationCode);
    console.log('- Authorization Code Length:', appleAuthResponse.authorizationCode?.length || 0);

    if (!appleAuthResponse.identityToken) {
      console.error('3. ERROR: No identity token in response');
      console.error('Full response:', JSON.stringify(appleAuthResponse, null, 2));
      throw new Error('Failed to get identity token from Apple');
    }

    // Extract email from identity token
    console.log('4. Extracting email from identity token...');
    const tokenParts = appleAuthResponse.identityToken.split('.');
    const tokenPayload = JSON.parse(decode(tokenParts[1]));
    console.log('Token Payload:', JSON.stringify(tokenPayload, null, 2));
    
    const emailFromToken = tokenPayload.email;
    console.log('Email from token:', emailFromToken);

    // Format the name according to Cognito's requirements
    console.log('5. Formatting name for Cognito...');
    const formattedName = appleAuthResponse.fullName ? 
      `${appleAuthResponse.fullName.givenName || ''} ${appleAuthResponse.fullName.familyName || ''}`.trim() : 
      '';
    
    console.log('Name Components:');
    console.log('- Given Name:', appleAuthResponse.fullName?.givenName || 'Not provided');
    console.log('- Family Name:', appleAuthResponse.fullName?.familyName || 'Not provided');
    console.log('- Formatted Name:', formattedName || 'Not provided');

    // Get the user's email and name
    const userData = {
      idToken: appleAuthResponse.identityToken,
      email: emailFromToken,
      name: formattedName,
      createIfNotExists: true
    };

    console.log('6. Prepared User Data for Backend:');
    console.log(JSON.stringify(userData, null, 2));

    // Send Apple ID token to backend
    console.log('7. Sending request to backend...');
    console.log('Backend URL:', `${BASEURL}/api/v1/auth/apple`);
    
    const response = await axios.post(`${BASEURL}/api/v1/auth/apple`, userData);
    
    console.log('8. Backend Response Received:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    // Validate response structure
    if (!response.data?.data?.access_token || !response.data?.data?.user) {
      console.error('9. ERROR: Invalid response structure from backend');
      console.error('Response:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response from server');
    }

    // Extract user data and tokens from response
    const { access_token, refresh_token, expires_in, user } = response.data.data;
    
    console.log('10. Extracted Auth Data:');
    console.log('- Access Token Present:', !!access_token);
    console.log('- Refresh Token Present:', !!refresh_token);
    console.log('- Expires In:', expires_in);
    console.log('- User Data:', JSON.stringify(user, null, 2));

    // Store auth data in AsyncStorage
    console.log('11. Storing auth data in AsyncStorage...');
    try {
      await AsyncStorage.multiSet([
        ['authToken', access_token],
        ['refreshToken', refresh_token],
        ['tokenExpiry', (Date.now() + expires_in * 1000).toString()],
        ['userRole', user.role],
        ['userData', JSON.stringify(user)]
      ]);
      console.log('12. Successfully stored auth data in AsyncStorage');
    } catch (storageError) {
      console.error('13. ERROR: Failed to store auth data in AsyncStorage');
      console.error('Storage Error:', storageError);
      throw new Error('Failed to store authentication data');
    }

    // Store auth data in Redux
    console.log('14. Updating Redux store...');
    try {
      store.dispatch(setAccessToken(access_token));
      store.dispatch(setUserProfile(user));
      console.log('15. Successfully updated Redux store');
    } catch (reduxError) {
      console.error('16. ERROR: Failed to update Redux store');
      console.error('Redux Error:', reduxError);
      throw new Error('Failed to update application state');
    }

    console.log('=== Apple Sign-In Process Completed Successfully ===');
    
    return {
      token: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      user
    };

  } catch (error) {
    console.error('=== Apple Sign-In Process Failed ===');
    console.error('Error Details:', error);
    
    if (error.response) {
      console.error('Backend Error Response:');
      console.error('- Status:', error.response.status);
      console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      console.error('- Headers:', error.response.headers);
    }
    
    if (error.code === appleAuth.Error.CANCELED) {
      console.error('User cancelled the sign-in process');
      throw new Error('Sign in was cancelled');
    } else if (error.response?.status === 401) {
      console.error('Authentication failed with backend');
      const message = error.response.data?.message || 'Authentication failed';
      throw new Error(`Authentication failed: ${message}`);
    } else if (error.response) {
      console.error('Backend returned an error');
      const message = error.response.data?.message || 'Server error occurred';
      throw new Error(`Server error: ${message}`);
    } else {
      console.error('Unexpected error during sign-in');
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