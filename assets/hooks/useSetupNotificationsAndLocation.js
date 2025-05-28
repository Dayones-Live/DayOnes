import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import Geolocation from '@react-native-community/geolocation';
import {useDispatch, useSelector} from 'react-redux';
import {setFcmToken, setLocation} from '../redux/actions'; // Replace with your actual import paths
import axios from 'axios'; // For sending the data to your backend
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASEURL} from '../constants'; // Replace with your actual BASEURL
import {Alert} from 'react-native';
import {PERMISSIONS} from 'react-native-permissions';
import axiosInstance from '../../utils/axiosConfig';
import {Platform} from 'react-native';
import useRefreshFCMToken from './useRefreshFCMToken';

const useSetupNotificationsAndLocation = () => {
  const dispatch = useDispatch();
  const accessTokenFromRedux = useSelector(state => state.accessToken); // Try to get accessToken from Redux
  const { refreshFCMToken } = useRefreshFCMToken();

  useEffect(() => {
    const setupNotificationsAndLocation = async () => {
      try {
        console.log('🚀 Starting notification setup...');
        
        // Fetch access token from Redux or AsyncStorage
        let accessToken = accessTokenFromRedux;

        if (!accessToken) {
          accessToken = await AsyncStorage.getItem('authToken');
          console.log('🔑 Access token from storage:', accessToken ? 'Found' : 'Not found');
          if (!accessToken) {
            console.error('❌ Access token not found in Redux or AsyncStorage.');
            return;
          }
        }

        // Check if we have permission
        const authStatus = await messaging().requestPermission();
        console.log('📱 Notification permission status:', authStatus);
        
        if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
          console.log('✅ Notification permission granted');
          
          // Use the refreshFCMToken function to handle token refresh
          try {
            await refreshFCMToken();
            console.log('✅ FCM token refresh completed');
          } catch (error) {
            console.error('❌ Error refreshing FCM token:', error);
          }
        } else {
          console.log('❌ Notification permission not granted:', authStatus);
        }

        // Setup location
        try {
          const locationPermission = await PERMISSIONS.REQUEST_LOCATION_PERMISSION();
          if (locationPermission === 'granted') {
            Geolocation.getCurrentPosition(
              position => {
                const {latitude, longitude} = position.coords;
                dispatch(setLocation({latitude, longitude}));
                console.log('📍 Location updated:', {latitude, longitude});
              },
              error => console.error('❌ Location error:', error),
              {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000}
            );
          }
        } catch (error) {
          console.error('❌ Location permission error:', error);
        }
      } catch (error) {
        console.error('❌ Setup error:', error);
      }
    };

    setupNotificationsAndLocation();
  }, [accessTokenFromRedux, dispatch, refreshFCMToken]);

  return null;
};

// The functions for sending FCM Token and Location to the backend
const updateNotificationToken = async (fcmToken) => {
  return await axiosInstance.post('/api/v1/user-notification/token', 
    new URLSearchParams({notificationToken: fcmToken}).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }
  );
};

const updateLocation = async (token, latitude, longitude) => {
  try {
    const response = await axios.post(
      `${BASEURL}/api/v1/user/update-location`,
      new URLSearchParams({latitude, longitude}).toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    console.log('Location updated successfully:', response.data);
  } catch (error) {
    console.error('Error updating location:', error);
    throw new Error('Failed to update location.');
  }
};

export default useSetupNotificationsAndLocation;
