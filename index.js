/**
 * @format
 */

import {Alert, AppRegistry} from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging'; // Import messaging
import {name as appName} from './app.json';

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message handled:', remoteMessage);
  // Parse data field as JSON if it exists
  if (remoteMessage.data) {
    try {
      const parsedData = typeof remoteMessage.data === 'string' 
        ? JSON.parse(remoteMessage.data) 
        : remoteMessage.data;
      console.log('Parsed notification data:', parsedData);
    } catch (error) {
      console.error('Error parsing notification data:', error);
    }
  }
});

// Handle foreground messages
messaging().onMessage(async remoteMessage => {
  console.log('A new FCM message arrived!', remoteMessage);
  // Parse data field as JSON if it exists
  if (remoteMessage.data) {
    try {
      const parsedData = typeof remoteMessage.data === 'string' 
        ? JSON.parse(remoteMessage.data) 
        : remoteMessage.data;
      console.log('Parsed notification data:', parsedData);
    } catch (error) {
      console.error('Error parsing notification data:', error);
    }
  }
});

// Register the app component
AppRegistry.registerComponent(appName, () => App);
