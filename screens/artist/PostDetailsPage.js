import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';

const PostDetailPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
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
      const reactions = response.data?.data?.reactions || []; // Use reactions array directly
      const reactionCount = reactions.length || 0; // Calculate the reaction count
      const artistComments = response.data?.data?.artistComments || [];
      const comments = response.data?.data?.comments || [];

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

  const addComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Comment cannot be empty.');
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
        fetchPostDetails(); // Refetch post details to get the updated comments
      } else {
        Alert.alert('Error', 'Unexpected response from the server.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF0080" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  // Combine and sort comments by time
  const sortedComments = [
    ...post.artistComments.map((comment) => ({ ...comment, role: 'ARTIST' })),
    ...post.comments.map((comment) => ({ ...comment, role: 'FAN' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollViewContainer, { paddingBottom: 100 }]} // Add paddingBottom here
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
            <Image source={{ uri: post.image_url }} style={styles.postImage} />
          ) : (
            <Text style={styles.errorText}>Image not available</Text>
          )}

          {/* Interaction icons (like and comment) */}
          <View style={styles.interactionContainer}>
            <Text style={styles.interactionText}>❤️ {post.reactionCount}</Text>
            <Text style={styles.interactionText}>
              💬 {Array.isArray(sortedComments) ? sortedComments.length : 0}
            </Text>
          </View>

          {/* Comments Section */}
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
                </View>
              ))}
          </View>
        </View>
      </ScrollView>

      {/* Comment Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.commentInputContainer}
      >
        <TextInput
          style={styles.commentInput}
          placeholder="Message your fans..."
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
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0c002b', padding: 16, alignItems: 'center' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c002b' },
  errorText: { color: '#FFF', fontSize: 18 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  postTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 10, // Ensures text is to the right of the arrow
  },
  postImage: { width: '100%', height: 400, marginVertical: 20 },
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
    padding: 10,
    marginVertical: 5,
    maxWidth: '70%',
  },
  artistCommentContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF0080',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    maxWidth: '70%',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  commentAuthor: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },
  commentText: { fontSize: 14, color: '#FFF' },
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
  sendButton: { marginLeft: 10, padding: 10, borderRadius: 20 },
});

export default PostDetailPage;
