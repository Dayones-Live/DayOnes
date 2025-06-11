import { OneSignal, NotificationClickEvent, NotificationWillDisplayEvent, PushSubscriptionChangedState } from 'react-native-onesignal';
import { Platform, AppState } from 'react-native';
import axiosInstance from '../../utils/axiosConfig';
import { BASEURL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface PushSubscription {
  id: string;
  token: string;
  optIn: boolean;
  deviceType: string;
}

interface DeviceRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    oneSignalPlayerId: string;
    deviceType: string;
    deviceToken: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
  };
}

interface NotificationData {
  type: string;
  conversationId?: string;
  message?: string;
  postId?: string;
  [key: string]: any;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private currentDeviceId: string | null = null;
  private eventListeners: Map<string, Function> = new Map();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Core initialization
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('ℹ️ Notification service already initialized');
      return;
    }

    if (this.initializationPromise) {
      console.log('⏳ Waiting for ongoing initialization...');
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = this.initializeInternal();
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async initializeInternal(): Promise<void> {
    try {
      console.log('🔄 Starting notification service initialization...');

      // Reset initialization state
      this.isInitialized = false;

      // Initialize OneSignal
      await this.initializeOneSignal();

      // Set up event listeners
      this.setupEventListeners();

      // Register device with backend
      await this.registerDevice();

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      throw error;
    }
  }

  private async initializeOneSignal(): Promise<void> {
    try {
      // Wait for OneSignal to be ready
      await this.waitForOneSignalInitialization();

      // Get user data and set external user ID
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        if (parsedData?.data?.id) {
          await OneSignal.login(parsedData.data.id);
          console.log('✅ Set OneSignal external user ID:', parsedData.data.id);
        }
      }
    } catch (error) {
      console.error('❌ Error initializing OneSignal:', error);
      throw error;
    }
  }

  private async waitForOneSignalInitialization(): Promise<void> {
    let retryCount = 0;
    
    while (retryCount < this.MAX_RETRIES) {
      try {
        const pushSubscription = OneSignal.User.pushSubscription;
        const [id, token] = await Promise.all([
          pushSubscription.getIdAsync(),
          pushSubscription.getTokenAsync()
        ]);

        if (id && token) {
          return;
        }

        console.log(`⏳ Waiting for OneSignal to be ready (attempt ${retryCount + 1}/${this.MAX_RETRIES})...`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      } catch (error) {
        console.error(`❌ Error checking OneSignal initialization (attempt ${retryCount + 1}):`, error);
        retryCount++;
        if (retryCount === this.MAX_RETRIES) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    throw new Error('OneSignal initialization timeout');
  }

  private async registerDevice(): Promise<void> {
    try {
      const pushSubscription = OneSignal.User.pushSubscription;
      const [id, token] = await Promise.all([
        pushSubscription.getIdAsync(),
        pushSubscription.getTokenAsync()
      ]);

      if (!id || !token) {
        throw new Error('Failed to get OneSignal push subscription details');
      }

      const authToken = await this.getAuthToken();
      if (!authToken) {
        console.log('⚠️ No auth token available, will retry registration later');
        return;
      }

      const storedDeviceId = await AsyncStorage.getItem('currentDeviceId');
      
      const payload = {
        oneSignalPlayerId: id,
        deviceType: Platform.OS,
        deviceToken: token,
        deviceId: storedDeviceId
      };

      const response = await axiosInstance.post<DeviceRegistrationResponse>(
        '/api/v1/devices/register',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.data?.success || response.data?.message?.includes('successfully')) {
        this.currentDeviceId = response.data.data?.id || null;
        if (this.currentDeviceId) {
          await AsyncStorage.setItem('currentDeviceId', this.currentDeviceId);
          await AsyncStorage.setItem('oneSignalPlayerId', id);
        }
        console.log('✅ Device registered successfully with backend');
      }
    } catch (error) {
      console.error('❌ Error registering device:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    console.log('🎯 Setting up notification event listeners...');

   

    

    // Handle permission changes
    const permissionHandler = async (state: boolean) => {
      console.log('🔐 Notification permission changed:', state);
      await this.handlePermissionChange(state);
    };

    // Handle subscription changes
    const subscriptionHandler = async (state: PushSubscriptionChangedState) => {
      console.log('🔄 Push Subscription Changed:', state);
      await this.handleSubscriptionChange(state);
    };


    OneSignal.Notifications.addEventListener('permission' as any, permissionHandler);
    OneSignal.User.pushSubscription.addEventListener('change', subscriptionHandler);

    this.eventListeners.set('permission', permissionHandler);
    this.eventListeners.set('subscription', subscriptionHandler);
  }

  private async handleNotificationClick(event: NotificationClickEvent): Promise<void> {
    try {
      if (!event.notification.additionalData) return;

      const parsedData = typeof event.notification.additionalData === 'string' 
        ? JSON.parse(event.notification.additionalData) 
        : event.notification.additionalData;

      // Emit event for navigation handling
      this.emit('notificationClick', parsedData);
    } catch (error) {
      console.error('❌ Error handling notification click:', error);
    }
  }

  private handleNotificationReceived(event: NotificationWillDisplayEvent): void {
    try {
      if (!event.notification.additionalData) return;

      const parsedData = typeof event.notification.additionalData === 'string' 
        ? JSON.parse(event.notification.additionalData) 
        : event.notification.additionalData;

      // Emit event for notification received
      this.emit('notificationReceived', parsedData);
    } catch (error) {
      console.error('❌ Error handling notification received:', error);
    }
  }

  private async handlePermissionChange(state: boolean): Promise<void> {
    if (state) {
      await this.registerDevice();
    }
  }

  private async handleSubscriptionChange(state: PushSubscriptionChangedState): Promise<void> {
    await this.registerDevice();
  }

  // Public methods
  async requestPermissions(): Promise<boolean> {
    try {
      const result = await OneSignal.Notifications.requestPermission(true);
      return result;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  async unregister(): Promise<void> {
    try {
      const pushSubscription = OneSignal.User.pushSubscription;
      const oneSignalPlayerId = await pushSubscription.getIdAsync();
      
      if (!oneSignalPlayerId) {
        console.log('⚠️ No OneSignal player ID available');
        return;
      }

      const authToken = await this.getAuthToken();
      if (!authToken) {
        console.log('⚠️ No auth token available');
        return;
      }

      await axiosInstance.post(
        '/api/v1/devices/unregister',
        {
          oneSignalPlayerId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      this.currentDeviceId = null;
      await AsyncStorage.removeItem('currentDeviceId');
      await AsyncStorage.removeItem('oneSignalPlayerId');
      
      console.log('✅ Device unregistered successfully');
    } catch (error) {
      console.error('❌ Error unregistering device:', error);
      throw error;
    }
  }

  // Event handling
  on(event: string, callback: Function): void {
    this.eventListeners.set(event, callback);
  }

  off(event: string): void {
    this.eventListeners.delete(event);
  }

  private emit(event: string, data: any): void {
    const callback = this.eventListeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  // Utility methods
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  // Add clearAllNotifications method
  async clearAllNotifications(): Promise<{ success: boolean; message: string }> {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No auth token available');
      }

      const response = await axiosInstance.delete('/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.data?.success) {
        // Reset badge count for all devices
        if (typeof OneSignal !== 'undefined') {
          OneSignal.User.addTag('badge_count', '0');
        }
        return { success: true, message: 'All notifications cleared successfully' };
      }
      
      return { success: false, message: 'Failed to clear notifications' };
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
      throw error;
    }
  }

  cleanup(): void {
    console.log('🧹 Cleaning up notification service...');
    
    // Remove all event listeners
    this.eventListeners.forEach((callback, event) => {
      switch (event) {
        case 'click':
          OneSignal.Notifications.removeEventListener('click', callback as any);
          break;
        case 'foreground':
          OneSignal.Notifications.removeEventListener('foregroundWillDisplay', callback as any);
          break;
        case 'permission':
          OneSignal.Notifications.removeEventListener('permission' as any, callback as any);
          break;
        case 'subscription':
          OneSignal.User.pushSubscription.removeEventListener('change', callback as any);
          break;
      }
    });
    this.eventListeners.clear();
    
    // Reset initialization state
    this.isInitialized = false;
    this.initializationPromise = null;
    
    console.log('✅ Notification service cleanup completed');
  }
}

// Export the singleton instance
export const notificationService = NotificationService.getInstance(); 