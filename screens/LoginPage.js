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
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import useLogin from '../assets/hooks/useLogin';
import {
  check,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State to toggle password visibility
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(null);

  const navigation = useNavigation();
  const userProfile = useSelector((state) => state.userProfile);
  const { mutate: loginUser } = useLogin();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('Validation Error', 'Please enter both username and password.');
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

          if (userRole === 'ARTIST' || userRole === 'USER') {
            navigation.navigate(userRole === 'ARTIST' ? 'ArtistStack' : 'FanStack');
          }
        },
        onError: () => {
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.contentContainer}>
        <View style={styles.topSection}>
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
              textContentType="oneTimeCode"
            />
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              key="Password"
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              textContentType="oneTimeCode"
              secureTextEntry={!isPasswordVisible} // Toggles visibility
              autoCapitalize="none"
              returnKeyType="done"
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Feather
                name={isPasswordVisible ? 'eye' : 'eye-off'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <LinearGradient colors={['#ff00ff', '#7000ff']} style={styles.loginButton}>
            <TouchableOpacity
              onPress={handleLogin}
              style={styles.fullWidth}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.signupText}>
          Are you an Artist?{' '}
          <Text
            onPress={() =>
              Alert.alert('Artists!', 'Email DayOnesMedia@gmail.com for more infomation on how to partner with DayOnes.')
            }
            style={styles.signupLink}
          >
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 40,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    textAlign: 'left',
  },
  eyeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    width: 200,
    height: 140,
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
  loginButton: {
    borderRadius: 10,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  signupArtistText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
