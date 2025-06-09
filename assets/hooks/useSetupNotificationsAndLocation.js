import {useEffect} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {useDispatch, useSelector} from 'react-redux';
import {setLocation} from '../redux/actions';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASEURL} from '../constants';
import {Alert} from 'react-native';
import {PERMISSIONS} from 'react-native-permissions';
import axiosInstance from '../../utils/axiosConfig';
import {Platform} from 'react-native';
import {request, RESULTS} from 'react-native-permissions';
import { OneSignal } from 'react-native-onesignal';
import notificationService from '../services/notificationService';

const useSetupNotificationsAndLocation = () => {
  const dispatch = useDispatch();
  const accessTokenFromRedux = useSelector(state => state.accessToken);
  const userProfile = useSelector(state => state.userProfile);

  useEffect(() => {
    const setupNotificationsAndLocation = async () => {
      try {
        console.log('🚀 Starting notification setup...');
        
        // Check if user is authenticated
        if (!userProfile?.data?.id) {
          console.log('⚠️ User not authenticated, skipping notification setup');
          return;
        }

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

        // Initialize notification service
        await notificationService.initialize();

        // Get the OneSignal push subscription ID
        const pushSubscription = OneSignal.User.pushSubscription;
        const [id, token] = await Promise.all([
          pushSubscription.getIdAsync(),
          pushSubscription.getTokenAsync()
        ]);

        if (!id || !token) {
          console.log('⚠️ No push subscription details available');
          return;
        }

        console.log('✅ OneSignal push subscription verified:', {
          id,
          token,
          platform: Platform.OS
        });

        // Request location permission
        const locationPermission = Platform.select({
          ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
          android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        });

        if (locationPermission) {
          const result = await request(locationPermission);
          if (result === RESULTS.GRANTED) {
            Geolocation.getCurrentPosition(
              position => {
                dispatch(setLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }));
              },
              error => console.error('Location error:', error),
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
          }
        }
      } catch (error) {
        console.error('Error in setupNotificationsAndLocation:', error);
      }
    };

    setupNotificationsAndLocation();
  }, [dispatch, accessTokenFromRedux, userProfile]);

  return null;
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
