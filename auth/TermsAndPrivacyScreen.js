import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Button, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TermsAndPrivacyScreen = () => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [viewing, setViewing] = useState('terms');
  const navigation = useNavigation();

  const handleAccept = async () => {
    if (isAgreed) {
      try {
        await AsyncStorage.setItem('termsAccepted', 'true');
        console.log("Terms accepted and stored successfully");
        navigation.navigate("LoginPage");
      } catch (error) {
        console.error('Error saving acceptance status:', error);
      }
    } else {
      Alert.alert("Please agree to the Terms and Privacy Policy to continue.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>Terms of Service & Privacy Policy</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity onPress={() => setViewing('terms')}>
          <Text style={[styles.toggleText, viewing === 'terms' && styles.activeText]}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewing('privacy')}>
          <Text style={[styles.toggleText, viewing === 'privacy' && styles.activeText]}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.textContainer} contentContainerStyle={styles.scrollContent}>
        {viewing === 'terms' ? (
          <Text style={styles.policyText}>
            DayOnes Terms of Service
            Effective Date: 11/13/2024
            Welcome to Dayones! These Terms of Service ("Terms") govern your use of Dayones and its related services (the "Platform"), including our website, mobile applications, and other products or services that link to these Terms.
            By accessing or using our Platform, you agree to comply with and be bound by these Terms. If you do not agree with these Terms, you must not use our Platform.
            {/* The rest of the full Terms of Service content */}
          </Text>
        ) : (
          <Text style={styles.policyText}>
            DayOnes Privacy Policy
            Effective Date: November 13, 2024
            At DayOnes, we are committed to protecting your privacy. This Privacy Policy explains the types of information we collect, how we use it, and the steps we take to ensure your data is protected.
            {/* The rest of the full Privacy Policy content */}
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsAgreed(!isAgreed)}>
        <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]}>
          {isAgreed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text style={styles.checkboxText}>I agree to the Terms of Service and Privacy Policy</Text>
      </TouchableOpacity>

      <View style={styles.buttonWrapper}>
        <Button title="Agree and Continue" onPress={handleAccept} disabled={!isAgreed} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c0c0c0',
    marginBottom: 10,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  toggleText: {
    fontSize: 16,
    color: 'gray',
  },
  activeText: {
    color: '#c0c0c0',
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: '#1c1c1c',
    padding: 10,
    borderRadius: 5,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  policyText: {
    fontSize: 14,
    color: '#c0c0c0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#c0c0c0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: '#c0c0c0',
  },
  checkboxText: {
    fontSize: 16,
    color: '#c0c0c0',
  },
  buttonWrapper: {
    marginBottom: 20,
  },
});

export default TermsAndPrivacyScreen;
