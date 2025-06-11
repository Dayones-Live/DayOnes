import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  Alert,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import styles from './fanStyles/DayOnesScreenStyles';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import Icon from 'react-native-vector-icons/Ionicons';

const DayOnesScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [expandedArtists, setExpandedArtists] = useState({});
  
  const accessToken = useSelector((state) => state.accessToken);
  const profile = useSelector((state) => state.userProfile?.data);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused, loading initial posts");
      setPosts([]);
      setPageNo(1);
      setHasMore(true);
      setIsInitialLoad(true);
      fetchArtistPosts(1);
    }, [])
  );

  const fetchArtistPosts = async (page = 1, pageSize = 20) => {
    if (loading) return;
    
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

      setPosts(prevPosts => {
        if (page === 1) return sortedPosts;
        const existingIds = new Set(prevPosts.map(post => post.id));
        const newPosts = sortedPosts.filter(post => !existingIds.has(post.id));
        return [...prevPosts, ...newPosts];
      });

      if (isInitialLoad && postsData.length === pageSize) {
        console.log("Initial load complete, fetching next page");
        setIsInitialLoad(false);
        fetchArtistPosts(page + 1);
      } else {
        setHasMore(postsData.length === pageSize);
        setIsInitialLoad(false);
      }
      
      setPageNo(page);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      console.log("Loading more posts. Current page:", pageNo);
      fetchArtistPosts(pageNo + 1);
    }
  };

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

  const toggleArtist = (artistId) => {
    setExpandedArtists(prev => ({
      ...prev,
      [artistId]: !prev[artistId]
    }));
  };

  const groupPostsByArtist = (posts) => {
    return posts.reduce((acc, post) => {
      const artistId = post.user?.id;
      if (!acc[artistId]) {
        acc[artistId] = {
          artist: post.user,
          posts: []
        };
      }
      acc[artistId].posts.push(post);
      return acc;
    }, {});
  };

  const renderArtistGroup = (artistId, artistData) => {
    const isExpanded = expandedArtists[artistId];
    const artistName = artistData.artist?.full_name || 'Unknown Artist';
    const avatarUrl = artistData.artist?.avatar_url || 'https://example.com/default-avatar.png';
    const location = artistData.artist?.location || '';

    return (
      <View key={artistId} style={styles.artistGroup}>
        <TouchableOpacity 
          style={styles.artistHeader}
          onPress={() => toggleArtist(artistId)}
        >
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.artistInfo}>
            <View style={styles.nameLocationContainer}>
              <Text style={styles.artistName}>{artistName}</Text>
              {location && (
                <Text style={styles.locationText}> @ {location}</Text>
              )}
            </View>
            <Text style={styles.postCount}>{artistData.posts.length} Messages</Text>
          </View>
          <Icon 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#888" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.postsContainer}>
            {artistData.posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postContainer}
                onPress={() => {
                  navigation.navigate('DMDetailPage', { postId: post.id });
                }}
              >
                <View style={styles.postContent}>
                  <View style={styles.postHeader}>
                    <View style={styles.postInfo}>
                      <Text style={styles.postArtistName}>{post.user.full_name}</Text>
                      <Text style={styles.postLocation}>
                        @{post.type === 'GENERIC' ? 'Around the world' : post.locale}
                      </Text>
                    </View>
                    <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
                  </View>
                  {post.type === 'GENERIC' ? (
                    <View style={styles.postImageContainer}>
                      <Image 
                        source={require('../../assets/images/Untitled_design-2.jpg')}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : post.image_url ? (
                    <View style={styles.postImageContainer}>
                      <Image 
                        source={{ uri: post.image_url }} 
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>DayOnes Messages</Text>

      <ScrollView
        style={styles.scrollView}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {posts.length > 0 ? (
          Object.entries(groupPostsByArtist(posts)).map(([artistId, artistData]) => 
            renderArtistGroup(artistId, artistData)
          )
        ) : (
          <Text style={styles.noPostsText}>
            No posts yet
          </Text>
        )}
        {loading && <ActivityIndicator style={styles.loadingIndicator} color="#fff" />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DayOnesScreen;
