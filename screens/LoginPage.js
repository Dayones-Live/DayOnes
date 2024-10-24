import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import LogoText from '../assets/components/LogoText';
import useLogin from '../assets/hooks/useLogin';
import {
  check,
  PERMISSIONS,
  RESULTS,
  checkNotifications,
} from 'react-native-permissions';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(null); // Track role separately
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const navigation = useNavigation();
  const userProfile = useSelector((state) => state.userProfile);
  const { mutate: loginUser } = useLogin();

  const checkAllPermissions = async () => {
    try {
      const camera = await check(
        Platform.select({
          ios: PERMISSIONS.IOS.CAMERA,
          android: PERMISSIONS.ANDROID.CAMERA,
        }),
      );
      const library = await check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      );
      const notifications = (await checkNotifications()).status;
      const location = await check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );

      return (
        camera === RESULTS.GRANTED &&
        notifications === RESULTS.GRANTED &&
        location === RESULTS.GRANTED &&
        library === RESULTS.GRANTED
      );
    } catch (error) {
      console.log('Error checking permissions:', error);
      return false;
    }
  };

  // Navigate to the appropriate stack based on user role
  const navigateToAppropriateStack = () => {
    if (!role) {
      return; // Prevent navigating with no role
    }
    if (role === 'ARTIST') {
      navigation.navigate('ArtistStack');
    } else if (role === 'USER') {
      navigation.navigate('FanStack');
    }
  };

  // Update the role and handle navigation based on profile updates
  useEffect(() => {
    if (userProfile?.data?.role) {
      setRole(userProfile.data.role);
      setIsLoading(false); // Ensure loading stops once profile is ready
    }
  }, [userProfile]);

  useEffect(() => {
    if (role && !isLoading) {
      // Once the role is set and not loading, proceed to check permissions
      checkAllPermissions().then((permissions) => {
        setPermissionsGranted(permissions);
        if (permissions) {
          navigateToAppropriateStack();
        } else {
          navigation.navigate('PermissionsScreen');
        }
      });
    }
  }, [role, isLoading]);

  const handleLogin = (retry = false) => {
    if (!username || !password) {
      alert('Validation Error', 'Please enter both username and password.');
      return;
    }
    setIsLoading(true);

    loginUser(
      { email: username, password },
      {
        onSuccess: (data) => {
          setIsLoading(false);

          const userRole = data?.role || userProfile?.data?.role;
          setRole(userRole);
          console.log('User Profile from Redux:', userProfile);
          console.log('Role from API or Redux:', userRole);

          if (userRole === 'ARTIST' || userRole === 'USER') {
            checkAllPermissions().then((permissionsGranted) => {
              setPermissionsGranted(permissionsGranted);
              if (permissionsGranted) {
                navigateToAppropriateStack();
              }
            });
          } else {
            console.log('Unrecognized role, handling silently.'); // Handle silently
          }
        },
        onError: (error) => {
          setIsLoading(false);

          if (error.toString().includes('User is not confirmed')) {
            alert('Account Not Confirmed', 'Please confirm your account to proceed.');
            navigation.navigate('VerifyAccount', { email: username });
          } else if (error.toString().includes('401')) {
            alert('Login Failed', 'Invalid username or password.');
          } else if (error.toString().includes('404')) {
            alert('Login Failed', 'User not found.');
          } else {
            alert('Login Failed', 'An unexpected error occurred.');
          }
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.contentContainer}>
        <View style={styles.topSection}>
          <LogoText />
        </View>

        <View style={styles.middleSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              editable={!isLoading}
            />
          </View>

          <LinearGradient colors={['#ff00ff', '#7000ff']} style={styles.loginButton}>
            <TouchableOpacity onPress={() => handleLogin()} style={styles.fullWidth} disabled={isLoading}>
              <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="google" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Icon name="apple" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.signupText}>
          Didn’t signup yet?{' '}
          <Text onPress={() => navigation.navigate('RegFanPage')} style={styles.signupLink}>
            Signup Now
          </Text>
        </Text>

        <View style={styles.bottomSection}>
          <Text style={styles.artistQuestionText}>Are you an artist?</Text>
          <LinearGradient colors={['#ffcc00', '#ff8800']} style={styles.signupArtistButton}>
            <TouchableOpacity
              style={styles.fullWidth}
              onPress={() => navigation.navigate('RegArtistPage')}
            >
              <Text style={[styles.signupArtistText, { color: '#fff' }]}>Signup as an Artist</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c002b',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  middleSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
  },
  fullWidth: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    borderRadius: 10,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  iconButton: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  signupText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  signupLink: {
    color: '#00ccff',
    textDecorationLine: 'underline',
  },
  bottomSection: {
    alignItems: 'center',
  },
  artistQuestionText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 10,
  },
  signupArtistButton: {
    borderRadius: 10,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    marginBottom: 20,
  },
  signupArtistText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
