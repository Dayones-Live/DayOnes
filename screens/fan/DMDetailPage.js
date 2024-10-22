import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useSelector } from 'react-redux';

const DMDetailPage = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false); // Separate liked state
  const accessToken = useSelector((state) => state.accessToken);

  const fetchPostDetails = async (preserveLike = false) => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Full API Response:", response.data);

      const { post, artistComments, comments } = response.data.data;

      // Combine and sort both comments by created_at timestamp with newest first
      const combinedComments = [
        ...artistComments.map((comment) => ({ ...comment, role: 'ARTIST' })),
        ...comments.map((comment) => ({ ...comment, role: 'FAN' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Preserve liked state if requested
      const updatedPost = { ...post, combinedComments };
      if (preserveLike) {
        updatedPost.liked = liked;
      } else {
        setLiked(post.liked); // Update the liked state
      }
      setPost(updatedPost);

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
      if (!liked) {
        await axios.post(`${BASEURL}/api/v1/post/${postId}/likes`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setLiked(true); // Update liked state
      } else {
        await axios.delete(`${BASEURL}/api/v1/post/${postId}/likes`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setLiked(false); // Update liked state
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setLiked(true); // Handle already liked case
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
      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        { message: commentText },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setCommentText(''); // Clear the input after sending
        fetchPostDetails(true); // Refresh post details while preserving the 'liked' state
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}  // Adjust the padding to prevent comments from going behind the text input
        >
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
              <Icon name="heart" size={30} color={liked ? '#FF0000' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          {/* Display combined and sorted comments */}
          <View style={styles.commentsContainer}>
            {post.combinedComments?.map((comment, index) => (
              <View
                key={index}
                style={
                  comment.role === 'ARTIST'
                    ? styles.artistCommentContainer
                    : styles.fanCommentContainer
                }
              >
                <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
                <Text style={styles.commentText}>{comment.message}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Comment Input Bar at Bottom */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#aaa"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: commentText.trim() ? '#FF0080' : '#555' }]}
            onPress={addComment}
            disabled={!commentText.trim()}
          >
            <Icon name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
  interactionContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 20, justifyContent: 'center' },
  commentsContainer: { marginTop: 20 },
  artistCommentContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#FF0080',
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
  commentText: { fontSize: 16, color: '#FFF' },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#0c002b',
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
