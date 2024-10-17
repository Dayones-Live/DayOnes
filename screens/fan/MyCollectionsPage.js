import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';

const MyCollectionsPage = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const accessToken = useSelector((state) => state.accessToken);

  const fetchArtistPosts = async () => {
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
      fetchArtistPosts();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ProfilePictureButton navigation={navigation} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.imageGrid}>
        {posts.length === 0 ? (
          <Text style={styles.noPostsText}>Nothing in your collection right now</Text>
        ) : (
          posts.map((post, index) => (
            <View key={index} style={styles.imageWrapper}>
              {post.image_url && (
                <Image source={{ uri: post.image_url }} style={styles.image} />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
  scrollView: { flex: 1 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  noPostsText: { fontSize: 18, color: '#ffffff', textAlign: 'center', marginVertical: 20 },
  imageWrapper: { width: '48%', height: 200, marginVertical: 10 },
  image: { width: '100%', height: '100%', borderRadius: 10 },
});

export default MyCollectionsPage;
