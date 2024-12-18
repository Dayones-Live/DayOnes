import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { uploadSignatureFile } from '../../utils';
import { convertToTemporaryFile } from '../../assets/components/convertToTemporaryFileHelper';

const SignaturePage = () => {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const accessToken = useSelector(state => state.accessToken);
  const [isLoading, setIsLoading] = useState(false);


  const options = {
    mediaType: 'photo',
    includeBase64: false,
  };

  const takePicture = () => {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  topRightButton: {
    width: '45%',
    alignItems: 'center',
  },
  topRightButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  topRightButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: '#C0C0C0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  pictureButton: {
    width: '45%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 10,
  },
  buttonText: {
    color: '#C0C0C0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 16,
  },

});

export default SignaturePage;
