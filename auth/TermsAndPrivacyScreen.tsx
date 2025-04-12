import React, { useState } from 'react';
import { View, Text, Button, Alert, AsyncStorage } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TermsAndPrivacyScreen = () => {
  const navigation = useNavigation();

  const handleAccept = async () => {
    try {
      console.log('Saving TOS acceptance...');
      await AsyncStorage.setItem('tosAccepted', 'true');
      console.log('TOS acceptance saved successfully');
      navigation.navigate('PermissionsScreen');
    } catch (error) {
      console.error('Error saving TOS acceptance:', error);
      Alert.alert('Error', 'Failed to save acceptance. Please try again.');
    }
  };

  return (
    <View>
      {/* Render your component content here */}
    </View>
  );
};

export default TermsAndPrivacyScreen; 