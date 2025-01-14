import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSignatures } from '../../assets/hooks/useSignatures';
import Icon from 'react-native-vector-icons/FontAwesome';
import styles from './artistStyles/ArtistSignaturesStyles';

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



export default ArtistSignatures;
