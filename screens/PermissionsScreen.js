import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Image,
  AppState,
  ScrollView,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';
import { useSelector } from 'react-redux';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { BASEURL } from '../assets/constants';
import styles from './sharedStyles/PermissionScreenStyles';

const PermissionsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [libraryPermission, setLibraryPermission] = useState(false);
  const [notificationsPermission, setNotificationsPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const navigation = useNavigation();
  const profile = useSelector(state => state.userProfile);

  const permissionsInfo = {
    camera: 'Camera access is optional and used for uploading photos and videos.',
    library: 'Photo Library access is optional and used to select images for your profile. Scoped permissions for newer Android versions are supported.',
    notifications: 'Notifications are optional to keep you updated on app activities.',
    location: 'Location access is mandatory. It is used to let you access invites from artists and experience personalized, location-specific content.',
  };

  useEffect(() => {
    checkAllPermissions();

    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAllPermissions();
      }
    });

    return () => {
      appStateListener.remove();
    };
  }, []);

  const checkAllPermissions = async () => {
    try {
      const camera = await check(
        Platform.select({
          ios: PERMISSIONS.IOS.CAMERA,
          android: PERMISSIONS.ANDROID.CAMERA,
        }),
      );
      const library = await check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : Platform.Version >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
      );

      const notifications = (await checkNotifications()).status;
      const location = await check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );

      setCameraPermission(camera === RESULTS.GRANTED);
      setLibraryPermission(
        library === RESULTS.GRANTED || library === RESULTS.LIMITED,
      );
      setNotificationsPermission(notifications === RESULTS.GRANTED);
      setLocationPermission(location === RESULTS.GRANTED);

      if (location === RESULTS.GRANTED) {
        await storePermissionsStatus();
      }

      setLoading(false);
    } catch (error) {
      console.log('Error checking permissions:', error);
      setLoading(false);
    }
  };

  const initializeOneSignal = async () => {
    try {
      // Enable verbose logging for debugging
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);

      // Initialize OneSignal
      console.log('🔄 Starting OneSignal initialization...');
      OneSignal.initialize('0a492844-225d-4244-bec5-4cd0e7d5b986');

      // Get push subscription state
      const pushSubscription = OneSignal.User.pushSubscription;
      const [id, token, optedIn] = await Promise.all([
        pushSubscription.getIdAsync(),
        pushSubscription.getTokenAsync(),
        pushSubscription.getOptedInAsync()
      ]);

      console.log('📱 Notification permission status:', optedIn);
      console.log('📲 Push Subscription State:', {
        deviceType: Platform.OS,
        id,
        optedIn,
        token
      });

      // Get user data and set external user ID
      const userData = await AsyncStorage.getItem('userData');
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

      // Set up notification handlers
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

      console.log('✅ OneSignal initialization completed successfully');
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  };

  const requestPermission = async (permission, setPermissionState) => {
    try {
      // First check if the permission is blocked
      const currentStatus = await check(permission);
      
      if (currentStatus === RESULTS.BLOCKED) {
        // If blocked, just return without showing any custom message
        return;
      }

      // Request the permission directly
      let result;
      if (permission === 'notifications') {
        const notificationResult = await requestNotifications(['alert', 'sound', 'badge']);
        result = notificationResult.status;
        
        // Initialize OneSignal if notifications were granted
        if (result === RESULTS.GRANTED) {
          await initializeOneSignal();
        }
      } else {
        result = await request(permission);
      }
      
      setPermissionState(result === RESULTS.GRANTED);
      checkAllPermissions();
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const storePermissionsStatus = async () => {
    try {
      await AsyncStorage.setItem('permissionsAccepted', 'true');
      console.log('Permissions status saved to AsyncStorage');
    } catch (error) {
      console.error('Error storing permissions status:', error);
    }
  };

  const handleContinue = async () => {
    try {
      const location = await check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );
      
      if (location === RESULTS.GRANTED) {
        await AsyncStorage.setItem('permissionsAccepted', 'true');
        navigation.navigate('LoginPage');
      } else {
        // For mandatory location, request it again
        await requestPermission(
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          setLocationPermission
        );
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <Text style={styles.headerText}>Permissions</Text>
          <Image
            source={require('../assets/images/1024.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {loading ? (
            <ActivityIndicator size="large" color="#ff8800" />
          ) : (
            <>
              <PermissionItem
                icon="camera"
                title="Camera"
                description="Camera access is used for uploading photos and videos."
                enabled={cameraPermission}
                mandatory={false}
                onPress={() =>
                  requestPermission(
                    Platform.OS === 'ios'
                      ? PERMISSIONS.IOS.CAMERA
                      : PERMISSIONS.ANDROID.CAMERA,
                    setCameraPermission,
                  )
                }
              />
              <PermissionItem
                icon="folder"
                title="Library"
                description="Photo Library access is used to select images for your profile."
                enabled={libraryPermission}
                mandatory={false}
                onPress={() =>
                  requestPermission(
                    Platform.OS === 'ios'
                      ? PERMISSIONS.IOS.PHOTO_LIBRARY
                      : Platform.Version >= 33
                        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
                        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
                    setLibraryPermission,
                  )
                }
              />
              <PermissionItem
                icon="bell"
                title="Push Notifications"
                description="Notifications are used to keep you updated on app activities."
                enabled={notificationsPermission}
                mandatory={false}
                onPress={() => requestPermission('notifications', setNotificationsPermission)}
              />
              <PermissionItem
                icon="map-marker"
                title="Location"
                description="Location access is mandatory. It is used to let you access invites from artists and experience personalized, location-specific content."
                enabled={locationPermission}
                mandatory={true}
                onPress={() =>
                  requestPermission(
                    Platform.OS === 'ios'
                      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
                      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                    setLocationPermission,
                  )
                }
              />

              <LinearGradient
                colors={['#00E5FF', '#D500F9']}
                style={[
                  styles.continueButton,
                  !locationPermission && { opacity: 0.5 }
                ]}>
                <TouchableOpacity
                  onPress={handleContinue}
                  style={styles.fullWidth}
                  disabled={!locationPermission}>
                  <Text style={styles.buttonText}>
                    {locationPermission ? 'Continue' : 'Location Required'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const PermissionItem = ({ icon, title, description, enabled, onPress, mandatory }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.permissionItem,
        { 
          borderColor: enabled ? '#00FF00' : 'rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(0,0,0,0.6)'
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.permissionIconContainer}>
        <Icon name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionText}>
          {title} <Text style={styles.mandatoryText}>{mandatory ? "(Mandatory)" : "(Optional)"}</Text>
        </Text>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[
            styles.toggleButton,
            { backgroundColor: enabled ? '#00FF00' : 'rgba(255,255,255,0.2)' }
          ]}
          onPress={onPress}
        >
          <View style={[
            styles.toggleCircle,
            { 
              backgroundColor: '#fff',
              transform: [{ translateX: enabled ? 20 : 0 }]
            }
          ]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default PermissionsScreen;
