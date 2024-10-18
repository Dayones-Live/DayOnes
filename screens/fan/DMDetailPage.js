import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useSelector } from 'react-redux';

const DMDetailPage = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const accessToken = useSelector((state) => state.accessToken);

  const fetchPostDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("Post details fetched:", response.data?.data?.post); // Print post details
      setPost(response.data?.data?.post || null);
    } catch (error) {
      console.error('Error fetching post details:', error);
      Alert.alert('Error', 'Failed to load post details.');
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, []);

  const toggleLike = async () => {
    try {
      console.log("Attempting to toggle like...");
      if (!post.liked) {
        console.log("Liking post...");
        await axios.post(`${BASEURL}/api/v1/post/${postId}/likes`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log("Post liked successfully");
        setPost((prevPost) => ({ ...prevPost, liked: true }));
      } else {
        console.log("Unliking post...");
        await axios.delete(`${BASEURL}/api/v1/post/${postId}/likes`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log("Post unliked successfully");
        setPost((prevPost) => ({ ...prevPost, liked: false }));
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log("Post was already liked or encountered a like conflict.");
        setPost((prevPost) => ({ ...prevPost, liked: true }));
      } else {
        console.error("Error toggling like:", error);
      }
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }
    try {
      console.log("Attempting to add comment...");
      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        { message: commentText },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log("Comment response:", response.data); // Log the response from the server

      if (response.status === 200 || response.status === 201) {
        console.log("Comment added successfully:", commentText);
        setCommentText(''); // Clear the input after sending
        fetchPostDetails(); // Refresh post details if needed
      } else {
        Alert.alert("Error", "Unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment.");
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
    <View style={styles.container}>
      {/* Display the user's full name and profile picture */}
      {post.user && (
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: post.user.avatar_url }}
            style={styles.userAvatar}
          />
          <Text style={styles.userName}>{post.user.full_name}</Text>
        </View>
      )}

      {post.image_url && (
        <Image source={{ uri: post.image_url }} style={styles.postImage} />
      )}

      <View style={styles.interactionContainer}>
        <TouchableOpacity onPress={toggleLike}>
          <Icon name="heart" size={30} color={post.liked ? '#FF0000' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {/* Comment Input Bar at Bottom */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.commentInputContainer}
      >
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          placeholderTextColor="#aaa"
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: commentText.trim() ? '#FF0080' : '#555' },
          ]}
          onPress={addComment}
          disabled={!commentText.trim()}
        >
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
  loadingText: { fontSize: 20, color: '#ffffff' },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  userAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  userName: { fontSize: 18, color: '#ffffff' },
  postImage: { width: '100%', height: 300, borderRadius: 10, marginBottom: 10 },
  postMessage: { fontSize: 16, color: '#ffffff', textAlign: 'center', marginBottom: 10 },
  interactionContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 20, justifyContent: 'center' },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  commentInput: {
    flex: 1,
    height: 40,
    color: '#ffffff',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 20,
    backgroundColor: '#333',
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 20,
  },
});

export default DMDetailPage;
