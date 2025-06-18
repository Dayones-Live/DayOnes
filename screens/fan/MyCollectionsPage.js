import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import styles from './fanStyles/MyCollectionsPageStyles';
import ImageViewing from 'react-native-image-viewing'; // Import the image viewing library

const MyCollectionsPage = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const accessToken = useSelector((state) => state.accessToken);

  const fetchArtistPosts = async () => {
    if (!accessToken) {
      console.log("No access token available, skipping fetchArtistPosts");
      return;
    }
    
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPosts(response.data?.data?.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
    }
  };

  // Refetch collection whenever page is focused
  useFocusEffect(
    useCallback(() => {
      if (!accessToken) {
        console.log("No access token available, skipping collection fetch");
        return;
      }
      fetchArtistPosts();
    }, [accessToken])
  );

  const openImageViewer = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageViewerVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[styles.scrollView, { paddingTop: 30 }]} contentContainerStyle={styles.imageGrid}>
        {posts.length === 0 ? (
          <Text style={styles.noPostsText}>Nothing in your collection right now</Text>
        ) : (
          posts
            .filter(post => post.image_url) // Filter out posts with no image URL
            .map((post, index) => (
              <TouchableOpacity key={index} style={styles.imageWrapper} onPress={() => openImageViewer(post.image_url)}>
                <Image source={{ uri: post.image_url }} style={styles.image} />
              </TouchableOpacity>
            ))
        )}
      </ScrollView>

      {/* Fullscreen image viewer */}
      <ImageViewing
        images={[{ uri: selectedImage }]}
        imageIndex={0}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
};

export default MyCollectionsPage;
