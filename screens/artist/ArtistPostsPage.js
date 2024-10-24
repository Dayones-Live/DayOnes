import React, { useState, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton'; // Import ProfilePictureButton
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome for icons

const ArtistPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const accessToken = useSelector(state => state.accessToken);
  const navigation = useNavigation();

  const fetchArtistPosts = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const postsData = response.data?.data?.posts || [];

      // Sort posts by 'created_at' field, with newest posts appearing first
      const sortedPosts = postsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPosts(posts.filter(post => post.id !== postId)); // Remove deleted post from state
      Alert.alert('Success', 'The post has been deleted.');
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete the post.');
    }
  };

  const confirmDelete = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post and all of its data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => handleDelete(postId), style: 'destructive' },
      ]
    );
  };

  // Fetch posts whenever page is focused
  useFocusEffect(
    useCallback(() => {
      fetchArtistPosts();
    }, [])
  );

  const renderPostItem = (post, index) => {
    const postDate = new Date(post.created_at).toLocaleString(); // Format the created_at timestamp

    return (
      <TouchableOpacity
        key={index}
        style={styles.postContainer}
        onPress={() => navigation.navigate('PostDetailPage', { postId: post.id })}
        onLongPress={() => confirmDelete(post.id)} // Long press to show delete confirmation
      >
        <Text style={styles.postUser}>{post.locale || 'Unknown Location'}</Text>

        {post.image_url ? (
          // Display image if available
          <Image source={{ uri: post.image_url }} style={styles.postImage} />
        ) : (
          // Display black box with "Invite Only" text inside
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
        {/* Profile Picture Button */}
        <ProfilePictureButton />

        {/* Message All Fans Button */}
        <TouchableOpacity style={styles.messageAllButton} onPress={() => Alert.alert('Message All Fans', 'This will send a message to all fans.')}>
          <Text style={styles.messageAllText}>Message All Fans</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Posts</Text>
        <ScrollView style={styles.scrollView}>
          {posts.map((post, index) => renderPostItem(post, index))}
        </ScrollView>
        {posts.length === 0 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={fetchArtistPosts} style={styles.button}>
              <Text style={styles.buttonText}>Fetch Posts</Text>
            </TouchableOpacity>
          </View>
        )}
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
  }, // Style for the timestamp

  // Style for the "Message All Fans" button
  messageAllButton: {
    position: 'absolute',
    top: 25, // Move it down a bit
    right: 5, // Move it a little more to the right
    paddingVertical: 7,
    paddingHorizontal: 10, // Adjusted padding for better button shape
    backgroundColor: '#FF0080',
    borderRadius: 25,
    zIndex: 10, // Ensure it stays clickable and above other elements
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  messageAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#FF0080',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  inviteOnlyBox: {
    width: '100%',
    height: 200, // Same height as the image
    backgroundColor: '#000', // Black background
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  inviteOnlyText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },


});

export default ArtistPostsPage;
