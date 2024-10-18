import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { uploadImageToBucket } from '../../utils'; // Assuming you have the S3 upload utility

const SignaturePage = () => {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const accessToken = useSelector(state => state.accessToken);

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
    launchImageLibrary(options, (response) => {
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

  const createSignature = async () => {
    if (!selectedImage) {
      Alert.alert("Please take a picture or upload a file.");
      return;
    }

    try {
      console.log('Uploading image to S3...');
      const s3Url = await uploadImageToBucket(selectedImage.uri, 'signatures', accessToken);
      console.log('Image successfully uploaded to S3. S3 URL:', s3Url);

      const payload = new URLSearchParams({ url: s3Url }).toString();
      console.log('Payload to be sent:', payload);

      console.log('Attempting to create signature with payload:', payload);
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${accessToken}`,
      };
      console.log('Headers:', headers);

      const response = await axios.post(
        `${BASEURL}/api/v1/signature`,
        payload, // Payload being sent
        { headers }
      );

      console.log('Create signature response:', response.data);

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Signature created successfully!');
      } else {
        console.error('Failed to create signature:', response.data);
        Alert.alert('Error', 'Failed to create signature.');
      }
    } catch (error) {
      console.error('Error creating signature:', error);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
        console.log('Response headers:', error.response.headers);
      } else {
        console.log('Error message:', error.message);
      }
      Alert.alert('Error', 'An error occurred while creating the signature.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#00FFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topRightButton}
          onPress={() => navigation.navigate('ArtistSignatures')}
        >
          <Text style={styles.topRightButtonText}>My Signatures</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Create Signatures</Text>

      <LinearGradient
        colors={['#FF00FF', '#001F3F']}
        style={styles.imageContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {selectedImage ? (
          <Image source={{ uri: selectedImage.uri }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Choose or take a picture</Text>
        )}
      </LinearGradient>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.pictureButton} onPress={takePicture}>
          <Icon name="camera" size={30} color="#00FFFF" style={styles.icon} />
          <Text style={styles.buttonText}>Take Picture</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pictureButton} onPress={uploadFile}>
          <Icon name="file" size={30} color="#00FFFF" style={styles.icon} />
          <Text style={styles.buttonText}>Upload File</Text>
        </TouchableOpacity>
      </View>

      {selectedImage && (
        <TouchableOpacity style={styles.createButton} onPress={createSignature}>
          <Text style={styles.createButtonText}>Create Signature</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c002b',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#001F3F',
    borderRadius: 5,
  },
  topRightButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FF5733',
    borderRadius: 5,
  },
  topRightButtonText: {
    color: '#fff',
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
    color: '#fff',
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
    marginBottom: 30,
  },
  pictureButton: {
    width: '45%',
    height: 120,
    backgroundColor: '#001F3F',
    borderColor: '#00FFFF',
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 10,
  },
  buttonText: {
    color: '#00FFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#FF0080',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignaturePage;
