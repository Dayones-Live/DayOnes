// hooks/useNotifications.js
import {useQuery} from '@tanstack/react-query';
import axios from 'axios';
import {BASEURL} from '../constants';
import {useSelector} from 'react-redux';

// Fetch notifications function
const fetchNotifications = async accessToken => {
  const response = await axios.get(`${BASEURL}/api/v1/notifications/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  return response;
};

// Custom hook for notifications
const useNotifications = () => {
  const accessToken = useSelector(state => state.accessToken);

  const response = useQuery({
    queryKey: ['useNotifications'],
    queryFn: async () => {
      try {
        if (!accessToken) {
          throw new Error('No access token available');
        }
        const notificationList = await fetchNotifications(accessToken);
        return notificationList; // Assuming this returns the notifications data
      } catch (error) {
        console.error('Notification fetch error:', error);
        throw error;
      }
    },
  });

  // Return the entire response object for use in components
  return response;
};

export default useNotifications;
