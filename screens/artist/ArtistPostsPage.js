import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageToBucket } from '../../utils';

const ArtistPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [pinnedPost, setPinnedPost] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const accessToken = useSelector(state => state.accessToken);
  const isLoggedIn = useSelector(state => state.isLoggedIn);
  const navigation = useNavigation();

  const fetchArtistPosts = async (pageNum = 1) => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const apiUrl = `${BASEURL}/api/v1/post?pageNo=${pageNum}&pageSize=25`;
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postsData = response.data?.data?.posts || [];
      const genericPost = postsData.find(post => post.type === 'GENERIC');
      const otherPosts = postsData.filter(post => post.type !== 'GENERIC');

      if (genericPost) setPinnedPost(genericPost);
      if (otherPosts.length < 10) setHasMore(false);

      // Sort posts by date (most recent first)
      otherPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setPosts(prevPosts => {
        const newPosts = otherPosts.filter(post => !prevPosts.some(prevPost => prevPost.id === post.id));
        return pageNum === 1 ? newPosts : [...prevPosts, ...newPosts];
      });

      setPage(pageNum + 1);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching posts.');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (postId) => {
    try {
      const response = await axios.delete(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 201 || response.status === 204) {
        Alert.alert('Success', 'The post has been deleted.');
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      } else {
        Alert.alert('Error', `Failed to delete post. Status code: ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', `An error occurred: ${error.response?.data?.message || error.message}`);
    }
  };

  const confirmDelete = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
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
      fetchArtistPosts(page);
    }
  };

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const options = { mediaType: 'photo', includeBase64: false };

  const takePicture = () => {
    launchCamera(options, (response) => {
      if (!response.didCancel && !response.errorCode) {
        const { uri } = response.assets[0];
        setSelectedImage(uri.startsWith('file://') ? uri : `file://${uri}`);
      }
    });
  };

  const uploadFile = () => {
    launchImageLibrary(options, (response) => {
      if (!response.didCancel && !response.errorCode) {
        const { uri } = response.assets[0];
        setSelectedImage(uri.startsWith('file://') ? uri : `file://${uri}`);
      }
    });
  };

  const handleImageUpload = async (imageUri) => {
    try {
      const s3Url = await uploadImageToBucket(imageUri, 'profile-pictures', accessToken);
      setSelectedImage(s3Url);
      return s3Url; // Return the S3 URL to be used in handleSendPost
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Error', 'Image upload failed. Please try again.');
      return null; // Return null if the upload fails
    }
  };

  const handleSendPost = async () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Post content cannot be empty.');
      return;
    }

    let s3Url = selectedImage;

    // Check if selectedImage is a local URI (i.e., not yet uploaded to S3)
    if (selectedImage && !selectedImage.startsWith('https://')) {
      s3Url = await handleImageUpload(selectedImage); // Upload to S3 and get the URL
      if (!s3Url) {
        Alert.alert('Error', 'Image upload failed. Please try again.');
        return;
      }
    }

    try {
      const postData = { message: postText, type: 'GENERIC', imageUrl: s3Url };
      const response = await axios.post(`${BASEURL}/api/v1/post/generic`, postData, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Your message has been sent to all fans.');
        setPostText('');
        setSelectedImage(null);
        setModalVisible(false);
      } else {
        Alert.alert('Error', 'Failed to send the message. Please try again.');
      }
    } catch (error) {
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
          {pinnedPost && (
            <TouchableOpacity
              key={pinnedPost.id}
              style={styles.postContainer}
              onPress={() => navigation.navigate('PostDetailPage', { postId: pinnedPost.id })}
              onLongPress={() => confirmDelete(pinnedPost.id)}
            >
              <Text style={styles.postUser}>My DayOnes</Text>
              {pinnedPost.image_url ? (
                <Image source={{ uri: pinnedPost.image_url }} style={styles.postImage} />
              ) : (
                <View style={styles.inviteOnlyBox}>
                  <Text style={styles.inviteOnlyText}>Invite Only</Text>
                </View>
              )}
              <View style={styles.interactionContainer}>
                <Text style={styles.interactionText}>❤️ {pinnedPost.reactionCount || 0}</Text>
                <Text style={styles.interactionText}>💬 {pinnedPost.commentsCount || 0}</Text>
              </View>
              <Text style={styles.postDate}>{new Date(pinnedPost.created_at).toLocaleString()}</Text>
            </TouchableOpacity>
          )}

          {posts.map((post, index) => renderPostItem(post, index))}
        </ScrollView>
        {loading && <Text style={styles.loadingText}>Loading more posts...</Text>}

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
              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginBottom: 10 }} />
              )}
              <View style={styles.iconRow}>
                <TouchableOpacity onPress={uploadFile}>
                  <Icon name="image" size={24} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity onPress={takePicture}>
                  <Icon name="camera" size={24} color="blue" />
                </TouchableOpacity>
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
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  textInput: { width: '100%', minHeight: 80, borderColor: '#ccc', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20, fontSize: 16 },
  iconRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  postButton: { backgroundColor: '#FF0080', padding: 10, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  postButtonText: { color: 'white', fontWeight: 'bold' },
  closeButton: { marginTop: 10 },
  closeButtonText: { color: 'blue', fontWeight: 'bold' },
});

export default ArtistPostsPage;
