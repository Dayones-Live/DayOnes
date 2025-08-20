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
    console.log('🚀 Request Interceptor - Request started:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });
    
    try {
      // Get token from Redux store first
      let token = store.getState().accessToken;
      console.log('🔑 Token from Redux:', !!token);

      // If no token in Redux, try AsyncStorage
      if (!token) {
        console.log('🔍 No token in Redux, checking AsyncStorage...');
        token = await AsyncStorage.getItem('authToken');
        if (token) {
          console.log('✅ Token found in AsyncStorage, updating Redux');
          // If found in AsyncStorage, update Redux
          store.dispatch(setAccessToken(token));
        } else {
          console.log('❌ No token found in AsyncStorage either');
        }
      }

      // Check token expiration
      const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        console.log('⏰ Token expired, attempting refresh');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          try {
            console.log('🔄 Attempting token refresh...');
            const response = await axios.post(`${BASEURL}/api/v1/auth/refresh`, {
              refresh_token: refreshToken
            });

            if (response.data?.data?.access_token) {
              console.log('✅ Token refresh successful');
              token = response.data.data.access_token;
              await AsyncStorage.multiSet([
                ['authToken', token],
                ['tokenExpiry', (Date.now() + response.data.data.expires_in * 1000).toString()]
              ]);
              store.dispatch(setAccessToken(token));
            } else {
              console.error('❌ Invalid refresh token response');
              throw new Error('Invalid refresh token response');
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            await clearAuthData();
            throw refreshError;
          }
        } else {
          console.log('❌ No refresh token available');
        }
      }

      console.log('🔑 Request Interceptor - Final token status:', {
        hasToken: !!token,
        url: config.url,
        method: config.method,
        tokenLength: token ? token.length : 0
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header set');
      } else {
        console.error('❌ No access token found in Redux store or AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles 401 by cleaning up and redirecting to login
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Response Interceptor - Success:', {
      status: response.status,
      url: response.config?.url,
      method: response.config?.method,
      dataKeys: response.data ? Object.keys(response.data) : 'No data'
    });
    return response;
  },
  async (error) => {
    console.log('❌ Response Interceptor - Error caught:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      responseData: error.response?.data
    });

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔐 401 Error detected - Attempting token refresh');
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        console.log('🔄 Refresh token available:', !!refreshToken);
        
        if (refreshToken) {
          // Attempt to refresh the token
          console.log('🔄 Making refresh token request...');
          const response = await axios.post(`${BASEURL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
          });

          if (response.data?.data?.access_token) {
            console.log('✅ Token refresh successful, updating storage...');
            // Store new tokens
            await AsyncStorage.multiSet([
              ['authToken', response.data.data.access_token],
              ['tokenExpiry', (Date.now() + response.data.data.expires_in * 1000).toString()]
            ]);

            // Get existing user data to maintain role
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
              const parsedUserData = JSON.parse(userData);
              console.log('👤 Maintaining user data during token refresh');
              // Update Redux store with existing user data
              store.dispatch(setUserProfile(parsedUserData));
            }

            // Update Redux store with new token
            store.dispatch(setAccessToken(response.data.data.access_token));

            // Retry the original request with new token
            console.log('🔄 Retrying original request with new token...');
            originalRequest.headers.Authorization = `Bearer ${response.data.data.access_token}`;
            return axiosInstance(originalRequest);
          } else {
            console.error('❌ Invalid refresh response format');
          }
        }

        // If refresh fails or no refresh token, clear auth data
        console.log('❌ Token refresh failed - Starting cleanup process');
        await clearAuthData();
        throw error;
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        await clearAuthData();
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

const clearAuthData = async () => {
  console.log('🧹 clearAuthData called - Starting cleanup process');
  try {
    // Clear Redux store
    console.log('🔄 Clearing Redux store...');
    store.dispatch(setAccessToken(null));
    store.dispatch(setUserProfile(null));
    store.dispatch(setUserID(null));

    // Clear AsyncStorage
    console.log('🗑️ Clearing AsyncStorage...');
    await AsyncStorage.multiRemove([
      'authToken',
      'refreshToken',
      'tokenExpiry',
      'userProfile',
      'userRole',
      'userData',
      'loggedInUser'
    ]);
    
    console.log('✅ Auth data cleared from Redux and AsyncStorage');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

export default axiosInstance; 