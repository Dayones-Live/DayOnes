import { useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationClickEvent, NotificationWillDisplayEvent } from 'react-native-onesignal';

interface UseNotificationsOptions {
  onNotificationClick?: (data: any) => void;
  onNotificationReceived?: (data: any) => void;
}

const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { onNotificationClick, onNotificationReceived } = options;

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Set up event listeners
    if (onNotificationClick) {
      notificationService.on('notificationClick', onNotificationClick);
    }

    if (onNotificationReceived) {
      notificationService.on('notificationReceived', onNotificationReceived);
    }

    // Cleanup
    return () => {
      if (onNotificationClick) {
        notificationService.off('notificationClick');
      }
      if (onNotificationReceived) {
        notificationService.off('notificationReceived');
      }
      notificationService.cleanup();
    };
  }, [onNotificationClick, onNotificationReceived]);

  const requestPermissions = useCallback(async () => {
    return await notificationService.requestPermissions();
  }, []);

  const unregister = useCallback(async () => {
    await notificationService.unregister();
  }, []);

  return {
    requestPermissions,
    unregister,
  };
};

export default useNotifications; 