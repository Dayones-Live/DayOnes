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
import LinearGradient from 'react-native-linear-gradient';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToBucket } from '../utils';
import { setUserProfile } from '../assets/redux/actions';

const { height } = Dimensions.get('window');

const ProfileScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
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
        dispatch(setUserProfile(response.data.data));
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
  
    setIsUpdatingPassword(true);
    const url = `${BASEURL}/api/v1/user/update-user`;
    const payload = {
      currentPassword, // Test field
      newPassword,     // Test field
    };
  
    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
  
      console.log('Response from update-user:', response.data);
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Password update attempted. Check response for confirmation.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        Alert.alert('Error', 'Failed to update password. Check server response.');
      }
    } catch (error) {
      console.error('Error testing update-user endpoint:', error.response || error);
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'An error occurred while testing the endpoint.'
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  

  return (
    <>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.container}>
        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.goBack()}>
          <Icon name="home" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/1024.png')} style={styles.logo} />
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <Image
            source={selectedImage ? { uri: selectedImage } : profile.data?.avatar_url ? { uri: profile.data.avatar_url } : require('../assets/images/defaultProfileImage.png')}
            style={styles.profilePicture}
          />

          <TouchableOpacity
            onPress={() =>
              Alert.alert('Change Profile Picture', 'Select an option', [
                { text: 'Take Picture', onPress: handleTakePicture },
                { text: 'Upload File', onPress: handleUploadFile },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          >
            <LinearGradient colors={['#00E5FF', '#D500F9']} style={styles.gradientButtonFullWidth}>
              <Text style={styles.buttonText}>Change Picture</Text>
            </LinearGradient>
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

          <View style={styles.passwordUpdateSection}>
            <Text style={styles.sectionTitle}>Update Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              placeholderTextColor="#FFF"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#FFF"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={handleUpdatePassword} disabled={isUpdatingPassword}>
              <LinearGradient colors={['#00E5FF', '#D500F9']} style={styles.gradientButtonFullWidth}>
                <Text style={styles.buttonText}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 20,
    height: height,
  },
  homeButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    padding: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 40,
    marginTop: -40,
  },
  profileSection: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
    width: '95%',
    alignSelf: 'center',
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
  passwordUpdateSection: {
    marginTop: 20,
    width: '100%',
  },
  gradientButtonFullWidth: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
    paddingHorizontal: 25,
    width: '100%',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 30,
    marginBottom: -15,
    paddingHorizontal: 30,
  },
  logoutButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
