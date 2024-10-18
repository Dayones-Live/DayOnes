import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';

const PostDetailPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params;
  const accessToken = useSelector(state => state.accessToken);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log("Full Response:", response.data);

        const postData = response.data?.data?.post || {};
        const reactionCount = response.data?.data?.reaction || 0;
        const comments = response.data?.data?.comments || [];

        comments.forEach((comment, index) => {
          console.log(`Comment ${index + 1}:`, comment);
        });

        setPost({ ...postData, reactionCount, comments });
      } catch (error) {
        console.error("Error fetching post:", error.response || error.message);
        Alert.alert("Error", "Could not load post details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId, accessToken]);

  const handleCreateConversation = async (recieverId) => {
    try {
      const response = await axios.post(`${BASEURL}/api/v1/conversation`, {
        recieverId: recieverId,
        lastMessage: 'Hello',
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      Alert.alert('Success', 'Conversation created!');
      console.log('Conversation response:', response.data);
    } catch (error) {
      console.error('Error creating conversation:', error.response || error.message);
      Alert.alert('Error', 'Could not create a conversation.');
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#FFF" />
      </TouchableOpacity>

      <Text style={styles.postTitle}>{post.locale || 'Unknown Location'}</Text>
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.postImage} />
      ) : (
        <Text style={styles.errorText}>Image not available</Text>
      )}
      <Text style={styles.postText}>{post.message || 'No content available'}</Text>
      <View style={styles.interactionContainer}>
        <Text style={styles.interactionText}>❤️ {post.reactionCount}</Text>
        <Text style={styles.interactionText}>💬 {post.comments.length}</Text>
      </View>

      {/* Comments Section */}
      <Text style={styles.commentsHeader}>Comments</Text>
      {post.comments.length > 0 ? (
        post.comments.map((comment, index) => (
          <View key={index} style={styles.commentContainer}>
            <View style={styles.commentHeader}>
              {comment.user?.avatar_url ? (
                <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.placeholderAvatar}><Text>👤</Text></View>
              )}
              <Text style={styles.commentAuthor}>{comment.user?.full_name || 'Anonymous'}</Text>
              {/* DM Badge */}
              <TouchableOpacity
                style={styles.dmBadge}
                onPress={() => handleCreateConversation(comment.user?.id)}
              >
                <Icon name="envelope" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.commentText}>{comment.message}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noCommentsText}>No comments yet.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0c002b', padding: 16, alignItems: 'center' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c002b' },
  errorText: { color: '#FFF', fontSize: 18 },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
  },
  postTitle: { fontSize: 24, color: '#FFFFFF', fontWeight: 'bold', marginVertical: 10 },
  postImage: { width: '100%', height: 400, marginVertical: 20 },
  postText: { fontSize: 16, color: '#FFFFFF', textAlign: 'center', marginVertical: 10 },
  interactionContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
  interactionText: { fontSize: 16, color: '#FF0080' },
  commentsHeader: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  commentContainer: { backgroundColor: '#222', padding: 10, borderRadius: 8, marginVertical: 5, width: '100%' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dmBadge: {
    marginLeft: 'auto',
    padding: 5,
    backgroundColor: '#FF0080',
    borderRadius: 8,
  },
  commentAuthor: { fontSize: 14, color: '#FF0080', fontWeight: 'bold' },
  commentText: { fontSize: 14, color: '#FFFFFF' },
  noCommentsText: { color: '#888', fontSize: 14, marginTop: 10 },
});

export default PostDetailPage;
