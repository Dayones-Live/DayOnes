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
});

// Handle foreground messages
messaging().onMessage(async remoteMessage => {
  console.log('A new FCM message arrived!', remoteMessage);
});

// Register the app component
AppRegistry.registerComponent(appName, () => App);
