import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { BASEURL } from '../assets/constants';

const VerifyAccount = () => {
  const [confirmationCode, setConfirmationCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || '';
  const inputRefs = useRef([]); // Array of refs for each input box

  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearInterval(timerId);
    }
  }, [resendTimer]);

  const handleVerification = async () => {
    const code = confirmationCode.join('');
    if (code.length < 6) {
      Alert.alert('Validation Error', 'Please enter the complete verification code.');
      return;
    }

    try {
      const response = await axios.post(`${BASEURL}/api/v1/auth/verify`, {
        username: email,
        confirmationCode: code,
      });

      if (response.status === 200) {
        Alert.alert('Verification Successful', 'Your account has been verified.');
        navigation.navigate('LoginPage');
      } else {
        Alert.alert('Verification Failed', 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Verification Error', error.response?.data?.message || 'An unexpected error occurred.');
    }
  };

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;

    try {
      const response = await axios.post(`${BASEURL}/api/v1/auth/resend-confirm-email`, {
        username: email,
      });

      if (response.status === 200) {
        Alert.alert('Resend Successful', `A new confirmation email has been sent to ${email}.`);
        setResendTimer(60);
      } else {
        Alert.alert('Resend Failed', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Resend Error', error.response?.data?.message || 'An unexpected error occurred.');
    }
  };

  const handleCodeChange = (text, index) => {
    const updatedCode = [...confirmationCode];
    updatedCode[index] = text;
    setConfirmationCode(updatedCode);

    if (text) {
      // Move to the next input if not the last one
      if (index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    } else if (!text && index > 0) {
      // Move to the previous input if backspace
      inputRefs.current[index - 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && confirmationCode[index] === '') {
      // Move focus to the previous input without clearing its value
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('LoginPage')}>
          <Icon name="arrow-left" size={28} color="#ffffff" />
        </TouchableOpacity>

        <Image
          source={require('../assets/images/DayOnesLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.header}>Verify Your Account</Text>
        <Text style={styles.subHeader}>
          We have sent a verification code to: {email}
        </Text>

        <View style={styles.otpContainer}>
          {confirmationCode.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              maxLength={1}
              keyboardType="number-pad"
              returnKeyType={index === confirmationCode.length - 1 ? 'done' : 'next'}
              onSubmitEditing={index === confirmationCode.length - 1 ? handleVerification : undefined}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              ref={(ref) => (inputRefs.current[index] = ref)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerification}>
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendEmail}
          disabled={resendTimer > 0}
        >
          <Text style={[styles.resendText, { color: resendTimer > 0 ? '#888888' : '#007bff' }]}>
            {resendTimer > 0 ? `Resend verification code to ${email} in ${resendTimer}s` : `Resend verification code to ${email}`}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    padding: 10,
    zIndex: 1,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 30,
    marginTop: -50,
  },
  header: {
    fontSize: 32,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 18,
    color: '#aaaaaa',
    textAlign: 'center',
    marginBottom: 50,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 40,
  },
  otpInput: {
    width: 55,
    height: 65,
    backgroundColor: '#1c1c1c',
    textAlign: 'center',
    fontSize: 24,
    borderRadius: 8,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#444444',
    marginHorizontal: 6,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 70,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 10,
  },
  resendText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VerifyAccount;
