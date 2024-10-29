import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

const PostDetailPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [likedComments, setLikedComments] = useState([]);
  const [commentsToShow, setCommentsToShow] = useState(10);
  const [isModalVisible, setModalVisible] = useState(false); // For modal visibility
  const [selectedImage, setSelectedImage] = useState(null); // Image picker state

  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params;
  const accessToken = useSelector((state) => state.accessToken);

  const fetchPostDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postData = response.data?.data?.post || {};
      const reactions = response.data?.data?.reactions || [];
      const reactionCount = reactions.length || 0;
      const artistComments = response.data?.data?.artistComments || [];
      const comments = response.data?.data?.comments || [];
      const likedCommentsArray = comments
        .filter((comment) => comment.commentReactionCount > 0) // Check if commentReactionCount is greater than 0
        .map((comment) => comment.id);

      setLikedComments(likedCommentsArray); // Pre-set liked comments based on API response
      setPost({ ...postData, reactionCount, artistComments, comments });
    } catch (error) {
      console.error('Error fetching post:', error.response || error.message);
      Alert.alert('Error', 'Could not load post details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId, accessToken]);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedImage(null); // Clear the selected image on close
  };

  const options = {
    mediaType: 'photo',
    includeBase64: false,
  };

  const takePicture = () => {
    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        let { uri } = response.assets[0];
        if (!uri.startsWith('file://')) {
          uri = `file://${uri}`; // Add file:// prefix if missing
        }
        console.log('Captured image URI:', uri); // Log the URI to confirm
        setSelectedImage(uri);
      }
    });
  };


  const uploadFile = () => {
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        let { uri } = response.assets[0];
        if (!uri.startsWith('file://')) {
          uri = `file://${uri}`; // Add file:// prefix if missing
        }
        console.log('Selected image URI:', uri); // Log the URI to confirm
        setSelectedImage(uri);
      }
    });
  };



    // Function to like a comment
    const likeComment = async (commentId) => {
      try {
        await axios.post(
          `${BASEURL}/api/v1/comment/like/${commentId}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setLikedComments((prevLikedComments) => [...prevLikedComments, commentId]);
        console.log(`Comment with ID: ${commentId} liked.`);
      } catch (error) {
        Alert.alert('Error', 'Failed to like the comment.');
      }
    };
    // Function to dislike a comment
    const dislikeComment = async (commentId) => {
      try {
        await axios.post(
          `${BASEURL}/api/v1/comment/dislike/${commentId}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setLikedComments((prevLikedComments) =>
          prevLikedComments.filter((id) => id !== commentId)
        );
        console.log(`Comment with ID: ${commentId} disliked.`);
      } catch (error) {
        Alert.alert('Error', 'Failed to dislike the comment.');
      }
    };
    // Toggle like/dislike state

    const toggleLikeComment = (commentId) => {
          if (likedComments.includes(commentId)) {
      dislikeComment(commentId); // If already liked, dislike it
    } else {
      likeComment(commentId); // If not liked, like it
    }}

    const likeAllComments = async () => {
      try {
        const response = await axios.post(
          `${BASEURL}/api/v1/comment/like-all/${postId}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (response.status === 201 || response.status === 200) {
          // Mark all comments as liked
          const allCommentIds = post.comments.map(comment => comment.id);
          setLikedComments(allCommentIds); // Set all comment IDs to liked
          console.log("All comments liked successfully.");
          Alert.alert('Success', 'All comments have been liked.');
        } else {
          console.error("Response status:", response.status);
          console.error("Response data:", response.data);
          Alert.alert('Error', 'Failed to like all comments.');
        }
      } catch (error) {
        console.error("Error details:", error.response || error.message);
        if (error.response) {
          Alert.alert(
            'Error',
            `Failed to like all comments. Server returned status ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`
          );
        } else {
          Alert.alert('Error', 'Failed to like all comments due to a network or server issue.');
        }
      }
    };


  const handleSendComment = async () => {
    if (!commentText.trim() && !selectedImage) {
      Alert.alert('Error', 'Comment or image is required.');
      return;
    }

    try {
      const commentData = { message: commentText };

      if (selectedImage) {
        commentData.imageUrl = selectedImage; // Include the selected image URL in the comment
      }

      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        commentData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Your comment has been posted.');
        setCommentText('');
        setSelectedImage(null);  // Clear the selected image after posting
        setModalVisible(false);
        fetchPostDetails();  // Refresh post details to show new comment
      } else {
        Alert.alert('Error', 'Failed to post the comment. Please try again.');
      }
    } catch (error) {
      console.error('Error sending comment:', error.response?.data || error.message);
      Alert.alert('Error', `Failed to send comment: ${error.response?.data?.message || 'An error occurred'}`);
    }
  };

  const loadMoreComments = () => {
    const totalComments = post.artistComments.length + post.comments.length;

    setCommentsToShow(prevCount => {
      if (prevCount + 10 > totalComments) {
        return totalComments; // Show all remaining comments
      } else {
        return prevCount + 10; // Show 10 more comments
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF0080" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </SafeAreaView>
    );
  }

  const sortedComments = [
    ...post.artistComments.map((comment) => ({ ...comment, role: 'ARTIST' })),
    ...post.comments.map((comment) => ({ ...comment, role: 'FAN' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
   .slice(0, commentsToShow);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollViewContainer, { paddingBottom: 100 }]}
        style={{ flex: 1 }}
      >
        <View style={{ flexGrow: 1, justifyContent: 'flex-start' }}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.postTitle}>{post.locale || 'Unknown Location'}</Text>
          </View>

          {post.image_url ? (
            <View>
              {/* Message Group button placed above the image */}
              <TouchableOpacity onPress={handleOpenModal} style={styles.messageGroupButton}>
                <Text style={styles.messageGroupButtonText}>Message Group</Text>
              </TouchableOpacity>
              <Image source={{ uri: post.image_url }} style={styles.postImage} />
            </View>
          ) : (
            <Text style={styles.errorText}></Text>
          )}

          <View style={styles.interactionContainer}>
            <Text style={styles.interactionText}>❤️ {post.reactionCount}</Text>
            <Text style={styles.interactionText}>
              💬 {Array.isArray(sortedComments) ? post.comments.length : 0}
            </Text>
            <TouchableOpacity onPress={likeAllComments} style={styles.likeAllButton}>
              <Text style={styles.likeAllButtonText}>Like All Comments</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.commentsContainer}>
            {Array.isArray(sortedComments) &&
              sortedComments.map((comment, index) => (
                <View
                  key={index}
                  style={
                    comment.role === 'ARTIST'
                      ? styles.artistCommentContainer
                      : styles.fanCommentContainer
                  }
                >
                  <View style={styles.commentHeader}>
                    <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
                    <Text style={styles.commentAuthor}>{comment.user.full_name}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.message}</Text>

                  {comment.role === 'FAN' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity
                        style={styles.heartButton}
                        onPress={() => toggleLikeComment(comment.id)}
                      >
                        <Icon
                          name="heart"
                          size={20}
                          color={likedComments.includes(comment.id) ? '#FF0080' : '#FFFFFF'}
                        />
                      </TouchableOpacity>

                      {/* New DM icon */}
                      <TouchableOpacity
                        style={styles.dmButton}
                        onPress={() => console.log('DM icon pressed')} // Placeholder functionality
                      >
                        <Icon
                          name="paper-plane"
                          size={20}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

            {post.comments.length + post.artistComments.length > commentsToShow && (
              <TouchableOpacity onPress={loadMoreComments} style={styles.loadMoreButton}>
                <Text style={styles.loadMoreText}>Load More Comments</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal for sending comment or image */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Message Group</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Write a message..."
              placeholderTextColor="gray"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />

{selectedImage && (
  <>
    {console.log("Displaying selected image with URI:", selectedImage)}
    <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginBottom: 10 }} />
  </>
)}


            <View style={styles.iconRow}>
              <TouchableOpacity onPress={uploadFile}>
                <Icon name="image" size={24} color="blue" />
              </TouchableOpacity>
              <TouchableOpacity onPress={takePicture}>
                <Icon name="camera" size={24} color="blue" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.postButton} onPress={handleSendComment}>
              <Text style={styles.postButtonText}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c002b' },
  errorText: { color: '#FFF', fontSize: 18 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingBottom: 10,
  },
  backButton: { padding: 10 },
  postTitle: { fontSize: 24, color: '#FFFFFF', fontWeight: 'bold', marginLeft: 10 },
  postImage: { width: '100%', height: 400, marginVertical: 20, resizeMode: 'cover' },
  interactionContainer: { flexDirection: 'row', justifyContent: 'flex-start', width: '100%', paddingBottom: 10 },
  interactionText: { fontSize: 16, color: '#FF0080', marginRight: 10 },
  commentsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    width: '100%',
    paddingBottom: 10,
  },
  fanCommentContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 7,
    marginVertical: 5,
    maxWidth: '70%',
    position: 'relative',
  },
  artistCommentContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF0080',
    borderRadius: 8,
    padding: 7,
    marginVertical: 5,
    maxWidth: '70%',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  commentAuthor: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },
  commentText: { fontSize: 14, color: '#FFF' },
  heartButton: {
    position: 'absolute',
    right: -30,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  dmButton: {
    position: 'absolute',
    right: -60,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  loadMoreButton: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#FF0080',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
  },
  loadMoreText: { color: '#FFFFFF', fontSize: 14, textAlign: 'center' },
  messageGroupButton: {
    position: 'absolute',
    right: 10,
    top: -40, // Positioned above the image
    backgroundColor: '#FF0080',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 20,
    zIndex: 10,
  },
  messageGroupButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
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
  likeAllButton: {
    backgroundColor: '#FF0080',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 5,
  },
  likeAllButtonText: { color: '#FFFFFF', fontSize: 14 },
});

export default PostDetailPage;
