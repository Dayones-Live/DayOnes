import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ImageBackground,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoder-reborn';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASEURL } from '../../assets/constants';
import { uploadImageToBucket } from '../../utils';
import styles from './artistStyles/HHomePageStyles';
import useSetupNotificationsAndLocation from '../../assets/hooks/useSetupNotificationsAndLocation';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useFetchUser from '../../assets/hooks/useFetchUser';
import { convertToTemporaryFile } from '../../assets/components/convertToTemporaryFileHelper';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { verticalScale } from 'react-native-size-matters';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HHomePage = () => {
  const [radius, setRadius] = useState(100);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [contentType, setContentType] = useState('INVITE_ONLY');
  const [scaleValue] = useState(new Animated.Value(1));
  const insets = useSafeAreaInsets();

  const { mutate: fetchUser } = useFetchUser();
  const navigation = useNavigation();
  const route = useRoute();
  const [isLoading, setIsLoading] = useState(false);

  const userProfile = useSelector(state => state.userProfile?.data) || {
    username: 'unknown',
    fullName: 'Unknown User',
    avatar_url: null,
  };

  const accessToken = useSelector(state => state.accessToken);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('authToken');
        if (accessToken) {
          fetchUser();
        }
      } catch (error) {
        console.error('Error fetching access token:', error);
      }
    };
    fetchUserData();
  }, [fetchUser]);

  useSetupNotificationsAndLocation();

  useEffect(() => {
    if (route.params?.editedImage) {
      setSelectedImage(route.params.editedImage);
    }
  }, [route.params?.editedImage]);

  const options = {
    mediaType: 'photo',
    includeBase64: false,
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const takePicture = async () => {
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;

      const result = await check(permission);

      const options = {
        mediaType: 'photo',
        saveToPhotos: true,
        includeBase64: false,
      };

      if (result === RESULTS.GRANTED) {
        launchCamera(options, response => {
          if (response.didCancel) {
            setContentType('INVITE_ONLY');
          } else if (response.errorMessage) {
            setContentType('INVITE_ONLY');
          } else if (response.assets && response.assets.length > 0) {
            const capturedImage = response.assets[0];
            setSelectedImage(capturedImage);
            setContentType('INVITE_PHOTO');
            navigation.navigate('EditScreen', { selectedImage: capturedImage });
          }
        });
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          launchCamera(options, response => {
            if (response.didCancel) {
              setContentType('INVITE_ONLY');
            } else if (response.errorMessage) {
              setContentType('INVITE_ONLY');
            } else if (response.assets && response.assets.length > 0) {
              const capturedImage = response.assets[0];
              setSelectedImage(capturedImage);
              setContentType('INVITE_PHOTO');
              navigation.navigate('EditScreen', { selectedImage: capturedImage });
            }
          });
        } else {
          setContentType('INVITE_ONLY');
        }
      } else if (result === RESULTS.BLOCKED) {
        Linking.openSettings();
        setContentType('INVITE_ONLY');
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setContentType('INVITE_ONLY');
    }
  };

  const uploadImageToS3 = async imageUri => {
    try {
      let filePath = imageUri;

      if (Platform.OS === 'android' && imageUri.startsWith('content://')) {
        filePath = await convertToTemporaryFile(imageUri, 'jpg');
      }

      const s3Url = await uploadImageToBucket(filePath, 'posts', accessToken);

      if (!s3Url) {
        throw new Error('S3 URL is undefined or null');
      }

      setUploadedImageUrl(s3Url);
      return s3Url;
    } catch (error) {
      console.error('Error in uploadImageToS3:', error);
      Alert.alert('Image upload failed. Please try again.');
      throw error;
    }
  };

  const uploadFile = () => {
    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        setContentType('INVITE_ONLY');
      } else if (response.errorMessage) {
        setContentType('INVITE_ONLY');
      } else if (response.assets && response.assets.length > 0) {
        const uploadedImage = response.assets[0];

        if (
          Platform.OS === 'android' &&
          uploadedImage.uri.startsWith('content://')
        ) {
          uploadedImage.uri = await convertToTemporaryFile(
            uploadedImage.uri,
            'jpg',
          );
        }

        setSelectedImage(uploadedImage);
        setContentType('INVITE_PHOTO');
        navigation.navigate('EditScreen', { selectedImage: uploadedImage });
      }
    });
  };

  const handleTakePhoto = async () => {
    await takePicture();
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    if (type === 'INVITE_ONLY') {
      setSelectedImage(null);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
  };

  const getLocale = async (latitude, longitude) => {
    try {
      const res = await Geocoder.geocodePosition({
        lat: latitude,
        lng: longitude,
      });
      if (res && res.length > 0) {
        const locality = res[0].locality || '';
        const adminArea = res[0].adminArea || '';
        return `${locality}, ${adminArea}`;
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting locale', error);
      return 'Error retrieving location';
    }
  };

  const createPost = async () => {
    setIsLoading(true);
    animateButton();

    let postType = 'INVITE_ONLY';
    if (contentType === 'INVITE_PHOTO') {
      postType = 'INVITE_PHOTO';
    }

    if (postType === 'INVITE_PHOTO' && !selectedImage) {
      Alert.alert(
        'Warning',
        'You must select a photo when choosing "Invite + Media."',
      );
      setIsLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;

        try {
          let postImageUrl = null;

          if (postType === 'INVITE_PHOTO') {
            if (!selectedImage) {
              Alert.alert('Error', 'No image selected for upload.');
              setIsLoading(false);
              return;
            }
            postImageUrl = await uploadImageToS3(selectedImage.uri);
          }

          const locale = await getLocale(latitude, longitude);

          const postData = {
            imageUrl: postImageUrl,
            range: radius,
            type: postType,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            locale: locale || 'Unknown location',
            message:
              "Welcome to my exclusive DayOnes group! Here, you're more than just a fan, you're family.🔥 💯 🔥",
          };

          const response = await fetch(`${BASEURL}/api/v1/post/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(postData),
          });

          const jsonResponse = await response.json();

          if (response.ok) {
            setIsLoading(false);
            const newPostId = jsonResponse.data?.id;
            Alert.alert('Success', 'Post created successfully!');

            if (newPostId) {
              navigation.navigate('PostDetailPage', { postId: newPostId });
            }

            clearSelectedImage();
          } else {
            setIsLoading(false);
            Alert.alert(
              'Error',
              `Failed to create post: ${jsonResponse.message || 'Unknown error'}`,
            );
          }
        } catch (error) {
          setIsLoading(false);
          console.error('Error during post creation:', error);
          Alert.alert('Error', 'An error occurred while creating the post.');
        }
      },
      error => {
        console.error('Error getting location:', error);
        Alert.alert(
          'Error',
          'Failed to get your location. Please enable location services.',
        );
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../../assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={[styles.container, { paddingTop: insets.top + verticalScale(20) - 3, paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 90 : 70) }]}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/1024.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>DayOnes Live</Text>
            <Text style={styles.headerTagline}>Unleash Your Reach</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileScreen')}
            style={styles.profileContainer}
          >
            <LinearGradient
              colors={['#D500F9', '#FF0080']}
              style={styles.profileGradientBorder}
            >
              <View style={styles.profileImageContainer}>
                <Image
                  source={userProfile.avatar_url ? { uri: userProfile.avatar_url } : require('../../assets/images/defaultProfileImage.jpg')}
                  style={styles.profileImage}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Choose Your Content Card */}
        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Choose Your Content</Text>
          <View style={styles.contentGrid}>
            <TouchableOpacity
              style={[
                styles.contentButton,
                contentType === 'INVITE_ONLY' && styles.contentButtonSelected,
              ]}
              onPress={() => handleContentTypeChange('INVITE_ONLY')}
            >
              {contentType === 'INVITE_ONLY' ? (
                <LinearGradient
                  colors={['#00D9FF', '#7000FF']}
                  style={styles.contentButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.contentButtonTextSelected}>Invite Only</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.contentButtonText}>Invite Only</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.contentButton,
                contentType === 'INVITE_PHOTO' && styles.contentButtonSelected,
              ]}
              onPress={() => handleContentTypeChange('INVITE_PHOTO')}
            >
              {contentType === 'INVITE_PHOTO' ? (
                <LinearGradient
                  colors={['#00D9FF', '#7000FF']}
                  style={styles.contentButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.contentButtonTextSelected}>Invite + Media</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.contentButtonText}>Invite + Media</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contentButton}
              onPress={handleTakePhoto}
            >
              <FontAwesome5 name="camera" size={20} color="#FFFFFF" style={styles.contentButtonIcon} />
              <Text style={styles.contentButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contentButton}
              onPress={uploadFile}
            >
              <FontAwesome5 name="file-upload" size={20} color="#FFFFFF" style={styles.contentButtonIcon} />
              <Text style={styles.contentButtonText}>Upload File</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Set Invite Radius Card */}
        <View style={styles.radiusCard}>
          <Text style={styles.cardTitle}>Set Invite Radius</Text>
          <View style={styles.radiusOptionsContainer}>
            <TouchableOpacity
              style={[
                styles.radiusButton,
                radius === 100 && styles.radiusButtonSelected,
              ]}
              onPress={() => setRadius(100)}
            >
              {radius === 100 ? (
                <LinearGradient
                  colors={['#00D9FF', '#7000FF']}
                  style={styles.radiusButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <FontAwesome5 name="microphone-alt" size={24} color="#FFFFFF" />
                  <Text style={styles.radiusButtonTextSelected}>100 ft</Text>
                  <Text style={styles.radiusButtonSubtext}>Front Stage</Text>
                </LinearGradient>
              ) : (
                <>
                  <FontAwesome5 name="microphone-alt" size={24} color="#FFFFFF" style={styles.radiusButtonIcon} />
                  <View style={styles.radiusButtonTextContainer}>
                    <Text style={styles.radiusButtonText}>100 ft</Text>
                    <Text style={styles.radiusButtonSubtextUnselected}>Front Stage</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radiusButton,
                radius === 1000 && styles.radiusButtonSelected,
              ]}
              onPress={() => setRadius(1000)}
            >
              {radius === 1000 ? (
                <LinearGradient
                  colors={['#00D9FF', '#7000FF']}
                  style={styles.radiusButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <FontAwesome5 name="landmark" size={24} color="#FFFFFF" />
                  <Text style={styles.radiusButtonTextSelected}>1000 ft</Text>
                  <Text style={styles.radiusButtonSubtext}>Full Venue</Text>
                </LinearGradient>
              ) : (
                <>
                  <FontAwesome5 name="landmark" size={24} color="#FFFFFF" style={styles.radiusButtonIcon} />
                  <View style={styles.radiusButtonTextContainer}>
                    <Text style={styles.radiusButtonText}>1000 ft</Text>
                    <Text style={styles.radiusButtonSubtextUnselected}>Full Venue</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Send Invites Button */}
        <View style={styles.sendButtonContainer}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity
              onPress={createPost}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00D9FF', '#7000FF']}
                style={styles.sendButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFF" />
                ) : (
                  <Text style={styles.sendButtonText}>Send Invites</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default HHomePage;
