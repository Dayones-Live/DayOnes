import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASEURL } from '../constants';
import { setAccessToken, setUserProfile } from '../redux/actions'; // Adjust the import path
import axiosInstance from '../../utils/axiosConfig';

export const fetchUserData = async () => {
  console.log('🔍 fetchUserData called');
  try {
    const response = await axiosInstance.post('/api/v1/auth/me');
    console.log('✅ fetchUserData successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ fetchUserData failed:', error);
    throw error;
  }
};

const useFetchUser = () => {
  const dispatch = useDispatch();
  const accessTokenFromRedux = useSelector((state) => state.accessToken);

  const getAccessToken = async () => {
    console.log('🔑 getAccessToken called');
    console.log('🔑 Access token from Redux:', !!accessTokenFromRedux);
    
    // Fetch the access token from Redux or AsyncStorage
    let accessToken = accessTokenFromRedux;
    if (!accessToken) {
      try {
        console.log('🔍 No token in Redux, checking AsyncStorage...');
        accessToken = await AsyncStorage.getItem('authToken');
        if (!accessToken) {
          console.error('❌ No access token found in AsyncStorage');
          throw new Error('Access token not found.');
        }
        console.log('✅ Access token found in AsyncStorage');
      } catch (error) {
        console.error('❌ Error fetching access token from AsyncStorage:', error);
        throw error;
      }
    } else {
      console.log('✅ Access token found in Redux');
    }
    
    console.log('🔑 Final access token length:', accessToken.length);
    return accessToken;
  };

  return useMutation(async () => {
    console.log('🚀 useFetchUser mutation started');
    
    const accessToken = await getAccessToken();
    console.log('🔑 Access token obtained, dispatching to Redux');
    dispatch(setAccessToken(accessToken));
    
    console.log('📡 Calling fetchUserData...');
    const response = await fetchUserData(accessToken);
    console.log('📦 User data response received:', response);
    
    // Format the user profile data consistently
    const userProfile = {
      data: response.data,
      role: response.data.role
    };
    console.log('👤 Formatted user profile:', userProfile);
    
    // Store in Redux
    console.log('🔄 Dispatching user profile to Redux...');
    dispatch(setUserProfile(userProfile));
    
    // Also store in AsyncStorage for persistence
    console.log('💾 Storing user profile in AsyncStorage...');
    await AsyncStorage.setItem('userData', JSON.stringify(userProfile));
    console.log('✅ User profile stored in AsyncStorage');
    
    return response;
  }, {
    onSuccess: (data) => {
      console.log('🎉 useFetchUser onSuccess - User profile fetched and stored successfully:', data);
    },
    onError: (error) => {
      console.error('❌ useFetchUser onError - Fetch user error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      let errorMessage = 'An unexpected error occurred.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Fetch Error', errorMessage);
    },
  });
};

export default useFetchUser;
