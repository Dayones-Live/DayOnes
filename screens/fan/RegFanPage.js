import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import Feather from 'react-native-vector-icons/Feather'; // Import for the eye icon
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import CountryPicker from 'react-native-country-picker-modal';
import styles from './fanStyles/RegFanPage';
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // For password visibility
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false); // For confirm password visibility

  const handleSignup = async () => {
    // Regular expression to validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password || !confirmPassword || !name) {
      Alert.alert('Validation Error', 'All required fields must be filled.');
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    try {
      const payload = {
        email,
        password,
        role: 'ARTIST',
        name,
      };

      if (phoneNumber) {
        payload.phoneNumber = `+${callingCode}${phoneNumber.replace(/\D/g, '')}`;
      }

      console.log('Signup Payload:', payload);

      const response = await axios.post(`${BASEURL}/api/v1/auth/signup`, payload);

      if (response.status === 200) {
        Alert.alert('Signup Successful', 'Please check your email for the verification code.');
        navigation.navigate('VerifyAccount', { email });
      } else {
        Alert.alert('Signup Failed', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.log(error);

      if (
        error.response &&
        error.response.data &&
        error.response.data.message &&
        error.response.data.message.includes('duplicate key value violates unique constraint')
      ) {
        Alert.alert(
          'Signup Successful',
          'Please check your email for the verification code.'
        );
        navigation.navigate('VerifyAccount', { email });
      } else {
        Alert.alert('Signup Error', error.response?.data?.message || 'An unexpected error occurred.');
      }
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
                  secureTextEntry={!isPasswordVisible} // Toggles visibility
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={isPasswordVisible ? 'eye' : 'eye-off'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#888"
                  secureTextEntry={!isConfirmPasswordVisible} // Toggles visibility
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={isConfirmPasswordVisible ? 'eye' : 'eye-off'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
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
                    placeholder="Phone Number (Optional)"
                    placeholderTextColor="#888"
                    keyboardType="default"
                    value={phoneNumber}
                    onChangeText={setPhone}
                    onSubmitEditing={Keyboard.dismiss}
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



export default RegFanPage;
