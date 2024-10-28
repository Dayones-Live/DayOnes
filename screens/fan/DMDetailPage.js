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
  const [inputHeight, setInputHeight] = useState(40); // Track the height of the input
  const accessToken = useSelector((state) => state.accessToken);
  const userEmail = useSelector((state) => state.userProfile.data.email);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setInputHeight(40); // Reset the height when the keyboard hides
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchPostDetails = async (preserveLike = false) => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { post, artistComments, comments, reactions } = response.data.data;
      const isPostLiked = reactions.some(reaction => reaction.user.email === userEmail);
      setLiked(isPostLiked);

      const combinedComments = [
        ...artistComments.map((comment) => ({ ...comment, role: 'ARTIST' })),
        ...comments.map((comment) => ({ ...comment, role: 'FAN' }))
      ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const updatedPost = { ...post, combinedComments };
      if (preserveLike) {
        updatedPost.liked = liked;
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
        setLiked(true);
      } else {
        await axios.delete(`${BASEURL}/api/v1/post/${postId}/likes`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setLiked(false);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
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
        fetchPostDetails(true);
      } else {
        Alert.alert("Error", "Unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment.");
    }
  };

  const isCommentLikedByArtist = (comment) => {
    return comment.commentReactionCount > 0 && comment.user.email === userEmail;
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
              <View>
                <Text style={styles.commentAuthor}>{comment.user.full_name}</Text>
                <Text style={styles.commentText}>{comment.message}</Text>
              </View>
              {isCommentLikedByArtist(comment) && (
                <Icon name="heart" size={20} color="#FF0000" style={styles.likeIcon} />
              )}
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
          style={[styles.commentInput, { height: inputHeight }]}  // Dynamically controlled height
          placeholder="Write a comment..."
          placeholderTextColor="#aaa"
          value={commentText}
          onChangeText={setCommentText}
          multiline={false}  // Single line input
          numberOfLines={1}
          onFocus={() => setInputHeight(40)}  // Reset height on focus
          onBlur={() => setInputHeight(40)}  // Reset height on blur
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
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
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
