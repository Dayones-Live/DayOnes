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

const useSetupNotificationsAndLocation = () => {
  const dispatch = useDispatch();
  const accessTokenFromRedux = useSelector(state => state.accessToken); // Try to get accessToken from Redux

  useEffect(() => {
    const setupNotificationsAndLocation = async () => {
      try {
        // Fetch access token from Redux or AsyncStorage
        let accessToken = accessTokenFromRedux;

        console.log(accessToken);
        if (!accessToken) {
          accessToken = await AsyncStorage.getItem('authToken');
          console.log(
            '🚀 ~ setupNotificationsAndLocation ~ accessToken:',
            accessToken,
          );
          if (!accessToken) {
            console.error('Access token not found in Redux or AsyncStorage.');
            return; // Stop execution if no token is found
          }
        }

        // Set FCM Token and send to backend
        await messaging().registerDeviceForRemoteMessages();
        const fcmToken = await messaging().getToken();
        // Alert.alert(`${fcmToken}`);
        // console.log('🚀 ~ setupNotificationsAndLocation ~ fcmToken:', fcmToken);
        dispatch(setFcmToken(fcmToken)); // Store in Redux
        // console.log('FCM Token set:', fcmToken);

        // Send FCM Token to your backend
        await updateNotificationToken(accessToken, fcmToken);

        // Set Location and send to backend
        Geolocation.getCurrentPosition(
          async position => {
            const {latitude, longitude} = position.coords;
            dispatch(setLocation({latitude, longitude})); // Store in Redux
            console.log('Location set:', {latitude, longitude});

            // Send location to your backend
            await updateLocation(accessToken, latitude, longitude);
          },
          error => {
            console.error('Error fetching location:', error);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      } catch (error) {
        console.error('Error setting up notifications and location:', error);
      }
    };

    setupNotificationsAndLocation();
  }, [dispatch, accessTokenFromRedux]);
};

// The functions for sending FCM Token and Location to the backend
const updateNotificationToken = async (token, notificationToken) => {
  try {
    const response = await axios.post(
      `${BASEURL}/api/v1/user-notification/token`,
      new URLSearchParams({notificationToken}).toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    console.log('Notification token updated successfully:', response.data);
  } catch (error) {
    console.error('Error updating notification token:', error);
    throw new Error('Failed to update notification token.');
  }
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
