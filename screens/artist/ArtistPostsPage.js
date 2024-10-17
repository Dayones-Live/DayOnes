import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton'; // Import ProfilePictureButton

const ArtistPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const accessToken = useSelector(state => state.accessToken);
  const navigation = useNavigation();

  const fetchArtistPosts = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPosts(response.data?.data?.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
    }
  };

  // Fetch posts whenever page is focused
  useFocusEffect(
    useCallback(() => {
      fetchArtistPosts();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Add Profile Picture Button in the top-left corner */}
      <ProfilePictureButton />

      <Text style={styles.pageTitle}>Posts</Text>
      <ScrollView style={styles.scrollView}>
        {posts.map((post, index) => (
          <TouchableOpacity
            key={index}
            style={styles.postContainer}
            onPress={() => navigation.navigate('PostDetailPage', { postId: post.id })}
          >
            <Text style={styles.postUser}>{post.locale || 'Unknown Location'}</Text>
            <Image source={{ uri: post.image_url }} style={styles.postImage} />
            <View style={styles.interactionContainer}>
              <Text style={styles.interactionText}>❤️ {post.reactionCount || 0}</Text>
              <Text style={styles.interactionText}>💬 {post.commentsCount || 0}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {posts.length === 0 && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={fetchArtistPosts} style={styles.button}>
            <Text style={styles.buttonText}>Fetch Posts</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 20 },
  scrollView: { flex: 1, marginBottom: 20 },
  postContainer: { marginBottom: 20, alignItems: 'center' },
  postUser: { fontSize: 16, color: '#ffffff', marginBottom: 5, fontWeight: 'bold' },
  postImage: { width: '100%', height: 200, borderRadius: 10 },
  interactionContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  interactionText: { fontSize: 16, color: '#FF0080' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  button: { backgroundColor: '#FF0080', padding: 15, borderRadius: 25, alignItems: 'center' },
  buttonText: { fontSize: 18, color: '#ffffff', fontWeight: 'bold' },
});

export default ArtistPostsPage;
