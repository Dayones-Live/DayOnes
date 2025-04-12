import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASEURL } from '../constants';
import { setAccessToken, setUserProfile } from '../redux/actions'; // Adjust the import path
import axiosInstance from '../../utils/axiosConfig';

export const fetchUserData = async () => {
  const response = await axiosInstance.post('/api/v1/auth/me');
  return response.data;
};

const useFetchUser = () => {
  const dispatch = useDispatch();
  const accessTokenFromRedux = useSelector((state) => state.accessToken);

  const getAccessToken = async () => {
    // Fetch the access token from Redux or AsyncStorage
    let accessToken = accessTokenFromRedux;
    if (!accessToken) {
      try {
        accessToken = await AsyncStorage.getItem('authToken');
        if (!accessToken) {
          throw new Error('Access token not found.');
        }
      } catch (error) {
        console.error('Error fetching access token from AsyncStorage:', error);
        throw error;
      }
    }
    return accessToken;
  };

  return useMutation(async () => {
    const accessToken = await getAccessToken();
    dispatch(setAccessToken(accessToken));
    const response = await fetchUserData(accessToken);
    
    // Format the user profile data consistently
    const userProfile = {
      data: response.data,
      role: response.data.role
    };
    
    // Store in Redux
    dispatch(setUserProfile(userProfile));
    
    // Also store in AsyncStorage for persistence
    await AsyncStorage.setItem('userData', JSON.stringify(userProfile));
    
    return response;
  }, {
    onSuccess: (data) => {
      console.log('User profile fetched and stored successfully:', data);
    },
    onError: (error) => {
      let errorMessage = 'An unexpected error occurred.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      console.error('Fetch user error:', error);
      Alert.alert('Fetch Error', errorMessage);
    },
  });
};

export default useFetchUser;
