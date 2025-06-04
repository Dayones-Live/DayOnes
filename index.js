/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { name as appName } from './app.json';

// Register the app component first
AppRegistry.registerComponent(appName, () => App);

// Enable verbose logging for debugging
OneSignal.Debug.setLogLevel(LogLevel.Verbose);

// Initialize OneSignal
const initializeOneSignal = async () => {
  try {
    console.log('🔄 Starting OneSignal initialization...');
    
    // Initialize OneSignal with app ID
    OneSignal.initialize('0a492844-225d-4244-bec5-4cd0e7d5b986');
    console.log('✅ OneSignal initialized with app ID');
    
    // Request notification permission
    const permission = await OneSignal.Notifications.requestPermission();
    console.log('📱 Notification permission status:', permission);

    // Log push subscription state
    const pushSubscription = OneSignal.User.pushSubscription;
    console.log('📲 Push Subscription State:', {
      id: pushSubscription?.id,
      token: pushSubscription?.token,
      optedIn: pushSubscription?.optedIn,
      deviceType: pushSubscription?.deviceType
    });

    // Handle notification opened
    OneSignal.Notifications.addEventListener('opened', (event) => {
      console.log('🔔 OneSignal notification opened:', {
        notification: event.notification,
        action: event.action,
        additionalData: event.notification.additionalData
      });
    });

    // Handle notification received
    OneSignal.Notifications.addEventListener('received', (event) => {
      console.log('📨 OneSignal notification received:', {
        notification: event.notification,
        additionalData: event.notification.additionalData
      });
    });

    // Handle permission changes
    OneSignal.Notifications.addEventListener('permissionChanged', (state) => {
      console.log('🔐 Notification permission changed:', {
        hasPermission: state.hasPermission,
        deviceState: state.deviceState
      });
    });

    // Handle subscription changes
    OneSignal.User.pushSubscription.addEventListener('change', (state) => {
      console.log('🔄 Push subscription changed:', {
        id: state.id,
        token: state.token,
        optedIn: state.optedIn,
        deviceType: state.deviceType
      });
    });

    console.log('✅ OneSignal initialization completed successfully');
  } catch (error) {
    console.error('❌ Error initializing OneSignal:', error);
  }
};

// Start OneSignal initialization
initializeOneSignal();