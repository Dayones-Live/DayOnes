import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setAccessToken, setUserID, setUserProfile } from '../redux/actions';
import { Alert } from 'react-native';
import { BASEURL } from '../constants';
import useFetchUser from './useFetchUser';

const loginUser = async ({ email, password }) => {
  console.log('loginUser called with:', { email, password });

  // Validate inputs
  if (!email || !password) {
    throw new Error('Validation Error: Both username and password are required.');
  }

  try {
    const response = await axios.post(`${BASEURL}/api/v1/auth/signin`, {
      username: email,
      password,
    });
    console.log('API response:', response.data);

    const token = response.data?.data?.access_token;
    const userID = response.data?.data?.user?.id;
    const fullName = response.data?.data?.user?.full_name;
    const userProfile = response.data?.data?.user;

    if (typeof token === 'string' && typeof userID === 'string') {
      return { token, userID, fullName, userProfile };
    } else {
      throw new Error('Access token or User ID not found');
    }
  } catch (error) {
    console.error('Error in loginUser:', error);
    if (error.response) {
      // Extract the error message from the API response
      throw new Error(error.response.data?.message || 'Login failed. Please try again.');
    } else {
      throw new Error('Network error. Please check your connection.');
    }
  }
};


const useLogin = () => {
  const dispatch = useDispatch();
  const { mutate: fetchUser } = useFetchUser();

  return useMutation(loginUser, {
    onSuccess: async (data) => {
      const { token, userID, fullName, userProfile } = data;
      console.log('Login successful. Access Token:', token);

      // Dispatch to Redux
      dispatch(setAccessToken(token));
      dispatch(setUserID(userID));
      dispatch(setUserProfile(userProfile));

      Alert.alert('Login Successful', `Welcome back, ${fullName || 'User'}!`);

      try {
        fetchUser();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        Alert.alert('Error', 'Could not fetch user profile.');
      }
    },
    onError: (error) => {
      console.error('Login error:', error.message);

      // Handle deleted user specifically
      if (error.message.includes('User is deleted')) {
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
      Alert.alert('Login Error', error.message || 'An unexpected error occurred.');
    },
  });
};

export default useLogin;
