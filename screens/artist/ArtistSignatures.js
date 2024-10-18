import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSignatures } from '../../assets/hooks/useSignatures';
import Icon from 'react-native-vector-icons/FontAwesome';

const ArtistSignatures = () => {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);

  // Use the custom hook to fetch signatures
  const { data: signatures, isLoading, isError, deleteSignature } = useSignatures();

  const handleDelete = (id) => {
    console.log("Attempting to delete signature with id:", id);
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this signature?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteSignature(id) }
      ]
    );
  };

  const openZoomView = (image) => {
    console.log("Opening zoom view for image:", image);
    setSelectedImage(image);
  };

  const closeZoomView = () => {
    console.log("Closing zoom view");
    setSelectedImage(null);
  };

  const renderSignature = ({ item }) => {
    let parsedUrl;

    try {
      // Parse the URL since it's a stringified JSON
      parsedUrl = JSON.parse(item.url).url;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return null; // Handle error and prevent rendering broken signature
    }

    console.log("Rendering signature item with parsed URL:", parsedUrl);

    return (
      <TouchableOpacity onPress={() => openZoomView(parsedUrl)} style={styles.signatureContainer}>
        <Image source={{ uri: parsedUrl }} style={styles.signatureImage} resizeMode="contain" />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Icon name="times-circle" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Signatures</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#00FFFF" />
      ) : isError ? (
        <Text style={styles.errorText}>Failed to load signatures. Please try again.</Text>
      ) : (
        <FlatList
          data={signatures}
          renderItem={renderSignature}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
        />
      )}

      {/* Upload Signature Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={() => navigation.navigate('SignaturePage')}>
        <Text style={styles.uploadButtonText}>Upload Signature</Text>
      </TouchableOpacity>

      {/* Modal for Zoomed View */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeZoomView}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeZoomView}>
              <Icon name="times" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.zoomedImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c002b',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  signatureContainer: {
    width: '45%',
    marginBottom: 20,
    alignItems: 'center',
    marginHorizontal: 10,
    position: 'relative',
    borderRadius: 10,
    padding: 10,
  },
  signatureImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  uploadButton: {
    backgroundColor: '#FF0080',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 10,
  },
  zoomedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});

export default ArtistSignatures;
