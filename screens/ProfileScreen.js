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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { BASEURL } from '../assets/constants';
import LinearGradient from 'react-native-linear-gradient';

const { height } = Dimensions.get('window');

const ProfileScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPasswordUpdateVisible, setPasswordUpdateVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.accessToken);
  const profile = useSelector((state) => state.userProfile || {});
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
                    : require('../assets/images/defaultProfileImage.png')
                }
                style={styles.profilePicture}
              />

              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Change Profile Picture', 'Select an option', [
                    { text: 'Take Picture', onPress: () => console.log('Take Picture') },
                    { text: 'Upload File', onPress: () => console.log('Upload File') },
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
});

export default ProfileScreen;
