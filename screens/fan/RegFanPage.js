import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Image,
  Dimensions,
  ImageBackground,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import CountryPicker from 'react-native-country-picker-modal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');

const RegFanPage = () => {
  const navigation = useNavigation();
  const [name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [callingCode, setCallingCode] = useState('1');

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !name || !phoneNumber) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    try {
      const response = await axios.post(`${BASEURL}/api/v1/auth/signup`, {
        email,
        password,
        role: 'USER',
        name,
        phoneNumber: `+${callingCode}${phoneNumber.replace(/\D/g, '')}`,
      });

      if (response.status === 200) {
        Alert.alert('Signup Successful', 'Please check your email for the verification code.');
        navigation.navigate('VerifyAccount', { email });
      } else {
        Alert.alert('Signup Failed', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Signup Error', error.response?.data?.message || 'An unexpected error occurred.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollViewContent}>
        <ImageBackground
          source={require('../../assets/images/background.png')}
          style={styles.backgroundImage}
        >
          <View style={styles.contentContainer}>
            <View style={styles.topSection}>
              <Image
                source={require('../../assets/images/1024.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Icon name="envelope" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#888"
                  value={name}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.phoneInputWrapper}>
                <View style={styles.flagContainer}>
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCallingCode
                    withEmoji
                    onSelect={(country) => {
                      setCountryCode(country.cca2);
                      setCallingCode(country.callingCode[0]);
                    }}
                    containerButtonStyle={styles.flagButton}
                  />
                </View>

                <View style={styles.phoneNumberContainer}>
                  <Text style={styles.callingCodeText}>+{callingCode}</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone Number"
                    placeholderTextColor="#888"
                    keyboardType="default" // Changed to default to show Done button
                    value={phoneNumber}
                    onChangeText={setPhone}
                    onSubmitEditing={Keyboard.dismiss} // Dismiss keyboard on "Done" press
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>

            <LinearGradient colors={['#ff00ff', '#7000ff']} style={styles.signupButton}>
              <TouchableOpacity onPress={handleSignup} style={styles.fullWidth}>
                <Text style={styles.buttonText}>Signup</Text>
              </TouchableOpacity>
            </LinearGradient>

            <Text style={styles.loginText}>
              Already Have an Account?{' '}
              <Text onPress={() => navigation.navigate('LoginPage')} style={styles.loginLink}>
                Login
              </Text>
            </Text>
          </View>
        </ImageBackground>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 200,
    height: 140,
    marginTop: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: '#4B0981',
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: 50,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 15,
    borderColor: '#4B0981',
    borderWidth: 1,
  },
  flagContainer: {
    width: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightColor: '#4B0981',
    borderRightWidth: 1,
  },
  flagButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneNumberContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  callingCodeText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 10,
    height: 50,
  },
  signupButton: {
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
  fullWidth: {
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  loginLink: {
    color: '#00ccff',
    textDecorationLine: 'underline',
  },
});

export default RegFanPage;
