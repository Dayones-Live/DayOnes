/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { name as appName } from './app.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Register the app component first
AppRegistry.registerComponent(appName, () => App);

// Enable verbose logging for debugging
OneSignal.Debug.setLogLevel(LogLevel.Verbose);

// Initialize OneSignal
console.log('🔄 Starting OneSignal initialization...');
OneSignal.initialize('0a492844-225d-4244-bec5-4cd0e7d5b986');

// Request notification permission
OneSignal.Notifications.requestPermission();

// Get push subscription state
const pushSubscription = OneSignal.User.pushSubscription;
Promise.all([
  pushSubscription.getIdAsync(),
  pushSubscription.getTokenAsync(),
  pushSubscription.getOptedInAsync()
]).then(([id, token, optedIn]) => {
  console.log('📱 Notification permission status:', optedIn);
  console.log('📲 Push Subscription State:', {
    deviceType: Platform.OS,
    id,
    optedIn,
    token
  });

  // Get user data and set external user ID
  AsyncStorage.getItem('userData').then(userData => {
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData?.data?.id) {
          OneSignal.login(parsedData.data.id);
          console.log('✅ Set OneSignal external user ID:', parsedData.data.id);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  });
});

// Set up notification handlers
OneSignal.Notifications.addEventListener('click', (event) => {
  console.log('🔔 OneSignal notification opened:', event);
});

OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
  console.log('📨 OneSignal notification received:', event);
  // Prevent the notification from displaying automatically
  event.preventDefault();
  // Display the notification manually
  event.getNotification().display();
});

console.log('✅ OneSignal initialization completed successfully');