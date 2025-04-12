import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setAccessToken, setUserID, setUserProfile } from '../redux/actions';
import { Alert } from 'react-native';
import { BASEURL } from '../constants';
import useFetchUser from './useFetchUser';
import AsyncStorage from '@react-native-async-storage/async-storage';

const loginUser = async ({ email, password }) => {
  console.log('🔑 [Login] Starting login process for email:', email);
  console.log('🔑 [Login] Using BASEURL:', BASEURL);

  // Validate inputs
  if (!email || !password) {
    console.error('❌ [Login] Validation Error: Missing email or password');
    throw new Error('Validation Error: Both username and password are required.');
  }

  try {
    console.log('🔑 [Login] Making API request to:', `${BASEURL}/api/v1/auth/signin`);
    const response = await axios.post(`${BASEURL}/api/v1/auth/signin`, {
      username: email,
      password,
    });
    console.log('✅ [Login] API response received:', JSON.stringify(response.data, null, 2));

    const token = response.data?.data?.access_token;
    const refreshToken = response.data?.data?.refresh_token;
    const expiresIn = response.data?.data?.expires_in;
    const userID = response.data?.data?.user?.id;
    const fullName = response.data?.data?.user?.full_name;
    const userProfile = response.data?.data?.user;

    if (typeof token === 'string' && typeof userID === 'string') {
      console.log('✅ [Login] Valid token and userID received');
      return { token, refreshToken, expiresIn, userID, fullName, userProfile };
    } else {
      console.error('❌ [Login] Invalid token or userID in response');
      throw new Error('Access token or User ID not found');
    }
  } catch (error) {
    console.error('❌ [Login] Error in loginUser:', error);
    if (error.response) {
      console.error('❌ [Login] API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(error.response.data?.message || 'Login failed. Please try again.');
    } else {
      console.error('❌ [Login] Network Error:', error.message);
      throw new Error('Network error. Please check your connection.');
    }
  }
};

const useLogin = () => {
  const dispatch = useDispatch();
  const { mutate: fetchUser } = useFetchUser();

  return useMutation(loginUser, {
    onSuccess: async (data) => {
      const { token, refreshToken, expiresIn, userID, fullName, userProfile } = data;
      console.log('✅ [Login] Login successful. Storing auth data...');

      try {
        // Store auth data in AsyncStorage
        console.log('💾 [Login] Storing auth data in AsyncStorage...');
        await AsyncStorage.multiSet([
          ['authToken', token],
          ['refreshToken', refreshToken],
          ['tokenExpiry', (Date.now() + expiresIn * 1000).toString()],
          ['userRole', userProfile.role],
          ['userData', JSON.stringify(userProfile)]
        ]);
        console.log('✅ [Login] Auth data stored in AsyncStorage successfully');

        // Dispatch to Redux
        console.log('🔄 [Login] Updating Redux store...');
        dispatch(setAccessToken(token));
        dispatch(setUserID(userID));
        dispatch(setUserProfile(userProfile));
        console.log('✅ [Login] Redux store updated successfully');

        Alert.alert('Login Successful', `Welcome back, ${fullName || 'User'}!`);

        try {
          console.log('👤 [Login] Fetching user profile...');
          fetchUser();
        } catch (error) {
          console.error('❌ [Login] Failed to fetch user profile:', error);
          Alert.alert('Error', 'Could not fetch user profile.');
        }
      } catch (error) {
        console.error('❌ [Login] Error storing auth data:', error);
        Alert.alert('Error', 'Failed to store authentication data.');
      }
    },
    onError: (error) => {
      console.error('❌ [Login] Login error:', error.message);

      // Handle deleted user specifically
      if (error.message.includes('User is deleted')) {
        console.log('❌ [Login] User account has been deleted');
        // Clear Redux state
        dispatch(setAccessToken(null));
        dispatch(setUserProfile(null));
        dispatch(setUserID(null));

        Alert.alert(
          'Login Error',
          'Your account has been deleted. Please contact support if you believe this is a mistake.'
        );
        return;
      }

      // Handle other errors
      console.error('❌ [Login] General login error:', error);
      Alert.alert('Login Error', error.message || 'An unexpected error occurred.');
    },
  });
};

export default useLogin;
