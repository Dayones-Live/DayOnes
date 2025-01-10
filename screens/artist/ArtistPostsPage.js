import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageToBucket } from '../../utils';
import { uploadVideoToBucket } from '../../utils/videoUploadService';
import Icon from 'react-native-vector-icons/FontAwesome';
import Video from 'react-native-video';
import { convertToTemporaryFile } from '../../assets/components/convertToTemporaryFileHelper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import icon library



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
  const [mediaType, setMediaType] = useState(null);
  const [genericPostId, setGenericPostId] = useState(null);


  

  
  

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}m`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };
  


  const fetchArtistPosts = async (pageNum = 1) => {
    if (loading || !hasMore) return;
    setLoading(true);
  
    try {
      console.log(`Fetching posts for page number: ${pageNum}`);
  
      const apiUrl = `${BASEURL}/api/v1/post?pageNo=${pageNum}&pageSize=25`;
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      const postsData = response.data?.data?.posts || [];
  
      // Calculate the total fan count from all posts
      const totalFanCount = postsData.reduce(
        (total, post) => total + (post.associate_fan_count || 0),
        0
      );
  
      const enrichedPosts = await Promise.all(
        postsData.map(async (post) => {
          try {
            const detailResponse = await axios.get(`${BASEURL}/api/v1/post/${post.id}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const { comments = [], artistComments = [] } = detailResponse.data?.data || {};
  
            const totalComments = comments.reduce(
              (acc, comment) => acc + 1 + (comment.replies?.length || 0),
              0
            ) +
              artistComments.reduce(
                (acc, artistComment) =>
                  acc + 1 + (artistComment.replies?.length || 0),
                0
              );
  
            return { ...post, totalComments };
          } catch (error) {
            console.error(`Error fetching details for post ${post.id}:`, error.message);
            return { ...post, totalComments: 0 };
          }
        })
      );
  
      // Sort the posts by `created_at` in descending order
      const sortedPosts = enrichedPosts.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
  
      // Set the pinned post with total fan count
      if (pageNum === 1) {
        setPinnedPost({
          id: 'pinned',
          locale: 'All Locations',
          associate_fan_count: totalFanCount,
          created_at: new Date().toISOString(),
        });
      }
  
      setHasMore(postsData.length === 25); // Check if more posts are available
      setPosts((prevPosts) => (pageNum === 1 ? sortedPosts : [...prevPosts, ...sortedPosts])); // Append or replace posts
      setPage(pageNum + 1); // Increment the page number
    } catch (error) {
      console.error("Error fetching posts:", error.message || "Unknown error");
      Alert.alert("Error", "An error occurred while fetching posts.");
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
      console.error("Error deleting post:", error.message || error);
      Alert.alert('Error', `An error occurred: ${error.response?.data?.message || error.message || 'Unknown error'}`);
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
      const resetAndFetch = async () => {
        setPage(1); // Reset pagination
        setHasMore(true); // Reset the "has more" flag
        await fetchArtistPosts(1); // Fetch the first page of posts
      };
  
      resetAndFetch();
    }, [])
  );
  

  const handleLoadMore = ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 20 && !loading && hasMore) {
      fetchArtistPosts(page);
    }
  };

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => {
    setSelectedImage(null); // Clear the selected image
    setMediaType(null); // Clear the media type
    setPostText(''); // Clear the text input
    setModalVisible(false); // Close the modal
  };



  const takePicture = () => {
    launchCamera({ mediaType: 'mixed' }, (response) => {
      if (!response.didCancel && !response.errorCode) {
        const { uri, type } = response.assets[0];
        setSelectedImage(uri.startsWith('file://') ? uri : `file://${uri}`);
        setMediaType(type.startsWith('image/') ? 'PHOTO' : 'VIDEO');
      }
    });
  };


  const uploadFile = () => {
    launchImageLibrary({ mediaType: 'mixed' }, async (response) => {
      if (!response.didCancel && !response.errorCode) {
        const asset = response.assets[0];
        const { uri, type } = asset;

        // Handle Android scoped storage: Convert content URI to file path
        const fileUri = uri.startsWith('content://')
          ? await convertToTemporaryFile(uri, type.startsWith('image/') ? 'jpg' : 'mp4')
          : uri;

        setSelectedImage(fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`);
        setMediaType(type.startsWith('image/') ? 'PHOTO' : 'VIDEO');
      }
    });
  };

  const handleMediaUpload = async (uri) => {
    try {
      let s3Url;
      if (mediaType === 'PHOTO') {
        s3Url = await uploadImageToBucket(uri, 'message-media', accessToken);
      } else if (mediaType === 'VIDEO') {
        s3Url = await uploadVideoToBucket(uri, 'message-media', accessToken);
      }

      console.log('Full response from media upload:', { s3Url, mediaType }); // Log full response details here
      return s3Url;
    } catch (error) {
      console.error('Failed to upload media:', error);
      Alert.alert('Error', 'Media upload failed. Please try again.');
      return null;
    }
  };

  const handleSendPost = async () => {
    if (!postText.trim() && !selectedImage) {
      Alert.alert('Error', 'Post content or image is required.');
      return;
    }

    let s3Url = selectedImage;

    if (selectedImage && !selectedImage.startsWith('https://')) {
      s3Url = await handleMediaUpload(selectedImage);
      if (!s3Url) {
        Alert.alert('Error', 'Media upload failed. Please try again.');
        return;
      }
    }

    try {
      if (genericPostId) {
        // If a generic post exists, use the comment endpoint to add media as a comment
        const commentData = {
          message: postText.trim(),
          ...(s3Url && { url: s3Url, mediaType: mediaType }),
        };
        const response = await axios.post(
          `${BASEURL}/api/v1/post/${genericPostId}/comment`,
          commentData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.status === 200 || response.status === 201) {
          Alert.alert('Success', 'Your comment has been posted.');
        } else {
          Alert.alert('Error', 'Failed to send the comment. Please try again.');
        }
      } else {
        // If no generic post exists, create a new generic post
        const postData = {
          message: postText.trim(),
          type: 'GENERIC',
          imageUrl: s3Url,
          mediaType: mediaType,
        };
        const response = await axios.post(`${BASEURL}/api/v1/post/generic`, postData, {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });

        if (response.status === 200 || response.status === 201) {
          Alert.alert('Success', 'Your message has been sent to all fans.');
          setGenericPostId(response.data?.data?.post?.id); // Store the new generic post ID
        } else {
          Alert.alert('Error', 'Failed to send the message. Please try again.');
        }
      }

      setPostText('');
      setSelectedImage(null);
      setMediaType(null);
      setModalVisible(false);
      fetchArtistPosts(1); // Refresh posts after sending

    } catch (error) {
      console.error("Failed to send post or comment:", error.message || error);
      Alert.alert('Error', `An error occurred: ${error.response?.data?.message || 'An error occurred'}`);
    }
  };


 


  
  const renderPostItem = (post, index) => {
    console.log(`Post ${index + 1} associate_fan_count:`, post.associate_fan_count);
    const postDate = new Date(post.created_at).toLocaleString();
    
    return (
      <TouchableOpacity
  key={index}
  style={styles.postContainer}
  onPress={() => navigation.navigate('PostDetailPage', { postId: post.id })}
  onLongPress={() => confirmDelete(post.id)}
>
  {/* Location */}
  <View style={styles.headerContainer}>
    <Text style={styles.postUser}>{post.locale || 'Unknown Location'}</Text>
    <View style={styles.fanCountContainer}>
      <MaterialIcons name="person" size={18} color="#FFF" />
      <Text style={styles.fanCountText}>{formatCount(post.associate_fan_count)}</Text>
    </View>
  </View>

  {/* Post Image */}
  {post.image_url ? (
    <Image source={{ uri: post.image_url }} style={styles.postImage} />
  ) : (
    <View style={styles.inviteOnlyBox}>
      <Text style={styles.inviteOnlyText}>Invite Only</Text>
    </View>
  )}

  {/* Interaction Data */}
  <View style={styles.interactionContainer}>
    <Text style={styles.interactionText}>❤️ {post.totalLikes}</Text>
    <Text style={styles.interactionText}>💬 {post.totalComments}</Text>
  </View>

  {/* Post Date */}
  <Text style={styles.postDate}>{new Date(post.created_at).toLocaleString()}</Text>
</TouchableOpacity>


    );
  };
  
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ProfilePictureButton />
        <TouchableOpacity style={styles.plusButton} onPress={handleOpenModal}>
          <AntDesign name="pluscircleo" size={35} color="#FFFFFF" />
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
    {/* Location */}
    <View style={styles.headerContainer}>
      <Text style={styles.postUser}>{pinnedPost.locale || 'Unknown Location'}</Text>
      <View style={styles.fanCountContainer}>
        <MaterialIcons name="person" size={18} color="#FFF" />
        <Text style={styles.fanCountText}>{formatCount(pinnedPost.associate_fan_count || 0)}</Text>
      </View>
    </View>

    {/* Post Image */}
    <Image
      source={require('../../assets/images/Untitled_design-2.jpg')}
      style={styles.postImage}
    />

    {/* Interaction Data */}
    <View style={styles.interactionContainer}>
      <Text style={styles.interactionText}>❤️ {pinnedPost.reactionCount || 0}</Text>
      <Text style={styles.interactionText}>💬 {pinnedPost.commentsCount || 0}</Text>
    </View>

    {/* Post Date */}
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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalBackground}
          >
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
                <View style={styles.mediaContainer}>
                  {mediaType === 'PHOTO' ? (
                    <Image source={{ uri: selectedImage }} style={styles.mediaPreview} />
                  ) : (
                    <Video
                      source={{ uri: selectedImage }}
                      style={styles.mediaPreview}
                      paused
                      controls
                      resizeMode="contain"
                    />
                  )}
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSelectedImage(null)} // Clear the selected image
                  >
                    <AntDesign name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
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
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 20 },
  scrollView: { flex: 1, marginBottom: 20 },
  postContainer: { marginBottom: 20, alignItems: 'center' },
  postUser: { fontSize: 16, color: '#ffffff', marginBottom: 5, fontWeight: 'bold' },
  postImage: { width: '100%', height: 200, borderRadius: 10 },
  interactionContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  interactionText: { fontSize: 16, color: '#FF0080' },
  postDate: { fontSize: 14, color: '#888', marginTop: 5 },
  plusButton: { position: 'absolute', top: 8, right: 5, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 25, zIndex: 10 },
  loadingText: { color: '#FFFFFF', textAlign: 'center', marginVertical: 10 },
  modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalContainer: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  textInput: { width: '100%', minHeight: 80, borderColor: '#ccc', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20, fontSize: 16 },
  iconRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  postButton: { backgroundColor: '#FF0080', padding: 10, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  postButtonText: { color: 'white', fontWeight: 'bold' },
  closeButton: { marginTop: 10 },
  closeButtonText: { color: 'blue', fontWeight: 'bold' },
  mediaContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#000',
  },
  clearButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerContainer: {
    position: 'relative', // Allows absolute positioning for children
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center', // Centers the location text
  },
  postUser: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center', // Ensures location is centered
  },
  fanCountContainer: {
    position: 'absolute', // Position the icon and count independently
    right: '-25%', // Distance from the right edge
    top: 0, // Align with the top of the header
    flexDirection: 'row',
    alignItems: 'center',
  },
  fanCountText: {
    marginLeft: 5, // Space between icon and text
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  postContainer: {
    marginBottom: 20,
    alignItems: 'center',
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
});

export default ArtistPostsPage;
