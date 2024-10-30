import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';

const DayOnesScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [pageNo, setPageNo] = useState(1); // Track the current page
  const [loading, setLoading] = useState(false); // Loading state for new pages
  const [hasMore, setHasMore] = useState(true); // Track if there are more posts to load
  const accessToken = useSelector((state) => state.accessToken);

  const fetchArtistPosts = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASEURL}/api/v1/post/?pageNo=${page}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postsData = response.data?.data?.posts || [];
      const sortedPosts = postsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Append new posts if not the first page, otherwise replace
      setPosts(prevPosts => (page === 1 ? sortedPosts : [...prevPosts, ...sortedPosts]));
      setHasMore(postsData.length === pageSize); // If fewer items were returned, we've reached the end
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
    } finally {
      setLoading(false);
    }
  };

  // Load more posts when scrolling to the end
  const loadMorePosts = () => {
    if (!loading && hasMore) {
      setPageNo(prevPage => prevPage + 1);
    }
  };

  // Fetch posts whenever pageNo changes
  useFocusEffect(
    useCallback(() => {
      fetchArtistPosts(pageNo);
    }, [pageNo])
  );

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
    const artistName = post.user?.full_name || 'Unknown Artist';
    const avatarUrl = post.user?.avatar_url || 'https://example.com/default-avatar.png';
    const formattedTime = formatTimeAgo(post.created_at);

    return (
      <TouchableOpacity
        key={index}
        style={styles.dmContainer}
        onPress={() => navigation.navigate('DMDetailPage', { postId: post.id })}
      >
        <View style={styles.userInfo}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View>
            <Text style={styles.dmText}>{artistName} sent you a message</Text>
            <Text style={styles.messagePreview}>Tap to view message - {formattedTime}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfilePictureButton navigation={navigation} />
      <Text style={styles.pageTitle}>DayOnes Message</Text>
      <ScrollView
        style={styles.scrollView}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
            loadMorePosts();
          }
        }}
        scrollEventThrottle={400}
      >
        {posts.length === 0 && !loading ? (
          <Text style={styles.noPostsText}>No messages yet</Text>
        ) : (
          posts.map((post, index) => renderPostItem(post, index))
        )}
        {loading && <ActivityIndicator size="large" color="#FF0080" style={styles.loadingIndicator} />}
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
  dmText: { fontSize: 15, color: '#ffffff', fontWeight: 'bold' },
  messagePreview: { fontSize: 12, color: '#888', marginTop: 5 },
  loadingIndicator: { marginVertical: 20 },
});

export default DayOnesScreen;
