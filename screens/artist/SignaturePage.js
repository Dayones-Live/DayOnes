import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import axios from 'axios';
import styles from './artistStyles/SignaturePageStyles';
import { BASEURL } from '../../assets/constants';
import { uploadSignatureFile } from '../../utils';
import { convertToTemporaryFile } from '../../assets/components/convertToTemporaryFileHelper';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Linking, Platform } from 'react-native';
const SignaturePage = () => {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const accessToken = useSelector(state => state.accessToken);
  const [isLoading, setIsLoading] = useState(false);


  const options = {
    mediaType: 'photo',
    includeBase64: false,
  };

  const takePicture = async () => {
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;
  
      // Check if permission is granted
      const result = await check(permission);
  
      const options = {
        mediaType: 'photo', // Only allow photos
        includeBase64: false,
        saveToPhotos: true, // Save to user's gallery
      };
  
      if (result === RESULTS.GRANTED) {
        // Permission is already granted; launch the camera
        launchCamera(options, (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorMessage) {
            console.error('ImagePicker Error: ', response.errorMessage);
          } else if (response.assets && response.assets.length > 0) {
            setSelectedImage(response.assets[0]);
            console.log('Selected image:', response.assets[0]);
          }
        });
      } else if (result === RESULTS.DENIED) {
        // Request permission
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          // Permission granted after request; launch the camera
          launchCamera(options, (response) => {
            if (response.didCancel) {
              console.log('User cancelled image picker');
            } else if (response.errorMessage) {
              console.error('ImagePicker Error: ', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
              setSelectedImage(response.assets[0]);
              console.log('Selected image:', response.assets[0]);
            }
          });
        } else {
          // Permission denied
          Alert.alert(
            'Permission Required',
            'Camera access is required to take a picture. Please enable camera permissions in your device settings.',
          );
        }
      } else if (result === RESULTS.BLOCKED) {
        // Permission is blocked; show an alert to guide the user to settings
        Alert.alert(
          'Permission Required',
          'Camera access has been blocked. Please enable it in your device settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
    }
  };

  const uploadFile = () => {
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];
        try {
          const fileUri = Platform.OS === 'android' && selectedImage.uri.startsWith('content://')
            ? await convertToTemporaryFile(selectedImage.uri, 'png')
            : selectedImage.uri;

          setSelectedImage({ ...selectedImage, uri: fileUri });
          console.log('Selected image:', { ...selectedImage, uri: fileUri });
        } catch (error) {
          console.error('Error handling selected file:', error);
        }
      }
    });
  };

  const createSignature = async () => {
    if (!selectedImage) {
      Alert.alert("Please take a picture or upload a file.");
      return;
    }

    setIsLoading(true); // Show loading indicator
    try {
      const s3Url = await uploadSignatureFile(accessToken, selectedImage.uri);
      const payload = new URLSearchParams({ url: s3Url }).toString();
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await axios.post(`${BASEURL}/api/v1/signature/create`, payload, { headers });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Signature created successfully!');
      } else {
        Alert.alert('Error', 'Failed to create signature.');
      }
    } catch (error) {
      console.error('Error creating signature:', error);
      Alert.alert('Error', 'An error occurred while creating the signature.');
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topRightButton} onPress={() => navigation.navigate('ArtistSignatures')}>
          <LinearGradient
            colors={['#00E5FF', '#D500F9']}
            style={styles.topRightButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.topRightButtonText}>My Signatures</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Create Signatures</Text>

      <LinearGradient colors={['#00E5FF', '#D500F9']} style={styles.imageContainer}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage.uri }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Choose or take a picture</Text>
        )}
      </LinearGradient>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.pictureButton} onPress={takePicture}>
          <FontAwesome5 name="camera" size={35} color="#C0C0C0" style={styles.icon} />
          <Text style={styles.buttonText}>Take Picture</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pictureButton} onPress={uploadFile}>
          <FontAwesome5 name="file-upload" size={35} color="#C0C0C0" style={styles.icon} />
          <Text style={styles.buttonText}>Upload File</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D500F9" />
          <Text style={styles.loadingText}>Creating signature... 'this may take 10-15 seconds' </Text>
        </View>
      )}


      {selectedImage && (
        <TouchableOpacity style={styles.createButton} onPress={createSignature}>
          <LinearGradient colors={['#00E5FF', '#D500F9']} style={styles.createButtonGradient}>
            <Text style={styles.createButtonText}>Create Signature</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};



export default SignaturePage;
