/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { name as appName } from './app.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BASEURL } from './assets/constants';

// Initialize OneSignal early - MUST happen before event listeners
const ONESIGNAL_APP_ID = '0a492844-225d-4244-bec5-4cd0e7d5b986';

console.log('🔧 Initializing OneSignal with App ID:', ONESIGNAL_APP_ID);
OneSignal.initialize(ONESIGNAL_APP_ID);

// Enable debug logging in development (optional)
if (__DEV__) {
  OneSignal.Debug.setLogLevel(LogLevel.Verbose);
}

// Register the app component
AppRegistry.registerComponent(appName, () => App);

// Set up notification handlers (OneSignal is now initialized)
OneSignal.Notifications.addEventListener('click', async (event) => {
  console.log('🔔 OneSignal notification opened:', event);
  
  try {
    // Get user data to determine navigation
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      console.error('No user data found');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    const isFan = parsedUser.data.role === 'USER';
    
    // Get the additional data from the notification
    const additionalData = event.notification.additionalData;
    if (!additionalData) {
      console.error('No additional data in notification');
      return;
    }

    // Wait for navigation to be ready
    const waitForNavigation = () => {
      return new Promise((resolve) => {
        const checkNavigation = () => {
          if (global.navigationRef?.current) {
            resolve(global.navigationRef.current);
          } else {
            setTimeout(checkNavigation, 100);
          }
        };
        checkNavigation();
      });
    };

    const navigation = await waitForNavigation();

    // Handle different notification types
    if (additionalData.type === 'message' && additionalData.conversation_id) {
      // Handle message notification
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        if (!authToken) {
          console.error('No auth token found');
          return;
        }

        // Fetch conversation details
        const response = await fetch(`${BASEURL}/api/v1/conversation/${additionalData.conversation_id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        if (response.ok) {
          const responseData = await response.json();
          const conversation = responseData.data;
          
          // Determine the other user in the conversation
          const otherUser = conversation.sender.email === parsedUser.data.email 
            ? conversation.reciever 
            : conversation.sender;

          console.log('Navigating to conversation with:', {
            conversationId: additionalData.conversation_id,
            userId: otherUser.id,
            username: otherUser.full_name,
            profilePicture: otherUser.avatar_url || 'https://example.com/default-avatar.png',
            isNewConversation: false
          });

          // Navigate to conversation thread with all required parameters
          navigation.navigate('ConversationThread', {
            conversationId: additionalData.conversation_id,
            userId: otherUser.id,
            username: otherUser.full_name,
            profilePicture: otherUser.avatar_url || 'https://example.com/default-avatar.png',
            isNewConversation: false
          });
        } else {
          console.error('Failed to fetch conversation details:', await response.text());
        }
      } catch (error) {
        console.error('Error handling message notification:', error);
      }
    } else if (additionalData.type === 'comment' && additionalData.post_id) {
      // Handle post comment notification
      if (isFan) {
        navigation.navigate('DMDetailPage', { 
          postId: additionalData.post_id 
        });
      } else {
        navigation.navigate('PostDetailPage', { 
          postId: additionalData.post_id 
        });
      }
    } else if (additionalData.type === 'reaction' && additionalData.post_id) {
      // Handle reaction notification
      if (isFan) {
        navigation.navigate('DMDetailPage', { 
          postId: additionalData.post_id 
        });
      } else {
        navigation.navigate('PostDetailPage', { 
          postId: additionalData.post_id 
        });
      }
    }
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
});

OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
  console.log('📨 OneSignal notification received:', event);
  const notification = event.notification;
  
  // Log the raw payload for debugging
  console.log('Raw payload:', JSON.stringify(notification.rawPayload, null, 2));
  
  // Extract custom content from the raw payload
  const rawPayload = notification.rawPayload;
  if (rawPayload?.custom) {
    console.log('Custom payload:', JSON.stringify(rawPayload.custom, null, 2));
    // Update notification content with custom values
    if (rawPayload.custom.title) {
      notification.title = rawPayload.custom.title;
    }
    if (rawPayload.custom.body) {
      notification.body = rawPayload.custom.body;
    }
  }
  
  // Prevent the notification from displaying automatically
  event.preventDefault();
  // Display the notification manually with updated content
  event.getNotification().display();
});