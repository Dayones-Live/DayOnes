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
  Image,
  Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
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
  const [role, setRole] = useState(null);
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

  const navigateToAppropriateStack = () => {
    if (!role) {
      return;
    }
    if (role === 'ARTIST') {
      navigation.navigate('ArtistStack');
    } else if (role === 'USER') {
      navigation.navigate('FanStack');
    }
  };

  useEffect(() => {
    if (userProfile?.data?.role) {
        setRole(userProfile.data.role);
        console.log('useEffect triggered: userProfile role is:', userProfile.data.role);
    } else {
        console.log('useEffect triggered: No role found in userProfile.');
    }
    setIsLoading(false);
}, [userProfile]);


  useEffect(() => {
    if (role && !isLoading) {
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
          
          // Debugging statements
          console.log('Data from API:', data);
          console.log('User Profile from Redux:', userProfile);
          console.log('Role from API or Redux:', userRole);
          console.log('Final role value used for navigation:', userRole);
  
          if (userRole === 'ARTIST' || userRole === 'USER') {
            checkAllPermissions().then((permissionsGranted) => {
              setPermissionsGranted(permissionsGranted);
              if (permissionsGranted) {
                navigateToAppropriateStack();
              }
            });
          } else {
            console.log('Unrecognized role, handling silently.');
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
          {/* Updated the size to 2.5x */}
          <Image
            source={require('../assets/images/1024.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.middleSection}>
        <View style={styles.inputContainer}>
  <TextInput
    key="Email"
    style={styles.input}
    placeholder="Email"
    placeholderTextColor="#888"
    value={username}
    onChangeText={setUsername}
    editable={!isLoading}
  />
</View>

<View style={styles.passwordfield}>
  <TextInput
    key="Password"
    style={styles.passwordfield}
    placeholder="Password"
    placeholderTextColor="#888"
    value={password}
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

        <Text style={styles.signupText}>
          Are you an Artist?{' '}
          <Text onPress={() => Alert.alert('Artists!', 'Email DayOnesMedia@gmail.com for more infomation on how to partner with DayOnes.')} style={styles.signupLink}>
            Contact Us!
          </Text>
        </Text>

        <View style={styles.bottomSection}>
          <Text style={styles.artistQuestionText}>Don't have an account?</Text>
          <LinearGradient colors={['#ffcc00', '#ff8800']} style={styles.signupArtistButton}>
            <TouchableOpacity
              style={styles.fullWidth}
              onPress={() => navigation.navigate('RegFanPage')}
            >
              <Text style={[styles.signupArtistText, { color: '#fff' }]}>Signup</Text>
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
    backgroundColor: '#000',
  },
  passwordfield:{
    height: 50,
    width:'100%',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 8,
    color: '#fff',
    marginBottom: 40,
    fontSize: 18,
    marginRight:0,
    textAlign:'left' ,
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
  logo: {
    width: 200,  // Increased width 2.5x
    height: 140, // Increased height 2.5x
  },
  middleSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#fff',
    marginBottom: 20,
    fontSize: 18,
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
