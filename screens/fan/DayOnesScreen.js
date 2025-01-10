import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  Alert,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import styles from './fanStyles/DayOnesScreenStyles';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';

const DayOnesScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const accessToken = useSelector((state) => state.accessToken);
  const profile = useSelector((state) => state.userProfile?.data);

  console.log("Access token:", accessToken);
  console.log("User profile from Redux:", profile);

  const fetchArtistPosts = async (page = 1, pageSize = 10) => {
    console.log(`Fetching posts: page=${page}, pageSize=${pageSize}`);
    try {
      setLoading(true);
      const response = await axios.get(`${BASEURL}/api/v1/post/?pageNo=${page}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Response received from fetchArtistPosts:", response);

      const postsData = response.data?.data?.posts || [];
      console.log("Posts data received:", postsData);

      const sortedPosts = postsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      console.log("Sorted posts data:", sortedPosts);

      setPosts(prevPosts => (page === 1 ? sortedPosts : [...prevPosts, ...sortedPosts]));
      console.log("Updated posts state:", posts);

      setHasMore(postsData.length === pageSize);
      console.log("Has more posts:", hasMore);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
    } finally {
      setLoading(false);
      console.log("Finished fetching posts. Loading set to:", loading);
    }
  };

  const loadMorePosts = () => {
    console.log("Loading more posts. Current pageNo:", pageNo, "loading:", loading, "hasMore:", hasMore);
    if (!loading && hasMore) {
      setPageNo(prevPage => {
        const newPage = prevPage + 1;
        console.log("Incremented pageNo to:", newPage);
        return newPage;
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("useFocusEffect triggered with pageNo:", pageNo);
      fetchArtistPosts(pageNo);
    }, [pageNo])
  );

  const formatTimeAgo = (date) => {
    console.log("Formatting date:", date);
    const now = new Date();
    const postDate = new Date(date);
    const differenceInSeconds = Math.floor((now - postDate) / 1000);
    let timeAgo;

    if (differenceInSeconds < 60) {
      timeAgo = `${differenceInSeconds} seconds ago`;
    } else if (differenceInSeconds < 3600) {
      const minutes = Math.floor(differenceInSeconds / 60);
      timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 86400) {
      const hours = Math.floor(differenceInSeconds / 3600);
      timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(differenceInSeconds / 86400);
      timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
    }
    console.log("Time ago formatted:", timeAgo);
    return timeAgo;
  };

  const renderPostItem = (post, index) => {
    console.log("Rendering post item. Post:", post, "Index:", index);
    const artistName = post.user?.full_name || 'Unknown Artist';
    const avatarUrl = post.user?.avatar_url || profile?.avatar_url || 'https://example.com/default-avatar.png';
    const formattedTime = formatTimeAgo(post.created_at);

    console.log("Artist name:", artistName);
    console.log("Avatar URL:", avatarUrl);
    console.log("Formatted time:", formattedTime);

    return (
      <TouchableOpacity
        key={index}
        style={styles.dmContainer}
        onPress={() => {
          console.log("Navigating to DMDetailPage with postId:", post.id);
          navigation.navigate('DMDetailPage', { postId: post.id });
        }}
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
      <Text style={styles.pageTitle}>DayOnes Message</Text>
      <ScrollView
        style={styles.scrollView}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          console.log("Scroll event detected. Layout measurement:", layoutMeasurement, "Content offset:", contentOffset, "Content size:", contentSize);
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
            console.log("Reached end of scroll. Loading more posts.");
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


export default DayOnesScreen;
