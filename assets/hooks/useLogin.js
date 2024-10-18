import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setAccessToken, setUserID } from '../redux/actions';
import { Alert } from 'react-native';
import { BASEURL } from '../constants';
import useFetchUser from './useFetchUser'; // Import useFetchUser

const loginUser = async ({ email, password }) => {
  console.log('loginUser called with:', { email, password });

  try {
    const response = await axios.post(`${BASEURL}/api/v1/auth/signin`, {
      username: email,
      password,
    });
    console.log('API response:', response.data);

    const token = response.data?.data?.access_token;
    const userID = response.data?.data?.user?.id;
    const fullName = response.data?.data?.user?.full_name;
    console.log('Extracted values:', { token, userID, fullName });

    if (typeof token === 'string' && typeof userID === 'string') {
      return { token, userID, fullName };
    } else {
      throw new Error('Access token or User ID not found');
    }
  } catch (error) {
    console.log('Error in loginUser:', error);
    throw error.response ? error.response.data.message : 'Network error. Please check your connection.';
  }
};

const useLogin = () => {
  const dispatch = useDispatch();
  const { mutate: fetchUser } = useFetchUser(); // Destructure mutate function from useFetchUser

  return useMutation(loginUser, {
    onSuccess: async (data) => {
      const { token, userID, fullName } = data;
      console.log('Login successful. Access Token:', token);

      dispatch(setAccessToken(token));
      dispatch(setUserID(userID));
      Alert.alert('Login Successful', `Welcome back, ${fullName || 'User'}!`);

      try {
        // Fetch user profile immediately after login
        fetchUser();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        Alert.alert('Error', 'Could not fetch user profile.');
      }
    },
    onError: (error) => {
      console.log('Login error:', error);
      let errorMessage = error.message || 'An unexpected error occurred.';
      Alert.alert('Login Error', errorMessage);
    },
  });
};

export default useLogin;
