import axios from 'axios';
import { BASEURL } from '../assets/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
  baseURL: BASEURL
});

// Response interceptor - only handles 401 by redirecting to login
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('Axios Interceptor - Error caught:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method
    });

    if (error.response?.status === 401) {
      console.log('401 Error detected - Attempting navigation');
      const navigation = global.navigationRef?.current;
      
      console.log('Navigation ref status:', {
        exists: !!navigation,
        methods: navigation ? Object.keys(navigation) : 'No navigation',
        globalRef: !!global.navigationRef
      });

      if (navigation) {
        try {
          console.log('Attempting to reset navigation to LoginPage');
          navigation.reset({
            index: 0,
            routes: [{ name: 'LoginPage' }],
          });
          console.log('Navigation reset successful');
        } catch (navError) {
          console.error('Navigation reset failed:', navError);
        }
      } else {
        console.error('No navigation object available');
      }
    }
    return Promise.reject(error);
  }
);

// Request interceptor - adds token to requests
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Request Interceptor - Token status:', {
        hasToken: !!token,
        url: config.url,
        method: config.method
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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

export default axiosInstance; 