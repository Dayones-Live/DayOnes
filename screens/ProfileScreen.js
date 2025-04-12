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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { BASEURL } from '../assets/constants';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageToBucket } from '../utils';
import { setAccessToken, setUserProfile } from '../assets/redux/actions'; // Adjust the path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { convertToTemporaryFile } from '../assets/components/convertToTemporaryFileHelper';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import styles from './sharedStyles/ProfileScreenStyles';


const ProfileScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPasswordUpdateVisible, setPasswordUpdateVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const accessToken = useSelector(state => state.accessToken);
  const profile = useSelector(state => state.userProfile || {});
  const navigation = useNavigation();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const dispatch = useDispatch();

  const fetchBlockedUsers = async () => {
    try {
      console.log('Fetching blocked users...');
      const response = await axios.get(`${BASEURL}/api/v1/blocks`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const blockedUsersData = response.data.data.blocked_users || [];
      console.log(
        'Blocked Users Raw Response:',
        JSON.stringify(response.data, null, 2),
      );

      // Log each blocked user's full object
      blockedUsersData.forEach((user, index) => {
        console.log(
          `Blocked User ${index + 1}:`,
          JSON.stringify(user, null, 2),
        );
      });

      setBlockedUsers(blockedUsersData);
    } catch (error) {
      console.error(
        'Error fetching blocked users:',
        error.response?.data || error.message,
      );
      Alert.alert('Error', 'Failed to fetch blocked users.');
    }
  };

  const deleteUser = async () => {
    if (deleteInput.trim().toLowerCase() !== 'delete') {
      Alert.alert('Error', 'Please type "delete" to confirm.');
      return;
    }

    const url = `${BASEURL}/api/v1/user/delete-user`;

    try {
      console.log('Deleting user with ID:', profile.id);

      // Navigate to the login page first
      navigation.navigate('LoginPage');

      // Slight delay to ensure navigation occurs
      await new Promise(resolve => setTimeout(resolve, 500));

      // Make the API call to delete the user
      const response = await axios.post(
        url,
        { id: profile.id }, // Profile ID from Redux state
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        // Success message
        Alert.alert('Success', 'Account successfully deleted.');

        // Clear Redux state
        dispatch(setAccessToken(null));
        dispatch(setUserProfile(null));
      }
    } catch (error) {
      console.error('Error deleting user:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete user. Please try again.');
    } finally {
      // Reset modal state and input field
      setDeleteModalVisible(false);
      setDeleteInput('');
    }
  };



  const unblockUser = async userId => {
    try {
      console.log(`Unblocking user with ID: ${userId}`);
      const response = await axios.delete(
        `${BASEURL}/api/v1/blocks/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      console.log('Unblock User Response:', response.data);

      // Filter the blocked users list to remove the unblocked user
      setBlockedUsers(prev =>
        prev.filter(user => user.blockedUser.id !== userId),
      );

      Alert.alert('Success', 'User has been unblocked.');
    } catch (error) {
      console.error(
        'Error unblocking user:',
        error.response?.data || error.message,
      );
      Alert.alert('Error', 'Failed to unblock user.');
    }
  };

  const handleImageUpload = async imageUri => {
    try {
      // Use the helper function for Android scoped storage compatibility
      const filePath =
        Platform.OS === 'android' && imageUri.startsWith('content://')
          ? await convertToTemporaryFile(imageUri, 'jpg')
          : imageUri;

      const s3Url = await uploadImageToBucket(
        filePath,
        'profile-pictures',
        accessToken,
      );
      setSelectedImage(s3Url);
      await updateProfilePicture(s3Url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Error', 'Image upload failed. Please try again.');
    }
  };

  const handleUploadFile = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: false },
      async response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.error('ImagePicker Error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const uploadedImage = response.assets[0];
          let imageUri = uploadedImage.uri;

          try {
            // Use the helper function for scoped storage
            if (
              Platform.OS === 'android' &&
              imageUri.startsWith('content://')
            ) {
              imageUri = await convertToTemporaryFile(imageUri, 'jpg');
            }

            // Set the preview image and then upload
            setSelectedImage(imageUri);
            await handleImageUpload(imageUri);
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }
      },
    );
  };

  const handleTakePicture = () => {
    launchCamera({ mediaType: 'photo', includeBase64: false }, response => {
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

  const updateProfilePicture = async avatarUrl => {
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
        Alert.alert(
          'Profile Updated',
          'Your profile picture has been updated.',
        );
        dispatch(setUserProfile(response.data.data));
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    const url = `${BASEURL}/api/v1/auth/signout`;
    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        // Clear local storage
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userRole');
        console.log('User logged out and AsyncStorage cleared');

        // Notify user and navigate to login page
        Alert.alert('Logged Out', 'You have been logged out successfully.');
        navigation.navigate('LoginPage');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const updatePasswordHandler = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(
        'Error',
        'Both Previous Password and New Password are required.',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Error',
        'New Password and Confirm New Password do not match.',
      );
      return;
    }
    try {
      const response = await axios.post(
        `${BASEURL}/api/v1/auth/update-password`,
        {
          previousPassword: currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.status === 200) {
        Alert.alert('Success', 'Password updated successfully!');
        setPasswordUpdateVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message?.join('\n') ||
        'Failed to update password. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleNavigateHome = () => {
    if (profile.data?.role === 'ARTIST') {
      navigation.navigate('ArtistStack', {
        screen: 'MainTabs',
        params: {
          screen: 'Main'
        }
      });
    } else if (profile.data?.role === 'USER') {
      navigation.navigate('FanStack', {
        screen: 'Home'
      });
    } else {
      Alert.alert('Error', 'Unknown role. Cannot navigate to the home page.');
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleNavigateHome}>
                <Icon name="home" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Profile</Text>
              <TouchableOpacity
                style={styles.menuIcon}
                onPress={() => setOptionsVisible(true)}>
                <Icon name="ellipsis-v" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Profile Image Section */}
            <View style={styles.profileImageContainer}>
              <View style={styles.imageWrapper}>
                <Image
                  source={
                    selectedImage
                      ? { uri: selectedImage }
                      : profile.data?.avatar_url
                        ? { uri: profile.data.avatar_url }
                        : require('../assets/images/defaultProfileImage.jpg')
                  }
                  style={styles.profileImage}
                />
                <TouchableOpacity
                  style={styles.editImageButton}
                  onPress={() =>
                    Alert.alert('Change Profile Picture', 'Select an option', [
                      { text: 'Take Picture', onPress: handleTakePicture },
                      { text: 'Upload File', onPress: handleUploadFile },
                      { text: 'Cancel', style: 'cancel' },
                    ])
                  }>
                  <Icon name="camera" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.data?.full_name || 'Name'}
                  editable={false}
                  placeholderTextColor="#8E8E93"
                />
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={profile.data?.email || 'email@example.com'}
                  editable={false}
                  placeholderTextColor="#8E8E93"
                />
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Role</Text>
                <TextInput
                  style={styles.input}
                  value={profile.data?.role || 'User'}
                  editable={false}
                  placeholderTextColor="#8E8E93"
                />
              </View>
            </View>

            {/* Actions Section */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setPasswordUpdateVisible(!isPasswordUpdateVisible)}>
                <Text style={styles.actionButtonText}>
                  {isPasswordUpdateVisible ? 'Cancel Password Update' : 'Update Password'}
                </Text>
              </TouchableOpacity>

              {isPasswordUpdateVisible && (
                <View style={styles.passwordForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Current Password"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, styles.submitButton]}
                    onPress={updatePasswordHandler}>
                    <Text style={styles.actionButtonText}>Update Password</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Modals */}
            <Modal
              visible={isDeleteModalVisible}
              transparent={true}
              animationType="slide">
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Delete Account</Text>
                  <Text style={styles.modalMessage}>
                    This action cannot be undone. Please type "delete" to confirm.
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Type 'delete' to confirm"
                    placeholderTextColor="#8E8E93"
                    value={deleteInput}
                    onChangeText={setDeleteInput}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setDeleteModalVisible(false);
                        setDeleteInput('');
                      }}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteButton]}
                      onPress={deleteUser}>
                      <Text style={styles.deleteButtonText}>Delete Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Options Modal */}
            <Modal
              visible={optionsVisible}
              animationType="fade"
              transparent={true}>
              <TouchableWithoutFeedback onPress={() => setOptionsVisible(false)}>
                <View style={styles.optionsModalContainer}>
                  <View style={styles.optionsBox}>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => {
                        setOptionsVisible(false);
                        setMenuVisible(true);
                        fetchBlockedUsers();
                      }}>
                      <Text style={styles.optionText}>Blocked Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionButton, styles.deleteOptionButton]}
                      onPress={() => {
                        setOptionsVisible(false);
                        setDeleteModalVisible(true);
                      }}>
                      <Text style={styles.deleteOptionText}>Delete Account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionButton, styles.lastOptionButton]}
                      onPress={() => setOptionsVisible(false)}>
                      <Text style={styles.optionText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
};


export default ProfileScreen;
