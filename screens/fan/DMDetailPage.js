import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useSelector } from 'react-redux';

const DMDetailPage = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likedComments, setLikedComments] = useState([]); // Track liked artist and fan comments separately
  const [inputHeight, setInputHeight] = useState(40);
  const accessToken = useSelector((state) => state.accessToken);
  const userEmail = useSelector((state) => state.userProfile.data.email);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setInputHeight(40);
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchPostDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postData = response.data?.data?.post || {};
      const reactions = response.data?.data?.reactions || [];
      const artistComments = response.data?.data?.artistComments || [];
      const comments = response.data?.data?.comments || [];

      // Set post reactions
      const isPostLiked = reactions.some(reaction => reaction.user.email === userEmail);
      setLiked(isPostLiked);

      // Identify liked artist comments based on commentReactionCount
      const likedArtistComments = artistComments
        .filter((comment) => comment.commentReactionCount > 0)
        .map((comment) => comment.id);

      // Identify liked fan comments based on commentReactionCount
      const likedFanComments = comments
        .filter((comment) => comment.commentReactionCount > 0)
        .map((comment) => comment.id);

      setLikedComments([...likedArtistComments, ...likedFanComments]); // Combine both artist and fan liked comments
      setPost({ ...postData, artistComments, comments });

      // Log the post details
      console.log("Post details:", { ...postData, artistComments, comments });
    } catch (error) {
      console.error('Error fetching post details:', error.response || error.message);
      Alert.alert('Error', 'Could not load post details.');
    }
  };


  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const toggleLike = async () => {
    try {
      if (!liked) {
        const response = await axios.post(`${BASEURL}/api/v1/post/${postId}/likes`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 200 || response.status === 201) {
          setLiked(true);
        } else {
          console.error("Unexpected response status:", response.status);
          Alert.alert("Error", "Failed to like the post due to an unexpected response.");
        }
      } else {
        const response = await axios.delete(`${BASEURL}/api/v1/post/${postId}/likes`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 200 || response.status === 204) {
          setLiked(false);
        } else {
          console.error("Unexpected response status:", response.status);
          Alert.alert("Error", "Failed to unlike the post due to an unexpected response.");
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);

      if (error.response) {
        if (error.response.status === 403) {
          Alert.alert("Permission Denied", "You don't have permission to perform this action. Please check your access token or user permissions.");
        } else if (error.response.status === 401) {
          Alert.alert("Unauthorized", "Your session may have expired. Please log in again.");
        } else {
          Alert.alert("Error", `Request failed with status code ${error.response.status}`);
        }
      } else if (error.request) {
        Alert.alert("Network Error", "No response from the server. Please check your connection.");
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
  };


  const addComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }
    try {
      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        { message: commentText },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setCommentText('');
        fetchPostDetails();
      } else {
        Alert.alert("Error", "Unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment.");
    }
  };

  const likeComment = async (commentId) => {
    console.log("Function likeComment called with commentId:", commentId);

    if (!commentId) {
      console.warn("No commentId provided to likeComment function.");
      return;
    }

    console.log("Access token being used:", accessToken);

    try {
      const response = await axios.post(
        `${BASEURL}/api/v1/comment/like/${commentId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      if (response.status === 200 || response.status === 201) {
        setLikedComments((prevLikedComments) => [...prevLikedComments, commentId]);
        console.log(`Comment with ID ${commentId} successfully liked.`);
      } else {
        console.warn("Unexpected response status:", response.status);
        Alert.alert("Error", "Unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error occurred in likeComment:", error);

      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);

        if (error.response.status === 403) {
          Alert.alert("Permission Denied", "You don't have permission to like this comment.");
        } else if (error.response.status === 401) {
          Alert.alert("Unauthorized", "Your session may have expired. Please log in again.");
        } else {
          Alert.alert("Error", `Request failed with status code ${error.response.status}`);
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        Alert.alert("Network Error", "No response from the server. Please check your connection.");
      } else {
        console.error("Unexpected error:", error.message);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
  };


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
    } catch (error) {
      Alert.alert('Error', 'Failed to dislike the comment.');
    }
  };

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollViewContainer, { paddingBottom: 100 }]} style={{ flex: 1 }}>
        {post.user && (
          <View style={styles.userInfoContainer}>
            <Image source={{ uri: post.user.avatar_url }} style={styles.userAvatar} />
            <Text style={styles.userName}>{post.user.full_name}</Text>
          </View>
        )}

        {post.image_url && (
          <Image source={{ uri: post.image_url }} style={styles.postImage} />
        )}

        <View style={styles.interactionContainer}>
          <TouchableOpacity onPress={toggleLike}>
            <Icon name="heart" size={30} color={liked ? '#FF0000' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        <View style={styles.commentsContainer}>
          {post.artistComments?.map((comment, index) => (
            <View
              key={index}
              style={styles.artistCommentContainer}
            >
              <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
              <View>
                <Text style={styles.commentAuthor}>{comment.user.full_name}</Text>
                <Text style={styles.commentText}>{comment.message}</Text>
              </View>
              <TouchableOpacity onPress={() => likedComments.includes(comment.id) ? dislikeComment(comment.id) : likeComment(comment.id)}>
                <Icon name="heart" size={20} color={likedComments.includes(comment.id) ? '#FF0000' : '#FFFFFF'} />
              </TouchableOpacity>
            </View>
          ))}

          {post.comments?.map((comment, index) => (
            <View
              key={index}
              style={styles.fanCommentContainer}
            >
              <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
              <View>
                <Text style={styles.commentAuthor}>{comment.user.full_name}</Text>
                <Text style={styles.commentText}>{comment.message}</Text>
              </View>
              {likedComments.includes(comment.id) && (<Icon name="heart" size={20} color="#FF0000" />)}

            </View>
          ))}
        </View>
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.commentInputContainer}
      >
        <TextInput
          style={[styles.commentInput, { height: inputHeight }]}
          placeholder="Write a comment..."
          placeholderTextColor="#aaa"
          value={commentText}
          onChangeText={setCommentText}
          multiline={false}
          numberOfLines={1}
          onFocus={() => setInputHeight(40)}
          onBlur={() => setInputHeight(40)}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: commentText.trim() ? '#FF0080' : '#555' }]}
          onPress={addComment}
          disabled={!commentText.trim()}
        >
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  scrollViewContainer: { flexGrow: 1 },
  loadingText: { fontSize: 20, color: '#ffffff' },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  userAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  userName: { fontSize: 18, color: '#ffffff' },
  postImage: { width: '100%', height: 300, borderRadius: 10, marginBottom: 10 },
  interactionContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 20, justifyContent: 'center' },
  commentsContainer: { marginTop: 20 },
  artistCommentContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  fanCommentContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  commentAuthor: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },
  commentText: { fontSize: 16, color: '#FFF' },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,  // Adjust padding for consistency
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#0c002b',
    position: 'absolute',
    bottom: 10,
    width: '100%',
  },
  commentInput: {
    flex: 1,
    color: '#ffffff',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 20,
    backgroundColor: '#333',
    width: '100%',  // Ensure input takes full width inside the wrapper
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 20,
  },
  likeIcon: {
    marginLeft: 10,  // Adds some space to the right of the comment
  },
});

export default DMDetailPage;
