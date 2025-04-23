import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, RefreshControl, LayoutAnimation, UIManager } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageToBucket } from '../../utils';
import { uploadVideoToBucket } from '../../utils/videoUploadService';
import Icon from 'react-native-vector-icons/FontAwesome';
import Video from 'react-native-video';
import styles from './artistStyles/ArtistPostsPageStyles';
import { convertToTemporaryFile } from '../../assets/components/convertToTemporaryFileHelper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import icon library
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Linking } from 'react-native';
import { debounce } from 'lodash';

// Enable LayoutAnimation for Android (add near the top of the file)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ArtistPostsPage = () => {
  const [posts, setPosts] = useState([]);
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
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingPost, setIsSendingPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [listHeight, setListHeight] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const isFirstMount = useRef(true);
  const isFetching = useRef(false);
  const genericPostIdRef = useRef(null);
  const mountedRef = useRef(false);
  const flatListRef = useRef(null);
  const currentScrollPosition = useRef(0);

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}m`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const findGenericPost = (posts) => {
    return posts.find(post => post.type === 'GENERIC')?.id;
  };

  const POSTS_PER_PAGE = 25;

  const fetchArtistPosts = async (pageNum = 1) => {
    console.log('fetchArtistPosts called with:', {
      pageNum,
      loading,
      hasMore,
      accessToken: !!accessToken
    });

    if (loading) {
      console.log('Skipping fetch - already loading');
      return;
    }
    
    if (!accessToken) {
      console.log('Skipping fetch - no access token');
      return;
    }

    setLoading(true);
    try {
      console.log(`Making API request for page ${pageNum}`);
      const apiUrl = `${BASEURL}/api/v1/post?pageNo=${pageNum}&pageSize=${POSTS_PER_PAGE}`;
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postsData = response.data?.data?.posts || [];
      console.log(`Received ${postsData.length} posts for page ${pageNum}`);
      
      // Find generic post in current batch
      const genericPost = postsData.find(post => post.type === 'GENERIC');
      console.log('Generic post found in current batch:', genericPost ? {
        id: genericPost.id,
        type: genericPost.type,
        created_at: genericPost.created_at
      } : 'None');

      // Filter out generic posts from regular posts
      const regularPosts = postsData.filter(post => post.type !== 'GENERIC');
      console.log(`Regular posts count: ${regularPosts.length}`);
      
      // Sort regular posts by date (newest first)
      const sortedPosts = regularPosts.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });

      if (pageNum === 1) {
        // For first page, include generic post at the top if it exists
        const newPosts = genericPost ? [genericPost, ...sortedPosts] : sortedPosts;
        setPosts(newPosts);
        
        if (genericPost?.id) {
          console.log('Setting generic post ID:', genericPost.id);
          setGenericPostId(genericPost.id);
        }
      } else {
        // For subsequent pages
        setPosts(prev => {
          const prevGenericPost = prev.find(p => p.type === 'GENERIC');
          if (prevGenericPost) {
            // Already have generic post, just append regular posts
            return [prevGenericPost, ...prev.filter(p => p.type !== 'GENERIC'), ...sortedPosts];
          }
          // Found generic post in this batch
          if (genericPost) {
            setHasMore(false); // Stop pagination since we found the generic post
            return [genericPost, ...prev, ...sortedPosts];
          }
          // No generic post found yet, continue looking
          return [...prev, ...sortedPosts];
        });
      }

      // Set hasMore based on regular posts count and whether we found generic post
      setHasMore(regularPosts.length === POSTS_PER_PAGE && !genericPost);
      console.log(`Has more posts: ${regularPosts.length === POSTS_PER_PAGE && !genericPost}`);
      
      if (pageNum === 1) {
        setPage(2);
      } else {
        setPage(pageNum + 1);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setHasMore(false);
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
    const loadInitialData = async () => {
      console.log('loadInitialData called with:', {
        accessToken: !!accessToken,
        isLoggedIn,
        postsLength: posts.length
      });

      if (!accessToken) {
        console.log('Skipping initial load - no access token');
        return;
      }
      
      try {
        console.log('Starting initial load of posts');
        setPage(1);
        setHasMore(true);
        await fetchArtistPosts(1);
        setLastRefreshTime(Date.now());
        isFirstMount.current = false;
        console.log('Initial load completed successfully');
      } catch (error) {
        console.error('Error in initial load:', error);
      }
    };

    loadInitialData();
  }, [accessToken]); // Only depend on accessToken

  const handleScroll = (event) => {
    currentScrollPosition.current = event.nativeEvent.contentOffset.y;
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && currentScrollPosition.current > 0) {
      const nextPage = page + 1;
      console.log('Loading more posts, page:', nextPage);
      
      setPage(nextPage);
      fetchArtistPosts(nextPage).then(() => {
        if (flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToOffset({
              offset: currentScrollPosition.current,
              animated: false
            });
          }, 100);
        }
      });
    }
  }, [loading, hasMore, page, listHeight]);

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => {
    setSelectedImage(null); // Clear the selected image
    setMediaType(null); // Clear the media type
    setPostText(''); // Clear the text input
    setModalVisible(false); // Close the modal
  };

  const takePicture = async () => {
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;
  
      // Check if permission is granted
      const result = await check(permission);
  
      // Define options for launchCamera
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        saveToPhotos: true,
      };
  
      if (result === RESULTS.GRANTED) {
        // Permission is already granted; launch the camera
        launchCamera(options, (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorMessage) {
            console.log('ImagePicker Error: ', response.errorMessage);
          } else if (response.assets && response.assets.length > 0) {
            const capturedImage = response.assets[0];
            setSelectedImage(capturedImage.uri);
            setMediaType('PHOTO');
          }
        });
      } else if (result === RESULTS.DENIED) {
        // Request permission
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          // Permission granted after request; launch the camera
          launchCamera(options, (response) => {
            if (response.didCancel) {
              console.log('User cancelled image picker');
            } else if (response.errorMessage) {
              console.log('ImagePicker Error: ', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
              const capturedImage = response.assets[0];
              setSelectedImage(capturedImage.uri);
              setMediaType('PHOTO');
            }
          });
        }
      } else if (result === RESULTS.BLOCKED) {
        // Permission is blocked; open settings
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
    }
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
    setIsUploading(true); // Start the loading indicator
    try {
      let s3Url;
      if (mediaType === 'PHOTO') {
        s3Url = await uploadImageToBucket(uri, 'message-media', accessToken);
      } else if (mediaType === 'VIDEO') {
        s3Url = await uploadVideoToBucket(uri, 'message-media', accessToken);
      }
      console.log('Media uploaded to:', s3Url); // Debugging
      return s3Url;
    } catch (error) {
      console.error('Failed to upload media:', error);
      Alert.alert('Error', 'Media upload failed. Please try again.');
      return null;
    } finally {
      setIsUploading(false); // Stop the loading indicator
    }
  };
  
  const handleSendPost = async () => {
    console.log('Starting handleSendPost with genericPostId:', genericPostId);

    if (selectedImage && !postText.trim()) {
      Alert.alert(
        'Message Required',
        'A message is required when sending an image. Please include a message.'
      );
      return;
    }

    if (!postText.trim() && !selectedImage) {
      Alert.alert('Error', 'Post content or image is required.');
      return;
    }

    setIsSendingPost(true);
    let s3Url = selectedImage;

    try {
      if (selectedImage && !selectedImage.startsWith('https://')) {
        s3Url = await handleMediaUpload(selectedImage);
        if (!s3Url) {
          throw new Error('Media upload failed');
        }
      }

      // Check if we need to create a new generic post
      const shouldCreateGenericPost = !genericPostId || !(await checkPostExists(genericPostId));

      if (shouldCreateGenericPost) {
        console.log('Creating new generic post');
        const postData = {
          message: postText.trim(),
          type: 'GENERIC',
          imageUrl: s3Url,
          mediaType: mediaType,
        };
        const response = await axios.post(`${BASEURL}/api/v1/post/generic`, postData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 200 || response.status === 201) {
          Alert.alert('Success', 'Your message has been sent to all fans.');
          setGenericPostId(response.data?.data?.post?.id);
        }
      } else {
        // Add comment to existing generic post
        console.log('Adding comment to existing generic post');
        const commentData = {
          message: postText.trim(),
          ...(s3Url && { url: s3Url, mediaType: mediaType })
        };

        const response = await axios.post(
          `${BASEURL}/api/v1/post/${genericPostId}/comment`,
          commentData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log('Comment response:', response.data);

        if (response.status === 200 || response.status === 201) {
          Alert.alert('Success', 'Your comment has been posted.');
        }
      }

      setPostText('');
      setSelectedImage(null);
      setMediaType(null);
      setModalVisible(false);
      await forceRefresh();
    } catch (error) {
      console.error("Failed to send post or comment:", error);
      Alert.alert('Error', 'Failed to send. Please try again.');
    } finally {
      setIsSendingPost(false);
    }
  };
  
  // Add this helper function to check if a post exists
  const checkPostExists = async (postId) => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.status === 200;
    } catch (error) {
      console.log('Post does not exist:', error.response?.status);
      return false;
    }
  };

  const renderPostItem = (post, index) => {
    // Format date to US style (MM/DD/YY)
    const date = new Date(post.created_at);
    const postDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    return (
      <TouchableOpacity
        key={index}
        style={styles.postContainer}
        onPress={() => navigation.navigate('PostDetailPage', { postId: post.id })}
        onLongPress={() => confirmDelete(post.id)}
      >
        {/* Location */}
        <Text style={styles.postUser}>{post.locale || 'My DayOnes'}</Text>

        {/* Fan Count (Top-Right Corner) */}
        <View style={styles.fanCountCorner}>
          <MaterialIcons name="person" size={18} color="#FFF" />
          <Text style={styles.fanCountText}>{post.associate_fan_count || 0}</Text>
        </View>

        {/* Post Image */}
        {post.type === 'GENERIC' ? (
          <Image
            source={require('../../assets/images/Untitled_design-2.jpg')} // Always use the placeholder image for generic posts
            style={styles.postImage}
          />
        ) : post.image_url ? (
          <Image source={{ uri: post.image_url }} style={styles.postImage} />
        ) : (
          <View style={styles.inviteOnlyBox}>
            <Text style={styles.inviteOnlyText}>Invite Only</Text>
          </View>
        )}

        {/* Interaction Data */}
        <View style={styles.interactionContainer}>
          <Text style={styles.interactionText}>
            ❤️ {post.reactionCount || 0} {/* Reaction Count */}
          </Text>
          <Text style={styles.interactionText}>
            💬 {post.commentsCount || 0} {/* Comment Count */}
          </Text>
        </View>

        {/* Post Date */}
        <Text style={styles.postDate}>{postDate}</Text>
      </TouchableOpacity>
    );
  };

  const handleRefresh = async () => {
    console.log('handleRefresh called');
    setRefreshing(true);
    try {
      setPage(1);
      setHasMore(true);
      await fetchArtistPosts(1);
      setLastRefreshTime(Date.now());
      console.log('Refresh completed successfully');
    } catch (error) {
      console.error('Error in handleRefresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const forceRefresh = async () => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      setPage(1);
      setHasMore(true);
      await fetchArtistPosts(1);
      setLastRefreshTime(Date.now());
    } finally {
      isFetching.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ProfilePictureButton />
        <TouchableOpacity style={styles.plusButton} onPress={handleOpenModal}>
          <AntDesign name="pluscircleo" size={35} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Posts</Text>
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={({ item, index }) => renderPostItem(item, index)}
          keyExtractor={item => item.id}
          onEndReached={hasMore ? handleLoadMore : null}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          onContentSizeChange={(w, h) => setListHeight(h)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={["#FFFFFF"]}
              progressBackgroundColor="#000000"
              progressViewOffset={20}
              size="large"
            />
          }
          ListFooterComponent={() => (
            <View style={styles.footer}>
              {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
              {!hasMore && posts.length > 0 && (
                <Text style={styles.noMorePosts}>No more posts</Text>
              )}
            </View>
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            styles.flatListContent,
            !hasMore && posts.length > 0 && styles.flatListContentEnded
          ]}
        />

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

              <TouchableOpacity 
                style={styles.postButton} 
                onPress={isSendingPost ? null : handleSendPost}
                disabled={isSendingPost}
              >
                {isSendingPost ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
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

export default ArtistPostsPage;