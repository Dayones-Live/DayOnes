// hooks/useNotifications.js
import {useQuery} from '@tanstack/react-query';
import axios from 'axios';
import {BASEURL} from '../constants';
import {useSelector} from 'react-redux';

// Fetch notifications function
const fetchNotifications = async accessToken => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    

    // Ensure we have the correct data structure
    const notifications = response.data?.data || response.data || [];
    
    // Transform the data to match expected structure
    return {
      data: {
        data: Array.isArray(notifications) ? notifications : []
      }
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: { data: [] } };
  }
};

// Custom hook for notifications
const useNotifications = () => {
  const accessToken = useSelector(state => state.accessToken);

  return useQuery(
    ['notifications', accessToken],
    () => fetchNotifications(accessToken),
    {
      enabled: !!accessToken,
      // Add these options for better real-time behavior
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0, // Consider data immediately stale
      // Add retry and error handling
      retry: 3,
      retryDelay: 1000,
      // Don't cache the data between component mounts
      cacheTime: 1000 * 60 * 5, // Cache for 5 minutes
      // Always refetch on mount
      refetchOnMount: 'always',
      // Log any errors
      onError: (error) => {
        console.error('Notifications query error:', error);
      },
      // Log successful fetches
      onSuccess: (data) => {
        console.log('Notifications fetched successfully:', {
          count: data?.data?.data?.length || 0,
          unreadCount: data?.data?.data?.filter(n => !n.is_read).length || 0
        });
      }
    }
  );
};

export default useNotifications;
