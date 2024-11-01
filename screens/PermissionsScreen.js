import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Image,
} from 'react-native';
import axios from 'axios';
import { BASEURL } from '../assets/constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Foundation from 'react-native-vector-icons/Foundation';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { launchImageLibrary } from 'react-native-image-picker';

const PostDetailPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [likedComments, setLikedComments] = useState([]);
  const [commentsToShow, setCommentsToShow] = useState(10);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params;
  const accessToken = useSelector((state) => state.accessToken);

  const fetchPostDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postData = response.data?.data?.post || {};
      const reactions = response.data?.data?.reactions || [];
      const reactionCount = reactions.length || 0;
      const artistComments = response.data?.data?.artistComments || [];
      const comments = response.data?.data?.comments || [];
      const likedCommentsArray = comments
        .filter((comment) => comment.commentReactionCount > 0)
        .map((comment) => comment.id);

      setLikedComments(likedCommentsArray);
      setPost({ ...postData, reactionCount, artistComments, comments });
    } catch (error) {
      console.error('Error fetching post:', error.response || error.message);
      Alert.alert('Error', 'Could not load post details.');
    } finally {
      setLoading(false);
    }
  };

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
      if (likedComments.includes(commentId)) {
        await axios.post(
          `${BASEURL}/api/v1/comment/dislike/${commentId}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setLikedComments((prevLikedComments) =>
          prevLikedComments.filter((id) => id !== commentId)
        );
      } else {
        await axios.post(
          `${BASEURL}/api/v1/comment/like/${commentId}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setLikedComments((prevLikedComments) => [...prevLikedComments, commentId]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to like/dislike the comment.');
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
              <Icon name="camera" size={24} color="blue" />
            </View>

            <TouchableOpacity style={styles.postButton} onPress={handleSendComment}>
              <Text style={styles.postButtonText}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
        { backgroundColor: enabled ? '#00E5FF' : '#D500F9' },
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, // Added extra top padding for spacing
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
  plusIcon: {
    padding: 5,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    marginBottom: 20, // Increased bottom margin for more spacing
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
    padding: 20,
    alignItems: 'center',
    marginTop: 50, // Added extra top margin for spacing
  },
  fullWidth: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  postButtonText: { color: 'white', fontWeight: 'bold' },
  closeButton: { marginTop: 10 },
  closeButtonText: { color: 'blue', fontWeight: 'bold' },
});

export default PermissionsScreen;
