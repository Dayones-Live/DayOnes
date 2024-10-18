import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { BASEURL } from '../assets/constants';
import LogoText from '../assets/components/LogoText';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToBucket } from '../utils';
import { setUserProfile } from '../assets/redux/actions';

const { height } = Dimensions.get('window');

const ProfileScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const dispatch = useDispatch();
  const accessToken = useSelector(state => state.accessToken);
  const profile = useSelector(state => state.userProfile || {});
  const navigation = useNavigation();

  const handleLogout = async () => {
    const url = `${BASEURL}/api/v1/auth/signout`;
    try {
      const response = await axios.post(url, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 200) {
        Alert.alert('Logged Out', 'You have been logged out successfully.');
        navigation.navigate('LoginPage');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleImageUpload = async (imageUri) => {
    try {
      const s3Url = await uploadImageToBucket(imageUri, 'profile-pictures', accessToken);
      setSelectedImage(s3Url);
      await updateProfilePicture(s3Url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Error', 'Image upload failed. Please try again.');
    }
  };

  const handleTakePicture = () => {
    launchCamera({ mediaType: 'photo', includeBase64: false }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const capturedImage = response.assets[0];
        setSelectedImage(capturedImage.uri);
        handleImageUpload(capturedImage.uri);
      }
    });
  };

  const handleUploadFile = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uploadedImage = response.assets[0];
        setSelectedImage(uploadedImage.uri);
        handleImageUpload(uploadedImage.uri);
      }
    });
  };

  const updateProfilePicture = async (avatarUrl) => {
    const url = `${BASEURL}/api/v1/user/update-user`;
    const payload = {
      avatarUrl,
      fullName: profile.data?.full_name || 'User',
      role: profile.data?.role || 'fan',
      phoneNumber: profile.data?.phone_number || 'undefined',
    };
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(url, payload, { headers });
      if (response.status === 201) {
        Alert.alert('Profile Updated', 'Your profile picture has been updated.');
        dispatch(setUserProfile(response.data.data)); // Update Redux profile data
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleNavigateHome = () => {
    if (profile.data?.role === 'ARTIST') {
      navigation.navigate('HHomePage'); // Navigate to artist's home page
    } else if (profile.data?.role === 'USER') {
      navigation.navigate('FanStack'); // Navigate to user's home page
    } else {
      Alert.alert('Error', 'Unknown role. Cannot navigate to the home page.');
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#0c002b" barStyle="light-content" />
      <View style={styles.container}>
        <TouchableOpacity style={styles.homeButton} onPress={handleNavigateHome}>
          <Icon name="home" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <LogoText />
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <Image
            source={selectedImage ? { uri: selectedImage } : profile.data?.avatar_url ? { uri: profile.data.avatar_url } : require('../assets/images/defaultProfileImage.png')}
            style={styles.profilePicture}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              Alert.alert('Change Profile Picture', 'Select an option', [
                { text: 'Take Picture', onPress: handleTakePicture },
                { text: 'Upload File', onPress: handleUploadFile },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          >
            <Text style={styles.buttonText}>Change Picture</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={profile.data?.full_name || 'Name'}
            placeholder="Name"
            placeholderTextColor="#FFF"
            editable={false}
          />

          <TextInput
            style={styles.input}
            value={profile.data?.email || 'youremail@gmail.com'}
            placeholder="youremail@gmail.com"
            placeholderTextColor="#FFF"
            editable={false}
          />

          <View style={[styles.line, { marginBottom: 15 }]} />

          {profile.data?.role === 'ARTIST' && (
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SignaturePage')}>
              <Text style={styles.buttonText}>Manage Signatures/Texts</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c002b',
    justifyContent: 'center',
    padding: 20,
    height: height,
  },
  homeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  profileSection: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#333',
    color: '#FFF',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    width: '100%',
    textAlign: 'center',
  },
  line: {
    width: '100%',
    height: 1,
    backgroundColor: '#888',
    marginVertical: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
    width: '100%',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
  },
  logoutButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
