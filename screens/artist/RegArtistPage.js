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
  ImageBackground, // Import ImageBackground for the background
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import LogoText from '../../assets/components/LogoText';
import axios from 'axios';
import styles from './artistStyles/RegArtistPageStyles';
import { BASEURL } from '../../assets/constants';


const { width, height } = Dimensions.get('window');

const RegArtistPage = () => {
  const navigation = useNavigation();
  const [name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        role: 'ARTIST',
        name,
        phoneNumber: phoneNumber,
      });

      if (response.status === 200) {
        Alert.alert('Signup Successful', 'Please check your email for the verification code.');
        navigation.navigate('VerifyAccount', { email }); // Navigate to VerifyAccount with email
      } else {
        Alert.alert('Signup Failed', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.log(error)
      Alert.alert('Signup Error', error.response?.data?.message || 'An unexpected error occurred.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Image */}
      <ImageBackground
        source={require('../../assets/images/background.png')}
        // Set your background image here
        style={styles.backgroundImage}
      >
        <View style={styles.contentContainer}>
          <View style={styles.topSection}>
            <LogoText />
            <Image
              source={require('../../assets/images/DayOnesLogo.png')}
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
                placeholder="Full Name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setFullName}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Icon name="phone" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor="#888"
                value={phoneNumber}
                onChangeText={setPhone}
              />
            </View>

          </View>

          <TouchableOpacity style={styles.connectButton}>
            <Text style={styles.connectButtonText}>+ Connect Verified Account</Text>
          </TouchableOpacity>

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
    </SafeAreaView>
  );
};



export default RegArtistPage;
