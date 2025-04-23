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

  const requestPermission = async (permission, setPermissionState) => {
    try {
      // First check if the permission is blocked
      const currentStatus = await check(permission);
      
      if (currentStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'This permission has been blocked in your device settings. Please enable it in Settings to continue.',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      // Show our warning before requesting the permission
      let warningMessage = '';
      switch (permission) {
        case PERMISSIONS.IOS.CAMERA:
        case PERMISSIONS.ANDROID.CAMERA:
          warningMessage = 'Camera access is needed to upload photos and videos. Without it, you won\'t be able to share media content.';
          break;
        case PERMISSIONS.IOS.PHOTO_LIBRARY:
        case PERMISSIONS.ANDROID.READ_MEDIA_IMAGES:
        case PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE:
          warningMessage = 'Photo Library access is needed to select images for your profile and posts. Without it, you won\'t be able to customize your profile or share photos.';
          break;
        case PERMISSIONS.IOS.LOCATION_WHEN_IN_USE:
        case PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION:
          warningMessage = 'Location access is required to receive invites from artists and experience personalized, location-specific content. Without it, you may miss out on nearby events and opportunities.';
          break;
        case 'notifications':
          warningMessage = 'Notifications are important to keep you updated on app activities, new invites, and events. Without them, you might miss important updates.';
          break;
        default:
          warningMessage = 'This permission is important for the app\'s functionality. Please consider enabling it.';
      }

      Alert.alert(
        'Permission Required',
        warningMessage,
        [
          {
            text: 'Not Now',
            style: 'cancel'
          },
          {
            text: 'Continue',
            onPress: async () => {
              // Only request the permission if they choose to continue
              let result;
              if (permission === 'notifications') {
                const notificationResult = await requestNotifications(['alert', 'sound', 'badge']);
                result = notificationResult.status;
              } else {
                result = await request(permission);
              }
              
              if (result === RESULTS.DENIED) {
                // If denied, show settings prompt
                Alert.alert(
                  'Permission Required',
                  'You\'ll need to enable this permission in Settings to use this feature.',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Open Settings',
                      onPress: () => Linking.openSettings()
                    }
                  ]
                );
              }
              
              setPermissionState(result === RESULTS.GRANTED);
              checkAllPermissions();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request permission. Please try again.');
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
        console.log('Permissions granted, navigating to LoginPage');
        navigation.navigate('LoginPage');
      } else {
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
                description="Location access is used to let you access invites from artists and experience personalized, location-specific content."
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
                style={styles.continueButton}>
                <TouchableOpacity
                  onPress={handleContinue}
                  style={styles.fullWidth}>
                  <Text style={styles.buttonText}>Continue</Text>
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
