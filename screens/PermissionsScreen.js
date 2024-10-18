import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';
import {useSelector} from 'react-redux';

const PermissionsScreen = () => {
  const [cameraPermission, setCameraPermission] = useState(false);
  const [libraryPermission, setLibraryPermission] = useState(false);
  const [notificationsPermission, setNotificationsPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const navigation = useNavigation();
  const profile = useSelector(state => state.userProfile);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    try {
      const camera = await check(
        Platform.select({
          ios: PERMISSIONS.IOS.CAMERA,
          android: PERMISSIONS.ANDROID.CAMERA,
        }),
      );
      // const library = await request(
      //   Platform.select({
      //     ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
      //     android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      //   }),
      // );
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

      console.log('camera', camera);
      console.log('library', library);
      console.log('notifications', notifications);
      console.log('location', location);

      setCameraPermission(camera === RESULTS.GRANTED);
      setLibraryPermission(
        library === RESULTS.GRANTED || library === RESULTS.LIMITED,
      );
      setNotificationsPermission(notifications === RESULTS.GRANTED);
      setLocationPermission(location === RESULTS.GRANTED);

      if (
        camera === RESULTS.GRANTED &&
        library === RESULTS.GRANTED &&
        notifications === RESULTS.GRANTED &&
        location === RESULTS.GRANTED
      ) {
        navigateToAppropriateStack(profile.data.role);
      }
    } catch (error) {
      console.log('Error checking permissions:', error);
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
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Settings', onPress: () => Linking.openSettings()},
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

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <Text style={styles.headerText}>Permissions</Text>

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
            // requestPermission(
            //   Platform.OS === 'ios'
            //     ? PERMISSIONS.IOS.NOTIFICATIONS
            //     : PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
            //   setNotificationsPermission,
            // )
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
          colors={['#ffcc00', '#ff8800']}
          style={styles.continueButton}>
          <TouchableOpacity
            onPress={() => navigateToAppropriateStack(profile.data.role)}
            style={styles.fullWidth}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const PermissionItem = ({icon, title, enabled, onPress}) => (
  <View style={styles.permissionItem}>
    <Icon name={icon} size={24} color="#fff" />
    <Text style={styles.permissionText}>{title}</Text>
    <TouchableOpacity
      style={[
        styles.permissionButton,
        enabled ? styles.enabled : styles.disabled,
      ]}
      onPress={onPress}>
      <Text style={styles.permissionButtonText}>
        {enabled ? 'Enabled' : 'Allow'}
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: '#0c002b',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 0, // Remove padding at the bottom
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
  },
  permissionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  enabled: {
    backgroundColor: '#ffcc00',
  },
  disabled: {
    backgroundColor: '#00ffcc',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  continueButton: {
    borderRadius: 10,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
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
