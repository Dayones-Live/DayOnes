import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import LinearGradient from 'react-native-linear-gradient';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useSelector} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton'; // Import ProfilePictureButton
import NotificationsScreen from '../NotificationsScreen';
import DMsScreen from '../DMsScreen';
import ArtistPostsPage from './ArtistPostsPage';
import {BASEURL} from '../../assets/constants';
import {uploadImageToBucket} from '../../utils';

const {width} = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const HHomePage = () => {
  const [sliderValue, setSliderValue] = useState([100]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // Store S3 URL
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

  useEffect(() => {
    if (route.params?.editedImage) {
      setSelectedImage(route.params.editedImage);
    }
  }, [route.params?.editedImage]);

  const geolocationData = useSelector(state => state.geolocationData) || {
    latitude: 0.0,
    longitude: 0.0,
    geohash: 'abc123',
  };

  const options = {
    mediaType: 'photo',
    includeBase64: false, // Changed to false to use URI
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

        navigation.navigate('EditScreen', {selectedImage: capturedImage});
      }
    });
  };

  // Upload image to S3 bucket
  const uploadImageToS3 = async (imageUri) => {
    try {
      const s3Url = await uploadImageToBucket(imageUri, 'signatures', accessToken);
      setUploadedImageUrl(s3Url); // Set uploaded image URL for post
      console.log('Image uploaded successfully:', s3Url);
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

        console.log('Selected image URI:', uploadedImage.uri);
        setSelectedImage(uploadedImage);
        uploadImageToS3(uploadedImage.uri); // Upload image to S3 and store URL
      }
    });
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
  };

  const createPost = async () => {
    if (!uploadedImageUrl) {
      alert('Please upload an image before creating a post.');
      return;
    }

    const postData = {
      imageUrl: uploadedImageUrl, // Use the actual uploaded image URL
      range: sliderValue[0],
      type: 'INVITE_PHOTO',
      latitude: geolocationData.latitude.toString(),
      longitude: geolocationData.longitude.toString(),
      locale: geolocationData.locale || 'US',
    };

    console.log('Creating post with data:', postData);

    try {
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
        alert('Post created successfully!');
      } else {
        console.error('Error response:', jsonResponse);
        alert(
          `Failed to create post: ${jsonResponse.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Network or parsing error:', error);
      alert(
        'An error occurred while creating the post. Check console for details.',
      );
    }
  };

  const feetToMeters = feet => {
    return Math.round(feet * 0.3048);
  };

  return (
    <Tab.Navigator
      initialRouteName="Main"
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
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
          backgroundColor: '#0c002b', // Navy blue background
          borderTopWidth: 0,
        },
        headerShown: false,
      })}>
      <Tab.Screen name="Main" options={{tabBarLabel: 'Home'}}>
        {() => (
          <View style={styles.container}>
            {/* Add Profile Picture Button in the top-left corner */}
            <ProfilePictureButton />

            <View style={styles.header}>
              <Text style={styles.title}>Autographs & Invites</Text>
            </View>

            <LinearGradient
              colors={['#FF00FF', '#001F3F']}
              style={styles.imageContainer}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{uri: selectedImage.uri}}
                    style={styles.selectedImage}
                  />
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearSelectedImage}>
                    <Icon name="times" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.imageText}>Talk to your fans</Text>
              )}
            </LinearGradient>

            <View style={styles.pictureContainer}>
              <TouchableOpacity
                style={styles.pictureButton}
                onPress={takePicture}>
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
                onPress={uploadFile}>
                <Icon
                  name="file"
                  size={30}
                  color="#00FFFF"
                  style={styles.icon}
                />
                <Text style={styles.buttonText}>Upload File</Text>
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
                onValuesChange={value => setSliderValue(value)}
                min={10}
                max={2000}
                step={10}
                selectedStyle={styles.sliderSelectedStyle}
                unselectedStyle={styles.sliderUnselectedStyle}
                trackStyle={styles.sliderTrackStyle}
                markerStyle={styles.sliderMarkerStyle}
              />
            </View>

            <TouchableOpacity style={styles.sendButton} onPress={createPost}>
              <Text style={styles.sendButtonText}>Send Invite</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#0c002b', // Navy blue background
    padding: 20,
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
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
  imageText: {
    position: 'absolute',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedImage: {
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
    height: 120,
    backgroundColor: '#001F3F',
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
  sendButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#FF0080',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HHomePage;