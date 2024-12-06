import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
  Switch,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoder-reborn';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';
import NotificationsScreen from '../NotificationsScreen';
import DMsScreen from '../DMsScreen';
import ArtistPostsPage from './ArtistPostsPage';
import { BASEURL } from '../../assets/constants';
import { uploadImageToBucket } from '../../utils';
import useSetupNotificationsAndLocation from '../../assets/hooks/useSetupNotificationsAndLocation';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useFetchUser from '../../assets/hooks/useFetchUser';


const Tab = createBottomTabNavigator();

const HHomePage = () => {
  const [isMaxRange, setIsMaxRange] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [postType, setPostType] = useState('INVITE_PHOTO');
  const [scaleValue] = useState(new Animated.Value(1));

  const { mutate: fetchUser } = useFetchUser();
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('authToken');
        if (accessToken) {
          console.log('Access token:', accessToken);
          fetchUser(); // Fetch user data
        } else {
          console.error('No access token found in AsyncStorage.');
        }
      } catch (error) {
        console.error('Error fetching access token:', error);
      }
    };

    fetchUserData();
  }, [fetchUser]); // Include `fetchUser` in the dependency array

  useEffect(() => {
    console.log('UserProfile from Redux:', userProfile);
  }, [userProfile]);

  const userProfile = useSelector(state => state.userProfile) || {
    username: 'unknown',
    fullName: 'Unknown User',
  };

  const accessToken = useSelector(state => state.accessToken)

  useEffect(() => {
    console.log('UserProfile from Redux:', userProfile);
  }, [userProfile]);

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
        toValue: 1.1, // Scale up
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1, // Scale back to original size
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };


  const takePicture = () => {
    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const capturedImage = response.assets[0];
        setSelectedImage(capturedImage);
        navigation.navigate('EditScreen', { selectedImage: capturedImage });
      }
    });
  };

  const uploadImageToS3 = async (imageUri) => {
    try {
      const s3Url = await uploadImageToBucket(imageUri, 'posts', accessToken);

      if (!s3Url) {
        throw new Error('S3 URL is undefined or null');
      }

      setUploadedImageUrl(s3Url);
      console.log('Image uploaded successfully to S3:', s3Url);

      return s3Url; // Ensure this URL is returned to the caller
    } catch (error) {
      console.error('Error in uploadImageToS3:', error);
      Alert.alert('Image upload failed. Please try again.');
      throw error; // Re-throw to handle in `createPost`
    }
  };


  const uploadFile = () => {
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uploadedImage = response.assets[0];
        setSelectedImage(uploadedImage);
        navigation.navigate('EditScreen', { selectedImage: uploadedImage });
      }
    });
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
  };

  const getLocale = async (latitude, longitude) => {
    try {
      const res = await Geocoder.geocodePosition({ lat: latitude, lng: longitude });
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
    // Animate the send button for visual feedback
    animateButton();

    // Validate selected image for the 'INVITE_PHOTO' post type
    if (postType === 'INVITE_PHOTO' && !selectedImage) {
      Alert.alert('Warning', 'You must select a photo when choosing "Invite + Photo."');
      return;
    }

    console.log("Starting post creation...");

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("User's current position:", { latitude, longitude });

        try {
          let postImageUrl = null;

          // Step 1: Upload image to S3 if required
          if (postType === 'INVITE_PHOTO') {
            console.log("Uploading image to S3...");
            if (!selectedImage) {
              console.error("No image selected for upload.");
              Alert.alert('Error', 'No image selected for upload.');
              return;
            }

            console.log("Image URI before upload:", selectedImage.uri);
            postImageUrl = await uploadImageToS3(selectedImage.uri);
            console.log("S3 URL received:", postImageUrl);
          }

          // Step 2: Get locale information based on geolocation
          console.log("Fetching location details...");
          const locale = await getLocale(latitude, longitude);
          console.log("Locale determined:", locale);

          // Step 3: Prepare post data to be sent
          const postData = {
            imageUrl: postImageUrl, // Null if post type is 'INVITE_ONLY'
            range: isMaxRange ? 1000 : 100, // Range in feet
            type: postType, // INVITE_PHOTO or INVITE_ONLY
            latitude: latitude.toString(), // Latitude as string
            longitude: longitude.toString(), // Longitude as string
            locale: locale || "Unknown location",
            message: "Welcome to my exclusive DayOnes group! Here, you're more than just a fan, you're family.🔥 💯 🔥",
          };

          console.log("Post data prepared:", postData);

          // Step 4: Send POST request to create a new post
          console.log("Sending API request to create post...");
          const response = await fetch(`${BASEURL}/api/v1/post/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(postData),
          });

          const jsonResponse = await response.json();
          console.log("API response received:", jsonResponse);

          if (response.ok) {
            const newPostId = jsonResponse.data?.id; // Extract the new post ID
            Alert.alert('Success', 'Post created successfully!');
            console.log("Post created successfully!");

            // Navigate to PostDetailPage with the new post ID
            if (newPostId) {
              navigation.navigate('PostDetailPage', { postId: newPostId });
            } else {
              console.error("Post ID not returned in response.");
            }

            clearSelectedImage(); // Clear the selected image after a successful post
          } else {
            console.error("Failed to create post:", jsonResponse);
            Alert.alert('Error', `Failed to create post: ${jsonResponse.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error("Error during post creation:", error);
          Alert.alert('Error', 'An error occurred while creating the post.');
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        Alert.alert('Error', 'Failed to get your location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };






  return (
    <Tab.Navigator
      initialRouteName="Main"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Posts':
              iconName = 'file-text-o';
              break;
            case 'Notifications':
              iconName = 'bell-o';
              break;
            case "DM's":
              iconName = 'envelope-o';
              break;
            default:
              iconName = 'home';
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Main" options={{ tabBarLabel: 'Home' }}>
        {() => (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <ScrollView contentContainerStyle={styles.container}>
              <ProfilePictureButton />

              <View style={styles.header}>
                <Image
                  source={require('../../assets/images/1024.png')}
                  style={styles.logo}
                />
              </View>

              <Text style={styles.personalMediaText}>Personal Media</Text>

              <View style={styles.imageContainer}>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={styles.selectedImage}
                    />
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearSelectedImage}
                    >
                      <Icon name="times" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Image
                      source={require('../../assets/images/ArtistHomePagePlaceholder2.jpg')}
                      style={styles.placeholderImage}
                    />
                    <View style={styles.overlayTextContainer}>
                      <Text style={styles.overlayText}>Unleash Your Reach </Text>
                    </View>
                  </View>
                )}
              </View>


              <View style={styles.pictureContainer}>
                <TouchableOpacity
                  style={styles.pictureButton}
                  onPress={takePicture}
                >
                  <FontAwesome5
                    name="camera"
                    size={35}
                    color="#C0C0C0"
                    style={styles.cameraIcon}
                  />
                  <Text style={styles.buttonText}>Take Picture</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pictureButton}
                  onPress={uploadFile}
                >
                  <FontAwesome5
                    name="file-upload"
                    size={35}
                    color="#C0C0C0"
                    style={styles.uploadIcon}
                  />
                  <Text style={styles.buttonText}>Upload File</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.radioGroup}>
                <Text style={styles.radioGroupLabel}>Choose what to send:</Text>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setPostType('INVITE_PHOTO')}
                >
                  <Icon
                    name={postType === 'INVITE_PHOTO' ? 'dot-circle-o' : 'circle-o'}
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.radioLabel}>Invite + Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setPostType('INVITE_ONLY')}
                >
                  <Icon
                    name={postType === 'INVITE_ONLY' ? 'dot-circle-o' : 'circle-o'}
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.radioLabel}>Invite Only</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.sliderLabel}>
                  {isMaxRange ? 'Max (1000ft)' : 'Min (100ft)'}
                </Text>
                <Switch
                  value={isMaxRange}
                  onValueChange={() => setIsMaxRange(!isMaxRange)}
                  trackColor={{ false: '#FFF', true: '#E03FD8' }}
                  thumbColor={isMaxRange ? '#FFF' : '#FFF'}
                />
              </View>

              <View style={styles.sendButtonContainer}>
                <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                  <LinearGradient
                    colors={['#00E5FF', '#D500F9']}
                    style={styles.sendButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <TouchableOpacity style={styles.sendButton} onPress={createPost}>
                      <Text style={styles.sendButtonText}>Send Invite</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
              </View>

            </ScrollView>
          </SafeAreaView>
        )}
      </Tab.Screen>
      <Tab.Screen name="Posts" component={ArtistPostsPage} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="DM's" component={DMsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#000',
    padding: wp('1%'), // 5% of screen width for padding
    alignItems: 'center',
    paddingBottom: hp('10%'), // 10% of screen height for bottom padding
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'), // 2% of screen height
  },
  headerText: {
    color: '#C0C0C0',
    fontSize: wp('4%'), // 4% of screen width
    fontWeight: 'bold',
    marginHorizontal: wp('0.5%'), // 0.5% of screen width
    marginVertical: hp('1%'), // 1% of screen height
  },
  logo: {
    width: wp('12%'), // 12% of screen width
    height: hp('6%'), // 6% of screen height
    resizeMode: 'contain',
    left: wp('0%'),
  },
  imageContainer: {
    width: '100%',
    height: hp('22%'), // 22% of screen height
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: hp('0%'), // 3% of screen height
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: hp('1%'), // 1% of screen height
    right: wp('2%'), // 2% of screen width
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: wp('1%'),
    borderRadius: 5,
  },
  pictureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: hp('3%'), // 3% of screen height
  },
  pictureButton: {
    width: '45%',
    height: hp('13%'), // 13% of screen height
    backgroundColor: '#000',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    marginBottom: hp('1%'), // 1% of screen height
  },
  uploadIcon: {
    marginBottom: hp('1%'), // 1% of screen height
  },
  buttonText: {
    color: '#C0C0C0',
    fontSize: wp('4%'), // 4% of screen width
    fontWeight: 'bold',
  },
  switchContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp('1%'), // 3% of screen height
  },
  sliderLabel: {
    fontSize: wp('4%'), // 4% of screen width
    color: '#C0C0C0',
    marginBottom: hp('1%'), // 1% of screen height
  },
  sendButtonContainer: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: hp('3%'), // 3% of screen height
  },
  sendButtonGradient: {
    paddingVertical: hp('2%'), // 2% of screen height
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: wp('4.5%'), // 4.5% of screen width
    fontWeight: 'bold',
  },
  radioGroup: {
    marginBottom: hp('3%'), // 3% of screen height
    alignItems: 'center',
    color: '#C0C0C0',
  },
  radioGroupLabel: {
    fontSize: wp('4%'), // 4% of screen width
    color: '#C0C0C0',
    marginBottom: hp('1%'), // 1% of screen height
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'), // 1% of screen height
    color: '#C0C0C0',
  },
  radioLabel: {
    color: '#C0C0C0',
    marginLeft: wp('2%'), // 2% of screen width
    fontSize: wp('4%'), // 4% of screen width
  },
  personalMediaText: {
    color: '#C0C0C0',
    fontSize: wp('4.5%'), // 4.5% of screen width
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: hp('-1%'), // -1% of screen height
    marginBottom: hp('4%'), // 4% of screen height
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  overlayTextContainer: {
    position: 'absolute',
    top: '30%',
    left: '38%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#C0C0C0',
    fontSize: wp('5%'), // Adjust font size as needed
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HHomePage;
