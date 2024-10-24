import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { BASEURL } from '../../assets/constants'; // Make sure BASEURL is correctly imported
import ProfilePictureButton from '../../assets/components/ProfilePictureButton'; // Import ProfilePictureButton

const ArtistPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [postText, setPostText] = useState(''); // Text input state
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

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleSendPost = async () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Post content cannot be empty.');
      return;
    }
  
    try {
      const response = await axios.post(`${BASEURL}/api/v1/post/generic`, 
        {
          message: postText,           // Using the message field as per the Postman request
          type: 'GENERIC',             // "GENERIC" as the post type
          imageUrl: 'https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg',  // You can replace this with dynamic image input
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Authorization header with Bearer token
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Your message has been sent to all fans.');
        setPostText(''); // Clear the input field after sending the post
        setModalVisible(false); // Close the modal
      } else {
        Alert.alert('Error', 'Failed to send the message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending post:', error.response?.data || error.message);
      Alert.alert('Error', `Failed to send post: ${error.response?.data?.message || 'An error occurred'}`);
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
          <Image source={{ uri: post.image_url }} style={styles.postImage} />
        ) : (
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
        <TouchableOpacity style={styles.messageAllButton} onPress={handleOpenModal}>
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

        {/* Modal for "Message All Fans" */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Message All Fans</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What is happening?!"
                placeholderTextColor="gray"
                value={postText}
                onChangeText={setPostText}
                multiline
              />

              <View style={styles.iconRow}>
                <Icon name="image" size={24} color="blue" />
                <Icon name="gif" size={24} color="blue" />
                <Icon name="smile-o" size={24} color="blue" />
                <Icon name="camera" size={24} color="blue" />
                <Icon name="map-marker" size={24} color="blue" />
              </View>

              <TouchableOpacity style={styles.postButton} onPress={handleSendPost}>
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  },
  messageAllButton: {
    position: 'absolute',
    top: 25,
    right: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#FF0080',
    borderRadius: 25,
    zIndex: 10,
  },
  messageAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 10,
  },

  // Modal styles
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  textInput: {
    width: '100%',
    minHeight: 80,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  postButton: {
    backgroundColor: '#FF0080',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
  },
  closeButtonText: {
    color: 'blue',
    fontWeight: 'bold',
  },
});

export default ArtistPostsPage;
