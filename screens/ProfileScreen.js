import React, { useState, useEffect } from 'react';
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

const ProfileScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPasswordUpdateVisible, setPasswordUpdateVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const accessToken = useSelector((state) => state.accessToken);
  const profile = useSelector((state) => state.userProfile || {});
  const navigation = useNavigation();
  const [optionsVisible, setOptionsVisible] = useState(false);
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
      console.log('Blocked Users Raw Response:', JSON.stringify(response.data, null, 2));

      // Log each blocked user's full object
      blockedUsersData.forEach((user, index) => {
        console.log(`Blocked User ${index + 1}:`, JSON.stringify(user, null, 2));
      });

      setBlockedUsers(blockedUsersData);
    } catch (error) {
      console.error('Error fetching blocked users:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to fetch blocked users.');
    }
  };

  const deleteUser = async () => {
    const url = `${BASEURL}/api/v1/user/delete-user`;

    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Deleting user with ID:", profile.id);

              // Navigate to the login page first
              navigation.navigate('LoginPage');

              // Give a slight delay to ensure navigation occurs before proceeding
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
                }
              );

              if (response.status === 200) {
                Alert.alert("Account Deleted", "Your account has been deleted successfully.");

                // Clear Redux state
                dispatch(setAccessToken(null));
                dispatch(setUserProfile(null));

              }
            } catch (error) {
              console.error("Error deleting user:", error.response?.data || error.message);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to delete user. Please try again."
              );

              // Optionally navigate back to the previous screen if deletion failed
              navigation.navigate('ProfilePage'); // Replace with your profile or previous screen
            }
          },
        },
      ]
    );
  };


  const unblockUser = async (userId) => {
    try {
      console.log(`Unblocking user with ID: ${userId}`);
      const response = await axios.delete(`${BASEURL}/api/v1/blocks/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log('Unblock User Response:', response.data);

      // Filter the blocked users list to remove the unblocked user
      setBlockedUsers((prev) =>
        prev.filter((user) => user.blockedUser.id !== userId)
      );

      Alert.alert('Success', 'User has been unblocked.');
    } catch (error) {
      console.error('Error unblocking user:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to unblock user.');
    }
  };


  const handleImageUpload = async (imageUri) => {
    try {
      // Use the helper function for Android scoped storage compatibility
      const filePath = Platform.OS === 'android' && imageUri.startsWith('content://')
        ? await convertToTemporaryFile(imageUri, 'jpg')
        : imageUri;

      const s3Url = await uploadImageToBucket(filePath, 'profile-pictures', accessToken);
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
      async (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.error('ImagePicker Error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const uploadedImage = response.assets[0];
          let imageUri = uploadedImage.uri;

          try {
            // Use the helper function for scoped storage
            if (Platform.OS === 'android' && imageUri.startsWith('content://')) {
              imageUri = await convertToTemporaryFile(imageUri, 'jpg');
            }

            // Set the preview image and then upload
            setSelectedImage(imageUri);
            await handleImageUpload(imageUri);
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }
      }
    );
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
        }
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
      Alert.alert('Error', 'Both Previous Password and New Password are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New Password and Confirm New Password do not match.');
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
        }
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
        error.response?.data?.message?.join('\n') || 'Failed to update password. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleNavigateHome = () => {
    if (profile.data?.role === 'ARTIST') {
      navigation.navigate('HHomePage');
    } else if (profile.data?.role === 'USER') {
      navigation.navigate('FanStack');
    } else {
      Alert.alert('Error', 'Unknown role. Cannot navigate to the home page.');
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.container}>
            <TouchableOpacity style={styles.homeButton} onPress={handleNavigateHome}>
              <Icon name="home" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuIcon}
              onPress={() => setOptionsVisible(true)} // Show the options modal
            >
              <Icon name="ellipsis-v" size={24} color="#FFF" />
            </TouchableOpacity>


            <View style={styles.logoContainer}>
              <Image source={require('../assets/images/1024.png')} style={styles.logo} />
            </View>

            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Profile</Text>

              <Image
                source={
                  selectedImage
                    ? { uri: selectedImage }
                    : profile.data?.avatar_url
                      ? { uri: profile.data.avatar_url }
                      : require('../assets/images/defaultProfileImage.jpg')
                }
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

              <View style={[styles.line, { marginBottom: 15 }]} />

              {profile.data?.role === 'ARTIST' && (
                <TouchableOpacity onPress={() => navigation.navigate('SignaturePage')}>
                  <LinearGradient colors={['#00E5FF', '#D500F9']} style={styles.gradientButtonFullWidth}>
                    <Text style={styles.buttonText}>Manage Signatures/Texts</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setPasswordUpdateVisible(!isPasswordUpdateVisible)}
                style={styles.gradientButtonFullWidth}
              >
                <Text style={styles.buttonText}>
                  {isPasswordUpdateVisible ? 'Cancel Password Update' : 'Update Password'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteAccountButton}
                onPress={deleteUser}
              >
                <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
              </TouchableOpacity>


              {isPasswordUpdateVisible && (
                <View style={styles.passwordForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Current Password"
                    placeholderTextColor="#AAAAAA"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#AAAAAA"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#AAAAAA"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity style={styles.logoutButton} onPress={updatePasswordHandler}>
                    <Text style={styles.logoutButtonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <Modal visible={menuVisible} animationType="slide" transparent={false}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalHeader}>Blocked Users</Text>
                <FlatList
                  data={blockedUsers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.blockedUserContainer}>
                      <Image
                        source={
                          item.blockedUser.avatar_url
                            ? { uri: item.blockedUser.avatar_url }
                            : require('../assets/images/defaultProfileImage.jpg') // Default image if no avatar
                        }
                        style={styles.blockedUserAvatar}
                      />
                      <Text style={styles.blockedUserText}>
                        {item.blockedUser.full_name || 'Unknown User'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => unblockUser(item.blockedUser.id)} // Use `blockedUser.id`
                        style={styles.unblockButton}
                      >
                        <Text style={styles.unblockButtonText}>Unblock</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />

                <TouchableOpacity
                  onPress={() => setMenuVisible(false)}
                  style={styles.closeModalButton}
                >
                  <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
              </View>
            </Modal>
            <Modal visible={optionsVisible} animationType="fade" transparent={true}>
              <TouchableWithoutFeedback onPress={() => setOptionsVisible(false)}>
                <View style={styles.optionsModalContainer}>
                  <View style={styles.optionsBox}>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => {
                        setOptionsVisible(false); // Close the options menu
                        setMenuVisible(true); // Open the Blocked Users modal
                        fetchBlockedUsers();
                      }}
                    >
                      <Text style={styles.optionText}>View Blocked Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => setOptionsVisible(false)} // Close the options menu
                    >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  homeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  blockedUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D500F9',
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsModalContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Make the background transparent
    justifyContent: 'flex-start', // Align to the top
    alignItems: 'flex-end', // Align to the right
  },
  optionsBox: {
    backgroundColor: '#1C1C1E',
    padding: 10,
    borderRadius: 10,
    marginTop: 50, // Adjust this to match the position of the three dots
    marginRight: 20, // Adjust this to align with the three dots
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: '#FFF',
  },
  blockedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
  },

  menuIcon: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginTop: '11%',
    resizeMode: 'contain',
  },
  profileSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignSelf: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D500F9',
  },
  input: {
    backgroundColor: '#2C2C2E',
    color: '#FFF',
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
  },
  line: {
    width: '100%',
    height: 1,
    backgroundColor: '#444',
    marginVertical: 15,
  },
  gradientButtonFullWidth: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF453A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  logoutButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  passwordForm: {
    width: '100%',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  blockedUserContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  blockedUserText: {
    color: '#FFF',
    fontSize: 16,
  },
  unblockButton: {
    backgroundColor: '#D500F9',
    padding: 10,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: '#FFF',
  },
  closeModalButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FF453A',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  deleteAccountButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },

});

export default ProfileScreen;
