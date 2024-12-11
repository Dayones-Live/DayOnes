import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Image,
  AppState,
  ScrollView,
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
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES // Scoped permissions for Android 13+
            : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE // Fallback for older versions
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
      const result = await request(permission);
      if (result === RESULTS.BLOCKED) {
        openAppSettings();
      } else {
        setPermissionState(result === RESULTS.GRANTED);
        checkAllPermissions();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permission');
    }
  };

  const openAppSettings = () => {
    Alert.alert(
      'Permission Required',
      'The app needs this permission to function correctly. Please enable it in the app settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const storePermissionsStatus = async () => {
    try {
      await AsyncStorage.setItem('permissionsGranted', 'true');
      console.log('Permissions status saved to AsyncStorage');
    } catch (error) {
      console.error('Error storing permissions status:', error);
    }
  };

  const handleContinue = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Location Required',
        'Location access is mandatory to enable geofenced content and ensure the app functions as intended. It is used to let you access invites from artists and experience personalized, location-specific content.',
        [{ text: 'OK' }],
      );
    } else {
      await AsyncStorage.setItem('permissionsGranted', 'true');
      navigation.navigate('LoginPage');
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
                description={permissionsInfo.camera}
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
                description={permissionsInfo.library}
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
                description={permissionsInfo.notifications}
                enabled={notificationsPermission}
                mandatory={false}
                onPress={async () => {
                  const notificationResult = await requestNotifications([
                    'alert',
                    'sound',
                    'badge',
                  ]);
                  setNotificationsPermission(
                    notificationResult.status === RESULTS.GRANTED,
                  );
                  checkAllPermissions();
                }}
              />
              <PermissionItem
                icon="map-marker"
                title="Location"
                description={permissionsInfo.location}
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

const PermissionItem = ({ icon, title, description, enabled, onPress, mandatory }) => (
  <View style={styles.permissionItem}>
    <Icon name={icon} size={24} color="#fff" />
    <View style={{ flex: 1, marginLeft: 10 }}>
      <Text style={styles.permissionText}>
        {title} {mandatory ? "(Mandatory)" : "(Optional)"}
      </Text>
      <Text style={styles.permissionDescription}>{description}</Text>
    </View>
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.permissionButton,
        { backgroundColor: enabled ? '#D500F9' : 'red' },
      ]}
    >
      <Text style={styles.permissionButtonText}>
        {enabled ? 'Enabled' : 'Enable'}
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    marginBottom: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
  },
  permissionDescription: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  permissionButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  continueButton: {
    borderRadius: 10,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 50,
  },
  fullWidth: {
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PermissionsScreen;
