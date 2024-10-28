import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  SafeAreaView, // Import SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoder-reborn';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';
import NotificationsScreen from '../NotificationsScreen';
import DMsScreen from '../DMsScreen';
import ArtistPostsPage from './ArtistPostsPage';
import { BASEURL } from '../../assets/constants';
import { uploadImageToBucket } from '../../utils';
import useSetupNotificationsAndLocation from '../../assets/hooks/useSetupNotificationsAndLocation';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const HHomePage = () => {
  const [sliderValue, setSliderValue] = useState([100]); // Initial value
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // Store S3 URL
  const [postType, setPostType] = useState('INVITE_PHOTO'); // Track whether it's an invite + photo or invite only

  const navigation = useNavigation();
  const route = useRoute();
  const accessToken = useSelector(state => state.accessToken);

  const userProfile = useSelector(state => state.userProfile) || {
    username: 'unknown',
    fullName: 'Unknown User',
  };

  useEffect(() => {
    console.log('UserProfile from Redux:', userProfile);
  }, [userProfile]);

  useSetupNotificationsAndLocation();

  useEffect(() => {
    if (route.params?.editedImage) {
      setSelectedImage(route.params.editedImage);
      uploadImageToS3(route.params.editedImage.uri);
    }
  }, [route.params?.editedImage]);

  const geolocationData = useSelector(state => state.geolocationData) || {
    latitude: 0.0,
    longitude: 0.0,
    geohash: 'abc123',
  };

  const options = {
    mediaType: 'photo',
    includeBase64: false,
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
      setUploadedImageUrl(s3Url);
      console.log('Image uploaded successfully to S3:', s3Url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Image upload failed. Please try again.');
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
    if (postType === 'INVITE_PHOTO' && !selectedImage) {
      Alert.alert('Warning', 'You must select a photo when choosing "Invite + Photo."');
      return;
    }

    let postImageUrl = null;
    if (postType === 'INVITE_PHOTO') {
      postImageUrl = uploadedImageUrl;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const locale = await getLocale(latitude, longitude);

          const postData = {
            imageUrl: postImageUrl,
            range: sliderValue[0],
            type: postType,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            locale: locale,
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
            Alert.alert('Success', 'Post created successfully!');
          } else {
            Alert.alert('Error', `Failed to create post: ${jsonResponse.message || 'Unknown error'}`);
          }
        } catch (error) {
          Alert.alert('Error', 'An error occurred while creating the post.');
        }
      },
      (error) => {
        Alert.alert('Error', 'Failed to get your location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const feetToMeters = feet => Math.round(feet * 0.3048);
  const defaultSliderValues = [10, 50, 100, 500];

  const handleSliderChange = value => {
    const closestValue = defaultSliderValues.reduce((prev, curr) =>
      Math.abs(curr - value[0]) < Math.abs(prev - value[0]) ? curr : prev
    );
    setSliderValue([closestValue]);
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
            case 'DMs':
              iconName = 'envelope-o';
              break;
            default:
              iconName = 'home';
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF0080',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#0c002b',
          borderTopWidth: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Main" options={{ tabBarLabel: 'Home' }}>
        {() => (
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
              <ProfilePictureButton />

              <View style={styles.header}>
                <Image 
                  source={require('../../assets/images/1024.png')} 
                  style={styles.logo} 
                />
              </View>

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
                  <Image
                    source={require('../../assets/images/ArtistHomePagePlaceholder2.jpg')}
                    style={styles.placeholderImage}
                  />
                )}
              </View>

              <View style={styles.pictureContainer}>
                <TouchableOpacity
                  style={styles.pictureButton}
                  onPress={takePicture}
                >
                  <Icon
                    name="camera"
                    size={30}
                    color="#00FFFF"
                    style={styles.icon}
                  />
                  <Text style={styles.buttonText}>Take Picture</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pictureButton}
                  onPress={uploadFile}
                >
                  <Icon
                    name="file"
                    size={30}
                    color="#00FFFF"
                    style={styles.icon}
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

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Range</Text>

                <Text style={styles.sliderValue}>
                  {sliderValue[0]} feet ({feetToMeters(sliderValue[0])} meters)
                </Text>

                <MultiSlider
                  values={sliderValue}
                  sliderLength={width - 80}
                  min={Math.min(...defaultSliderValues)}
                  max={Math.max(...defaultSliderValues)}
                  step={1}
                  onValuesChange={handleSliderChange}
                  selectedStyle={styles.sliderSelectedStyle}
                  unselectedStyle={styles.sliderUnselectedStyle}
                  trackStyle={styles.sliderTrackStyle}
                  markerStyle={styles.sliderMarkerStyle}
                />
              </View>

              <View style={styles.sendButtonContainer}>
                <LinearGradient
                  colors={['#00E5FF', '#D500F9']} // Blue to pink gradient
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <TouchableOpacity style={styles.sendButton} onPress={createPost}>
                    <Text style={styles.sendButtonText}>Send Invite</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </SafeAreaView>
        )}
      </Tab.Screen>
      <Tab.Screen name="Posts" component={ArtistPostsPage} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="DMs" component={DMsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  logo: {
    width: 100, // Adjust the size of the logo as needed
    height: 50,
    resizeMode: 'contain',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
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
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 5,
    borderRadius: 5,
  },
  pictureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  pictureButton: {
    width: '45%',
    height: 110,
    backgroundColor: '#000',
    borderColor: '#00FFFF',
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 10,
  },
  buttonText: {
    color: '#00FFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  sliderValue: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  sliderSelectedStyle: {
    backgroundColor: '#FF00FF',
    borderRadius: 10,
  },
  sliderUnselectedStyle: {
    backgroundColor: '#555',
    borderRadius: 10,
  },
  sliderTrackStyle: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#444',
  },
  sliderMarkerStyle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#FF00FF',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sendButtonContainer: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden', // Ensures the gradient follows the button shape
    marginVertical: -20,
  },
  sendButtonGradient: {
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  radioGroup: {
    marginBottom: 20,
    alignItems: 'center',
  },
  radioGroupLabel: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioLabel: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
});

export default HHomePage;
