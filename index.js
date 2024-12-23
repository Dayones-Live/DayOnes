/**
 * @format
 */

import {Alert, AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message handled:', remoteMessage);
});
messaging().onMessage(async remoteMessage => {
  console.log('A new FCM message arrived!', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
