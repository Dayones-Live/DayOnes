import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSignatures } from '../../assets/hooks/useSignatures';
import Icon from 'react-native-vector-icons/FontAwesome';

const ArtistSignatures = () => {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);

  const { data: signatures, isLoading, isError, deleteSignature } = useSignatures();

  const handleDelete = (id) => {
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
    setSelectedImage(image);
  };

  const closeZoomView = () => {
    setSelectedImage(null);
  };

  const renderSignature = ({ item }) => (
    <TouchableOpacity onPress={() => openZoomView(item.url)} style={styles.signatureContainer}>
      <Image source={{ uri: item.url }} style={styles.signatureImage} resizeMode="contain" />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Icon name="times-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>My Signatures</Text>
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 50,
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
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
    backgroundColor: '#FFFFFF', // White background for each signature
    borderWidth: 2,
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
    backgroundColor: 'white'
  },
  modalCloseButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 1,
    padding: 0,
    backgroundColor: 'red',
  },
  zoomedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});

export default ArtistSignatures;
