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

  useEffect(() => {
    checkAllPermissions();

    // Listen to app state changes to refresh permissions when returning from settings
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
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
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

      if (
        camera === RESULTS.GRANTED &&
        notifications === RESULTS.GRANTED &&
        library === RESULTS.GRANTED &&
        location === RESULTS.GRANTED
      ) {
        navigateToAppropriateStack(profile.data.role);
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

  const navigateToAppropriateStack = role => {
    if (role === 'ARTIST') {
      navigation.navigate('ArtistStack');
    } else if (role === 'USER') {
      navigation.navigate('FanStack');
    }
  };

  const handleContinue = () => {
    if (!cameraPermission || !libraryPermission || !notificationsPermission || !locationPermission) {
      Alert.alert(
        'Warning',
        'Not all permissions are granted. Some app features may not work correctly.',
        [
          { text: 'Continue Anyway', onPress: () => navigateToAppropriateStack(profile.data.role) },
          { text: 'Go Back', style: 'cancel' },
        ],
      );
    } else {
      navigateToAppropriateStack(profile.data.role);
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
                enabled={cameraPermission}
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
                enabled={libraryPermission}
                onPress={() =>
                  requestPermission(
                    Platform.OS === 'ios'
                      ? PERMISSIONS.IOS.PHOTO_LIBRARY
                      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
                    setLibraryPermission,
                  )
                }
              />
              <PermissionItem
                icon="bell"
                title="Push Notifications"
                enabled={notificationsPermission}
                onPress={async () => {
                  const notificationResult = await requestNotifications([
                    'alert',
                    'sound',
                    'badge',
                  ]);
                  setNotificationsPermission(
                    notificationResult.status === RESULTS.GRANTED,
                  );
                }}
              />
              <PermissionItem
                icon="map-marker"
                title="Location"
                enabled={locationPermission}
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

const PermissionItem = ({ icon, title, enabled, onPress }) => (
  <View style={styles.permissionItem}>
    <Icon name={icon} size={24} color="#fff" />
    <Text style={styles.permissionText}>{title}</Text>
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.permissionButton,
        { backgroundColor: enabled ? '#D500F9' : 'red' },
      ]}
    >
      <Text style={styles.permissionButtonText}>
        {enabled ? 'Enabled' : 'Allow'}
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
    flex: 1,
    marginLeft: 10,
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
