import { OneSignal, NotificationClickEvent, NotificationWillDisplayEvent, PushSubscriptionChangedState } from 'react-native-onesignal';
import { Platform, AppState } from 'react-native';
import axiosInstance from '../../utils/axiosConfig';
import { BASEURL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'https://api.dayones.app';

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
  [key: string]: any;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private currentDeviceId: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔑 Retrieved auth token:', token ? 'Found' : 'Not found');
      return token;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  private async registerDeviceWithBackend(oneSignalPlayerId: string, deviceToken: string): Promise<void> {
    let retryCount = 0;
    
    while (retryCount < this.MAX_RETRIES) {
      try {
        const authToken = await this.getAuthToken();
        if (!authToken) {
          console.log('⚠️ No auth token available, will retry registration later');
          return;
        }

        console.log('📱 Registering device with backend...', {
          oneSignalPlayerId,
          deviceType: Platform.OS,
          deviceToken
        });

        const payload = {
          oneSignalPlayerId,
          deviceType: Platform.OS,
          deviceToken
        };

        console.log('📤 Sending registration payload:', payload);

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

        console.log('📥 Registration response:', response.data);

        if (response.data?.success || response.data?.message?.includes('successfully')) {
          this.currentDeviceId = response.data.data?.id || null;
          console.log('✅ Device registered successfully with backend:', {
            deviceId: this.currentDeviceId,
            oneSignalPlayerId,
            deviceType: Platform.OS,
            message: response.data.message
          });
          return;
        }

        throw new Error(response.data?.message || 'Unknown error occurred');
      } catch (error: any) {
        console.error(`❌ Device registration attempt ${retryCount + 1} failed:`, {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          oneSignalPlayerId,
          deviceType: Platform.OS,
          payload: {
            oneSignalPlayerId,
            deviceType: Platform.OS,
            deviceToken
          }
        });

        // Handle specific error cases
        if (error.response?.status === 401) {
          console.log('⚠️ Authentication failed, will retry registration later');
          return;
        }

        retryCount++;
        if (retryCount === this.MAX_RETRIES) {
          console.error('❌ Failed to register device with backend after maximum retries');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
  }

  private async unregisterDeviceFromBackend(): Promise<void> {
    try {
      if (!this.currentDeviceId) {
        console.log('ℹ️ No device registered, skipping unregistration');
        return;
      }

      const authToken = await this.getAuthToken();
      if (!authToken) {
        throw new Error('No auth token available');
      }

      console.log('📱 Unregistering device from backend...', {
        deviceId: this.currentDeviceId
      });

      const response = await axiosInstance.post<DeviceRegistrationResponse>(
        '/api/v1/user-notification/token/remove',
        new URLSearchParams({
          deviceId: this.currentDeviceId
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      if (response.data.success) {
        this.currentDeviceId = null;
        console.log('✅ Device unregistered successfully from backend');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Failed to unregister device from backend:', error);
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

  async initialize() {
    // Force re-initialization after login
    const authToken = await this.getAuthToken();
    if (authToken && !this.currentDeviceId) {
      console.log('🔄 Forcing re-initialization after login');
      this.isInitialized = false;
    }

    if (this.isInitialized && this.currentDeviceId) {
      console.log('ℹ️ Notification service already initialized with device ID:', this.currentDeviceId);
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

  private async initializeInternal() {
    try {
      console.log('🔄 Starting notification service initialization...');

      // First check if we have an auth token
      const authToken = await this.getAuthToken();
      if (!authToken) {
        console.log('⚠️ No auth token available, will retry initialization later');
        this.isInitialized = false;
        return;
      }

      await this.waitForOneSignalInitialization();

      const permission = await OneSignal.Notifications.requestPermission(true);
      console.log('📱 Notification permission status:', permission);

      if (!permission) {
        console.log('⚠️ Notification permission not granted, will retry later');
        this.isInitialized = false;
        return;
      }

      const pushSubscription = OneSignal.User.pushSubscription;
      const [id, token, optIn, hasPermission] = await Promise.all([
        pushSubscription.getIdAsync(),
        pushSubscription.getTokenAsync(),
        pushSubscription.getOptedInAsync(),
        OneSignal.Notifications.getPermissionAsync()
      ]);

      if (!id || !token) {
        console.log('⚠️ No push subscription details available, will retry later');
        this.isInitialized = false;
        return;
      }

      console.log('📲 Push Subscription State:', {
        id,
        token,
        optIn,
        deviceType: Platform.OS
      });

      // Register device with backend
      try {
        console.log('📱 Attempting device registration with backend...');
        await this.registerDeviceWithBackend(id, token);
        
        // Only set initialized after successful registration
        if (this.currentDeviceId) {
          this.isInitialized = true;
          console.log('✅ Notification service initialized successfully with device ID:', this.currentDeviceId);
          
          // Log OneSignal configuration
          console.log('🔧 OneSignal Configuration:', {
            isPushSupported: await OneSignal.User.pushSubscription.getOptedInAsync(),
            isSubscribed: await OneSignal.User.pushSubscription.getOptedInAsync()
          });

          // Set up event listeners only after successful initialization
          this.setupEventListeners();
        } else {
          console.log('⚠️ Device registration did not return a device ID');
          this.isInitialized = false;
        }
      } catch (error) {
        console.error('❌ Failed to register device with backend:', error);
        this.isInitialized = false;
        return;
      }
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      this.isInitialized = false;
      return;
    }
  }

  private setupEventListeners() {
    console.log('🎯 Setting up notification event listeners...');

    // Handle notification opened
    OneSignal.Notifications.addEventListener('click', (event: NotificationClickEvent) => {
      console.log('🔔 Notification opened:', {
        notification: event.notification,
        additionalData: event.notification.additionalData
      });
    });

    // Handle notification received
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: NotificationWillDisplayEvent) => {
      console.log('📨 Notification received:', {
        notification: event.notification,
        additionalData: event.notification.additionalData
      });
    });

    // Handle permission changes
    OneSignal.Notifications.addEventListener('permission' as any, async (state) => {
      console.log('🔐 Notification permission changed:', {
        hasPermission: state,
        deviceState: await OneSignal.User.pushSubscription.getOptedInAsync()
      });

      // If permission is granted, ensure device is registered
      if (state) {
        const pushSubscription = OneSignal.User.pushSubscription;
        const [id, token] = await Promise.all([
          pushSubscription.getIdAsync(),
          pushSubscription.getTokenAsync()
        ]);

        if (id && token) {
          try {
            await this.registerDeviceWithBackend(id, token);
          } catch (error) {
            console.error('❌ Failed to register device after permission change:', error);
          }
        }
      }
    });

    // Handle subscription changes
    OneSignal.User.pushSubscription.addEventListener('change', async (state: PushSubscriptionChangedState) => {
      console.log('🔄 Push Subscription Changed:', {
        timestamp: new Date().toISOString(),
        state: state,
        appState: AppState.currentState
      });

      // Re-register device if subscription changes
      const pushSubscription = OneSignal.User.pushSubscription;
      const [id, token] = await Promise.all([
        pushSubscription.getIdAsync(),
        pushSubscription.getTokenAsync()
      ]);

      if (id && token) {
        try {
          await this.registerDeviceWithBackend(id, token);
        } catch (error) {
          console.error('❌ Failed to re-register device after subscription change:', error);
        }
      }
    });

    // Handle app state changes
    AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, checking device registration...');
        
        const pushSubscription = OneSignal.User.pushSubscription;
        const [id, token] = await Promise.all([
          pushSubscription.getIdAsync(),
          pushSubscription.getTokenAsync()
        ]);

        if (id && token) {
          try {
            await this.registerDeviceWithBackend(id, token);
          } catch (error) {
            console.error('❌ Failed to register device after app state change:', error);
          }
        }
      }
    });

    console.log('✅ Notification event listeners set up successfully');
  }

  async unregister() {
    try {
      await this.unregisterDeviceFromBackend();
      this.isInitialized = false;
      console.log('✅ Device unregistered successfully');
    } catch (error) {
      console.error('❌ Error unregistering device:', error);
      throw error;
    }
  }

  private async sendMessage(conversationId: string, message: string) {
    try {
      const payload = {
        conversationId,
        message,
        type: 'message'
      };

      console.log('📤 Sending message payload:', payload);

      const response = await axiosInstance.post('/api/v1/messages', payload);
      console.log('✅ Message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }
}

export default NotificationService.getInstance(); 