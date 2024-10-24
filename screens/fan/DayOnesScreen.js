import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  SafeAreaView, // Added SafeAreaView
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

      const postsData = response.data?.data?.posts || [];

      // Sort posts by 'created_at' field, with newest posts appearing first
      const sortedPosts = postsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log('Posts data sorted:', sortedPosts); // Log sorted posts data for verification
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
    }
  };

  // Refetch collection whenever the page is focused
  useFocusEffect(
    useCallback(() => {
      fetchArtistPosts();
    }, [])
  );

  // Helper function to format the date to a readable "X time ago" format
  const formatTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const differenceInSeconds = Math.floor((now - postDate) / 1000);

    if (differenceInSeconds < 60) {
      return `${differenceInSeconds} seconds ago`;
    } else if (differenceInSeconds < 3600) {
      const minutes = Math.floor(differenceInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 86400) {
      const hours = Math.floor(differenceInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(differenceInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const renderPostItem = (post, index) => {
    // Extract user's full name and avatar URL from the post
    const artistName = post.user?.full_name || 'Unknown Artist';
    const avatarUrl = post.user?.avatar_url || 'https://example.com/default-avatar.png'; // Replace with a default avatar image if none exists

    // Format the 'created_at' timestamp using the helper function
    const formattedTime = formatTimeAgo(post.created_at);

    return (
      <TouchableOpacity
        key={index}
        style={styles.dmContainer}
        onPress={() => navigation.navigate('DMDetailPage', { postId: post.id })}
      >
        <View style={styles.userInfo}>
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.dmText}>
              {artistName} sent you a message
            </Text>
            <Text style={styles.messagePreview}>
              Tap to view message - {formattedTime}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfilePictureButton navigation={navigation} />
      <Text style={styles.pageTitle}>DayOnes Message</Text>
      <ScrollView style={styles.scrollView}>
        {posts.length === 0 ? (
          <Text style={styles.noPostsText}>No messages yet</Text>
        ) : (
          posts.map((post, index) => renderPostItem(post, index))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 50 },
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
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  dmText: { fontSize: 18, color: '#ffffff', fontWeight: 'bold' },
  messagePreview: { fontSize: 14, color: '#888', marginTop: 5 },
});

export default DayOnesScreen;
