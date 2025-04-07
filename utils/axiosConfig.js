import axios from 'axios';
import { BASEURL } from '../assets/constants';
import store from '../assets/redux/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAccessToken, setUserProfile, setUserID } from '../assets/redux/actions';
import { Alert } from 'react-native';

const axiosInstance = axios.create({
  baseURL: BASEURL
});

// Request interceptor - adds token to requests
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Get token from Redux store first
      let token = store.getState().accessToken;

      // If no token in Redux, try AsyncStorage
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
        if (token) {
          // If found in AsyncStorage, update Redux
          store.dispatch(setAccessToken(token));
        }
      }

      console.log('Request Interceptor - Token status:', {
        hasToken: !!token,
        url: config.url,
        method: config.method
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.error('No access token found in Redux store or AsyncStorage');
      }
    } catch (error) {
      console.error('Error setting auth header:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles 401 by cleaning up and redirecting to login
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('Axios Interceptor - Error caught:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method
    });

    if (error.response?.status === 401) {
      console.log('401 Error detected - Starting cleanup process');
      
      try {
        // Clear Redux store
        store.dispatch(setAccessToken(null));
        store.dispatch(setUserProfile(null));
        store.dispatch(setUserID(null));

        // Clear AsyncStorage
        await AsyncStorage.multiRemove([
          'authToken',
          'userProfile',
          'userRole',
          'loggedInUser'
        ]);
        
        console.log('Auth data cleared from Redux and AsyncStorage');

        // Show alert to user
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to login after user acknowledges
                const navigation = global.navigationRef?.current;
                if (navigation) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'LoginPage' }],
                  });
                  console.log('Navigation reset successful');
                } else {
                  console.error('No navigation object available');
                }
              }
            }
          ]
        );

      } catch (cleanupError) {
        console.error('Error during auth cleanup:', cleanupError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 