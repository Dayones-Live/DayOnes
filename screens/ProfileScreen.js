import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { BASEURL } from '../assets/constants';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageToBucket, uploadSignatureFile } from '../utils';
import { setAccessToken, setUserProfile } from '../assets/redux/actions'; // Adjust the path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { convertToTemporaryFile } from '../assets/components/convertToTemporaryFileHelper';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Linking } from 'react-native';
import styles from './sharedStyles/ProfileScreenStyles';
import { notificationService } from '../assets/services/notificationService';


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
  const [selectedSignatureImage, setSelectedSignatureImage] = useState(null);
  const [isSignatureLoading, setIsSignatureLoading] = useState(false);
  const [showSignatureOptions, setShowSignatureOptions] = useState(false);
  const [loadingText, setLoadingText] = useState('Creating your signature');
  const [subLoadingText, setSubLoadingText] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);
  const logoScale = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const userLogoScale = useRef(new Animated.Value(1)).current;
  const [connectedArtists, setConnectedArtists] = useState([]);

  const animateProgress = (toValue, duration = 3000) => {
    return new Promise((resolve) => {
      Animated.timing(progressAnimation, {
        toValue,
        duration,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease),
      }).start(resolve);
    });
  };

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
        // Clear all auth-related data from AsyncStorage
        await AsyncStorage.multiRemove([
          'authToken',
          'refreshToken',
          'tokenExpiry',
          'userRole',
          'userData'
        ]);
        
        // Clear Redux state
        dispatch(setAccessToken(null));
        dispatch(setUserProfile(null));
        
        // Success message
        Alert.alert('Success', 'Account successfully deleted.');
        
        // Navigate to login page using reset to clear navigation stack
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginPage' }],
        });
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
      // First unregister the device
      await notificationService.unregister();

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
        // Clear all auth-related data from AsyncStorage
        await AsyncStorage.multiRemove([
          'authToken',
          'refreshToken',
          'tokenExpiry',
          'userRole',
          'userData'
        ]);
        
        // Clear Redux store
        dispatch(setAccessToken(null));
        dispatch(setUserProfile(null));
        
        console.log('User logged out and all auth data cleared');

        // Notify user and navigate to login page using reset to clear navigation stack
        Alert.alert('Logged Out', 'You have been logged out successfully.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginPage' }],
        });
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

  const renderOptions = () => (
    <View style={styles.optionsBox}>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => {
          setOptionsVisible(false);
          setPasswordUpdateVisible(true);
        }}>
        <Text style={styles.optionText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => {
          setOptionsVisible(false);
          fetchBlockedUsers();
          try {
            console.log('Attempting to navigate to BlockedUsers with data:', { blockedUsers });
            if (profile.data?.role === 'ARTIST') {
              navigation.navigate('ArtistStack', {
                screen: 'BlockedUsers',
                params: { 
                  blockedUsers: { data: { blocked_users: blockedUsers } }
                }
              });
            } else {
              navigation.navigate('FanStack', {
                screen: 'BlockedUsers',
                params: { 
                  blockedUsers: { data: { blocked_users: blockedUsers } }
                }
              });
            }
          } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Error', 'Failed to open blocked users screen. Please try again.');
          }
        }}>
        <Text style={styles.optionText}>Blocked Users</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => {
          setOptionsVisible(false);
          setDeleteModalVisible(true);
        }}>
        <Text style={[styles.optionText, { color: '#FF3B30' }]}>Delete Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, styles.lastOptionButton]}
        onPress={() => {
          setOptionsVisible(false);
          handleLogout();
        }}>
        <Text style={[styles.optionText, { color: '#FF3B30' }]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const takeSignaturePicture = async () => {
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;
  
      const result = await check(permission);
  
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        saveToPhotos: true,
      };
  
      if (result === RESULTS.GRANTED) {
        launchCamera(options, async (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorMessage) {
            console.error('ImagePicker Error: ', response.errorMessage);
          } else if (response.assets && response.assets.length > 0) {
            const selectedImage = response.assets[0];
            try {
              const fileUri = Platform.OS === 'android' && selectedImage.uri.startsWith('content://')
                ? await convertToTemporaryFile(selectedImage.uri, 'png')
                : selectedImage.uri;

              await createSignature({ ...selectedImage, uri: fileUri });
            } catch (error) {
              console.error('Error handling selected file:', error);
            }
          }
        });
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          launchCamera(options, async (response) => {
            if (response.didCancel) {
              console.log('User cancelled image picker');
            } else if (response.errorMessage) {
              console.error('ImagePicker Error: ', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
              const selectedImage = response.assets[0];
              try {
                const fileUri = Platform.OS === 'android' && selectedImage.uri.startsWith('content://')
                  ? await convertToTemporaryFile(selectedImage.uri, 'png')
                  : selectedImage.uri;

                await createSignature({ ...selectedImage, uri: fileUri });
              } catch (error) {
                console.error('Error handling selected file:', error);
              }
            }
          });
        }
      } else if (result === RESULTS.BLOCKED) {
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
    }
  };

  const uploadSignatureImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
    };
    
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];
        try {
          const fileUri = Platform.OS === 'android' && selectedImage.uri.startsWith('content://')
            ? await convertToTemporaryFile(selectedImage.uri, 'png')
            : selectedImage.uri;

          await createSignature({ ...selectedImage, uri: fileUri });
        } catch (error) {
          console.error('Error handling selected file:', error);
        }
      }
    });
  };

  const updateLoadingState = async () => {
    const states = [
      { main: 'Creating your signature', sub: 'Verifying your photo', progress: 0.25 },
      { main: 'Creating your signature', sub: 'Analyzing signature style', progress: 0.5 },
      { main: 'Creating your signature', sub: 'Generating digital version', progress: 0.75 },
      { main: 'Creating your signature', sub: 'Almost done', progress: 0.9 }
    ];

    for (const state of states) {
      if (isCancelled) return;
      setLoadingText(state.main);
      setSubLoadingText(state.sub);
      await animateProgress(state.progress);
    }
  };

  const animateLogo = () => {
    logoScale.setValue(0);
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const createSignature = async (image) => {
    if (!image || !image.uri) {
      Alert.alert("Error", "No image selected. Please try again.");
      return;
    }

    setIsSignatureLoading(true);
    setIsCancelled(false);
    progressAnimation.setValue(0);
    animateLogo();
    
    try {
      updateLoadingState();

      const s3Url = await uploadSignatureFile(accessToken, image.uri);
      if (!s3Url) {
        throw new Error("Failed to upload image to S3");
      }

      const payload = new URLSearchParams({ url: s3Url }).toString();
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await axios.post(`${BASEURL}/api/v1/signature/create`, payload, { headers });

      if (response.status === 200 || response.status === 201) {
        setLoadingText('Creating your signature');
        setSubLoadingText('Complete!');
        await animateProgress(1, 1000);
        await new Promise(resolve => setTimeout(resolve, 500));
        navigation.navigate('ArtistSignatures');
      } else {
        throw new Error('Failed to create signature');
      }
    } catch (error) {
      if (!isCancelled) {
        console.error('Error creating signature:', error);
        Alert.alert('Error', 'An error occurred while creating the signature. Please try again.');
      }
    } finally {
      setIsSignatureLoading(false);
      setLoadingText('');
      setSubLoadingText('');
      progressAnimation.setValue(0);
    }
  };

  const deleteSignature = async (signatureId) => {
    try {
      const response = await axios.delete(`${BASEURL}/api/v1/signature/${signatureId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Signature deleted successfully');
        // Refresh signatures list
        fetchSignatures();
      } else {
        throw new Error('Failed to delete signature');
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      Alert.alert('Error', 'Failed to delete signature. Please try again.');
    }
  };

  // Add new animation function for user logo
  const animateUserLogo = () => {
    Animated.sequence([
      Animated.spring(userLogoScale, {
        toValue: 1.1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(userLogoScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Add useEffect for periodic animation
  useEffect(() => {
    const interval = setInterval(() => {
      animateUserLogo();
    }, 5000);

    // Initial animation
    animateUserLogo();

    return () => clearInterval(interval);
  }, []);

  // Add function to fetch connected artists
  const fetchConnectedArtists = async () => {
    if (!accessToken) {
      console.log('No access token available, skipping fetchConnectedArtists');
      return;
    }
    
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/?pageNo=1&pageSize=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postsData = response.data?.data?.posts || [];
      
      // Extract unique artists from posts
      const uniqueArtists = postsData.reduce((acc, post) => {
        if (post.user && !acc.some(artist => artist.id === post.user.id)) {
          acc.push({
            id: post.user.id,
            name: post.user.full_name,
            avatarUrl: post.user.avatar_url
          });
        }
        return acc;
      }, []);

      setConnectedArtists(uniqueArtists);
    } catch (error) {
      console.error('Error fetching connected artists:', error);
    }
  };

  // Add useEffect to fetch artists when component mounts
  useEffect(() => {
    if (profile.data?.role !== 'ARTIST' && accessToken) {
      fetchConnectedArtists();
    }
  }, [profile.data?.role, accessToken]);

  return (
    <>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.container}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleNavigateHome}>
            <Icon name="home" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.menuIcon}
            onPress={() => setOptionsVisible(true)}>
            <Icon name="ellipsis-v" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 20 }}>
            
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
                  <Icon name="camera" size={14} color="#fff" />
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

            {/* Role-specific Sections */}
            {profile.data?.role === 'ARTIST' ? (
              <View style={styles.signatureSection}>
                <Text style={styles.sectionTitle}>Signature Management</Text>
                <View style={styles.signatureButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.signatureButton}
                    onPress={() => {
                      Alert.alert(
                        'Create Signature',
                        'Choose an option',
                        [
                          { text: 'Take Photo', onPress: takeSignaturePicture },
                          { text: 'Upload Photo', onPress: uploadSignatureImage },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}>
                    <View style={styles.signatureButtonContent}>
                      <Icon name="plus-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.signatureButtonText}>Create{'\n'}Signature</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.signatureButton}
                    onPress={() => navigation.navigate('ArtistSignatures')}>
                    <View style={styles.signatureButtonContent}>
                      <Icon name="folder" size={20} color="#FFFFFF" />
                      <Text style={styles.signatureButtonText}>View{'\n'}Signatures</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.connectedArtistsSection}>
                <Text style={styles.sectionTitle}>Your DayOnes Artists</Text>
                {connectedArtists.length > 0 ? (
                  <View style={styles.artistsGrid}>
                    {connectedArtists.map((artist) => (
                      <View 
                        key={artist.id} 
                        style={styles.artistCard}
                      >
                        <Image 
                          source={{ uri: artist.avatarUrl || 'https://example.com/default-avatar.png' }}
                          style={styles.artistAvatar}
                        />
                        <Text style={styles.artistName}>{artist.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noArtistsText}>No connected artists yet</Text>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Loading Overlay */}
        {isSignatureLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <Animated.Image 
                source={require('../assets/images/1024.png')} 
                style={[
                  styles.loadingIcon,
                  {
                    transform: [
                      { scale: logoScale }
                    ]
                  }
                ]} 
              />
              <Text style={styles.loadingMainText}>{loadingText}</Text>
              <Text style={styles.loadingSubText}>{subLoadingText}</Text>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

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

        <Modal
          visible={optionsVisible}
          animationType="fade"
          transparent={true}>
          <TouchableWithoutFeedback onPress={() => setOptionsVisible(false)}>
            <View style={styles.optionsModalContainer}>
              {renderOptions()}
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </>
  );
};

export default ProfileScreen;
