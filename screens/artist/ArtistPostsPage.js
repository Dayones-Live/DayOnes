import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton'; // Import ProfilePictureButton
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';
import Icon from 'react-native-vector-icons/FontAwesome';
import { logoutUser } from '../../redux/actions';

const ArtistPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const accessToken = useSelector(state => state.accessToken);
  const isLoggedIn = useSelector(state => state.isLoggedIn);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Fetch posts based on the page number
  const fetchArtistPosts = async (pageNum) => {
    if (loading || !hasMore) return;

    setLoading(true);
    console.log(`Fetching posts for page: ${pageNum}`);

    try {
      const response = await axios.get(`${BASEURL}/api/v1/post?page=${pageNum}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postsData = response.data?.data?.posts || [];
      console.log('Fetched posts:', postsData);

      if (postsData.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prevPosts => {
          const newPosts = postsData.filter(post => !prevPosts.some(prevPost => prevPost.id === post.id));
          const updatedPosts = [...prevPosts, ...newPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          console.log('Updated posts after fetch:', updatedPosts);
          return updatedPosts;
        });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPosts(posts.filter(post => post.id !== postId));
      Alert.alert('Success', 'The post has been deleted.');
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete the post.');
    }
  };

  const confirmDelete = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post and all of its data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => handleDelete(postId), style: 'destructive' },
      ]
    );
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setPosts([]);
      setPage(1);
      setHasMore(true);
    } else {
      fetchArtistPosts(1);
    }
  }, [isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      fetchArtistPosts(page);
    }, [page])
  );

  const handleLoadMore = ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 20 && !loading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const renderPostItem = (post, index) => {
    const postDate = new Date(post.created_at).toLocaleString();

    return (
      <TouchableOpacity
        key={index}
        style={styles.postContainer}
        onPress={() => navigation.navigate('PostDetailPage', { postId: post.id })}
        onLongPress={() => confirmDelete(post.id)}
      >
        <Text style={styles.postUser}>{post.locale || 'Unknown Location'}</Text>

        {post.image_url ? (
          // Display image if available
          <Image source={{ uri: post.image_url }} style={styles.postImage} />
        ) : (
          // Display black box with "Invite Only" text inside
          <View style={styles.inviteOnlyBox}>
            <Text style={styles.inviteOnlyText}>Invite Only</Text>
          </View>
        )}

        <View style={styles.interactionContainer}>
          <Text style={styles.interactionText}>❤️ {post.reactionCount || 0}</Text>
          <Text style={styles.interactionText}>💬 {post.commentsCount || 0}</Text>
        </View>
        <Text style={styles.postDate}>{postDate}</Text>
      </TouchableOpacity>
    );
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ProfilePictureButton />
        <TouchableOpacity style={styles.messageAllButton} onPress={() => Alert.alert('Message All Fans', 'This will send a message to all fans.')}>
          <Text style={styles.messageAllText}>Message All Fans</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Posts</Text>
        <ScrollView
          style={styles.scrollView}
          onScroll={handleLoadMore}
          scrollEventThrottle={400}
        >
          {posts.map((post, index) => renderPostItem(post, index))}
        </ScrollView>
        {loading && <Text style={styles.loadingText}>Loading more posts...</Text>}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0c002b', // Navy blue background
  },
  container: {
    flex: 1,
    backgroundColor: '#0c002b', // Navy blue background color
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  postContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  postUser: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  interactionText: {
    fontSize: 16,
    color: '#FF0080',
  },
  postDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  }, // Style for the timestamp

  // Style for the "Message All Fans" button
  messageAllButton: {
    position: 'absolute',
    top: 25, // Move it down a bit
    right: 5, // Move it a little more to the right
    paddingVertical: 7,
    paddingHorizontal: 10, // Adjusted padding for better button shape
    backgroundColor: '#FF0080',
    borderRadius: 25,
    zIndex: 10, // Ensure it stays clickable and above other elements
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  messageAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#FF0080',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  inviteOnlyBox: {
    width: '100%',
    height: 200, // Same height as the image
    backgroundColor: '#000', // Black background
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  inviteOnlyText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },


  safeArea: { flex: 1, backgroundColor: '#0c002b' },
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 20 },
  scrollView: { flex: 1, marginBottom: 20 },
  postContainer: { marginBottom: 20, alignItems: 'center' },
  postUser: { fontSize: 16, color: '#ffffff', marginBottom: 5, fontWeight: 'bold' },
  postImage: { width: '100%', height: 200, borderRadius: 10 },
  interactionContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  interactionText: { fontSize: 16, color: '#FF0080' },
  postDate: { fontSize: 14, color: '#888', marginTop: 5 },
  messageAllButton: { position: 'absolute', top: 25, right: 5, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: '#FF0080', borderRadius: 25, zIndex: 10 },
  messageAllText: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
  loadingText: { color: '#FFFFFF', textAlign: 'center', marginVertical: 10 },
});

export default ArtistPostsPage;
