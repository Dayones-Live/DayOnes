import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';

const DayOnesScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const accessToken = useSelector((state) => state.accessToken);

  const fetchArtistPosts = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log('Posts data:', response.data?.data?.posts); // Log only the posts data
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

  const renderPostItem = (post, index) => {
    // Extracting the user's full name from the post like in the invite example
    const artistName = post.user?.full_name || 'Unknown Artist';

    return (
      <TouchableOpacity
        key={index}
        style={styles.dmContainer}
        onPress={() => navigation.navigate('DMDetailPage', { postId: post.id })}
      >
        <Text style={styles.dmText}>
          {artistName} sent you a message
        </Text>
        <Text style={styles.messagePreview}>Tap to view message</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ProfilePictureButton navigation={navigation} />
      <Text style={styles.pageTitle}>Direct Messages</Text>
      <ScrollView style={styles.scrollView}>
        {posts.length === 0 ? (
          <Text style={styles.noPostsText}>No messages yet</Text>
        ) : (
          posts.map((post, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dmContainer}
              onPress={() => navigation.navigate('DMDetailPage', { postId: post.id })}
            >
              <Text style={styles.dmText}>{post.user_id || 'User ID'} sent you a message</Text>
              <Text style={styles.messagePreview}>Tap to view message</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 20 },
  scrollView: { flex: 1, marginBottom: 20 },
  noPostsText: { fontSize: 18, color: '#ffffff', textAlign: 'center', marginVertical: 20 },
  dmContainer: {
    backgroundColor: '#1b0248',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  dmText: { fontSize: 18, color: '#ffffff', fontWeight: 'bold' },
  messagePreview: { fontSize: 14, color: '#888', marginTop: 5 },
});

export default DayOnesScreen;
