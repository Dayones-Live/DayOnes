import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import Geolocation from '@react-native-community/geolocation';
import { useDispatch, useSelector } from 'react-redux';
import { setFcmToken, setLocation } from '../redux/actions'; // Replace with your actual import paths
import axios from 'axios'; // For sending the data to your backend
import { BASEURL } from '../constants'; // Replace with your actual BASEURL

const useSetupNotificationsAndLocation = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector(state => state.accessToken); // Assuming you have accessToken in Redux

  useEffect(() => {
    const setupNotificationsAndLocation = async () => {
      // Set FCM Token and send to endpoint
      try {
        await messaging().registerDeviceForRemoteMessages();
        const fcmToken = await messaging().getToken();
        dispatch(setFcmToken(fcmToken)); // Store in Redux
        console.log('FCM Token set:', fcmToken);

        // Send FCM Token to your backend
        await updateNotificationToken(accessToken, fcmToken);
      } catch (error) {
        console.error('Error fetching FCM Token:', error);
      }

      // Set Location and send to endpoint
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          dispatch(setLocation({ latitude, longitude })); // Store in Redux
          console.log('Location set:', { latitude, longitude });

          // Send location to your backend
          await updateLocation(accessToken, latitude, longitude);
        },
        (error) => {
          console.error('Error fetching location:', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    };

    setupNotificationsAndLocation();
  }, [dispatch, accessToken]);
};

// The functions for sending FCM Token and Location to the backend
const updateNotificationToken = async (token, notificationToken) => {
  try {
    const response = await axios.post(
      `${BASEURL}/api/v1/user-notification/token`,
      new URLSearchParams({ notificationToken }).toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
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
      new URLSearchParams({ latitude, longitude }).toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    console.log('Location updated successfully:', response.data);
  } catch (error) {
    console.error('Error updating location:', error);
    throw new Error('Failed to update location.');
  }
};

export default useSetupNotificationsAndLocation;
