import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
  SafeAreaView,
  Alert,
  View,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import styles from './fanStyles/MyCollectionsPageStyles';
import ImageViewing from 'react-native-image-viewing';
import { getFanOrders } from '../../services/merch.service';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const SPACING = 0;
const CENTER_PADDING = (screenWidth - CARD_WIDTH) / 2;

const MyCollectionsPage = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isArtistModalVisible, setIsArtistModalVisible] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('coverFlow'); // 'coverFlow' or 'grid'
  const [activeTab, setActiveTab] = useState('drops');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const accessToken = useSelector((state) => state.accessToken);
  const coverFlowRef = useRef(null);
  const [listReady, setListReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchArtistPosts = async () => {
    if (!accessToken) {
      console.log("No access token available, skipping fetchArtistPosts");
      return;
    }
    
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPosts(response.data?.data?.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'An error occurred while fetching posts.');
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await getFanOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Refetch collection whenever page is focused
  useFocusEffect(
    useCallback(() => {
      if (!accessToken) {
        console.log("No access token available, skipping collection fetch");
        return;
      }
      fetchArtistPosts();
    }, [accessToken])
  );

  const openImageViewer = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageViewerVisible(true);
  };

  // Always default posts to an array
  const filteredPosts = Array.isArray(posts) ? posts.filter(post => post.image_url) : [];
  const totalAutographs = filteredPosts.length;
  
  // Get unique artists with their data
  const artistsMap = new Map();
  filteredPosts.forEach(post => {
    if (post.user?.full_name) {
      const artistId = post.user.id;
      if (!artistsMap.has(artistId)) {
        artistsMap.set(artistId, {
          id: artistId,
          name: post.user.full_name,
          avatar: post.user.avatar_url,
          autographCount: 1
        });
      } else {
        artistsMap.get(artistId).autographCount += 1;
      }
    }
  });
  
  const uniqueArtists = artistsMap.size;
  const artistsList = Array.isArray(Array.from(artistsMap.values())) ? Array.from(artistsMap.values()) : [];

  // Filter posts by selected artist
  const artistFilteredPosts = selectedArtist 
    ? filteredPosts.filter(post => post.user?.id === selectedArtist.id)
    : filteredPosts;

  useEffect(() => {
    // Only reset listReady when posts change, not when artist changes
    // This prevents flickering when switching artists
    setListReady(false);
  }, [filteredPosts.length]);

  useEffect(() => {
    // Only scroll if there are items and the FlatList is ready
    const data = selectedArtist ? artistFilteredPosts : filteredPosts;
    if (
      coverFlowRef.current &&
      listReady &&
      data.length > 0
    ) {
      // Reset scroll position when switching artists or when list changes
      const targetOffset = currentIndex * (CARD_WIDTH + SPACING);
      coverFlowRef.current.scrollToOffset({
        offset: targetOffset,
        animated: false,
      });
      // Also reset the animated value to match
      scrollX.setValue(targetOffset);
    }
  }, [filteredPosts.length, artistFilteredPosts.length, selectedArtist, listReady, currentIndex]);

  useEffect(() => {
    // If the current index is out of bounds, reset to 0
    if (selectedArtist) {
      if (currentIndex >= artistFilteredPosts.length) {
        setCurrentIndex(0);
      }
    } else {
      if (currentIndex >= filteredPosts.length) {
        setCurrentIndex(0);
      }
    }
  }, [filteredPosts.length, artistFilteredPosts.length, selectedArtist]);

  // Reset scroll position when artist changes
  useEffect(() => {
    if (selectedArtist && coverFlowRef.current && listReady) {
      // Small delay to ensure the list is fully rendered
      setTimeout(() => {
        scrollX.setValue(0);
        if (coverFlowRef.current) {
          coverFlowRef.current.scrollToOffset({
            offset: 0,
            animated: false,
          });
        }
      }, 100); // Increased delay to ensure smooth transition
    }
  }, [selectedArtist, listReady]);

  const handleArtistSelect = (artist) => {
    // Fade out current view
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedArtist(artist);
      setIsArtistModalVisible(false);
      // Reset animation state and index for new artist
      scrollX.setValue(0);
      setCurrentIndex(0);
      // Fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleBackToGallery = () => {
    setSelectedArtist(null);
    setCurrentIndex(0); // Reset currentIndex so cover flow starts at the first image
    // Reset animation state when going back to main gallery
    scrollX.setValue(0);
  };

  const renderCoverFlowItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING),
      index * (CARD_WIDTH + SPACING),
      (index + 1) * (CARD_WIDTH + SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ['-60deg', '0deg', '60deg'],
      extrapolate: 'clamp',
    });

    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [CARD_WIDTH * 0.2, 0, -CARD_WIDTH * 0.2],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    const glowOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.1, 0.8, 0.1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.coverFlowItemContainer}>
        {/* Glow effect underneath - REMOVED */}
        {/* <Animated.View 
          style={[
            styles.coverFlowGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale }]
            }
          ]} 
        /> */}
        
        {/* Main card */}
        <Animated.View
          style={[
            styles.coverFlowCard,
            {
              transform: [
                { scale },
                { rotateY }
              ],
              opacity
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => openImageViewer(item.image_url)}
            activeOpacity={0.9}
            style={styles.coverFlowTouchable}
          >
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.coverFlowImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderGridItem = ({ item, index }) => (
    <TouchableOpacity 
      key={index} 
      style={styles.imageWrapper} 
      onPress={() => openImageViewer(item.image_url)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} />
    </TouchableOpacity>
  );

  const renderArtistItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.artistItem}
      onPress={() => handleArtistSelect(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.avatar }} 
        style={styles.artistAvatar}
        defaultSource={require('../../assets/images/defaultProfileImage.jpg')}
      />
      <View style={styles.artistInfo}>
        <Text style={styles.artistName}>{item.name}</Text>
        <Text style={styles.artistCount}>{item.autographCount} autograph{item.autographCount > 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderViewSwitcher = () => (
    <View style={styles.viewSwitcherContainer}>
      <TouchableOpacity 
        style={[
          styles.viewTab, 
          viewMode === 'coverFlow' && styles.activeViewTab
        ]}
        onPress={() => setViewMode('coverFlow')}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.viewTabText,
          viewMode === 'coverFlow' && styles.activeViewTabText
        ]}>
          Cover Flow
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.viewTab, 
          viewMode === 'grid' && styles.activeViewTab
        ]}
        onPress={() => setViewMode('grid')}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.viewTabText,
          viewMode === 'grid' && styles.activeViewTabText
        ]}>
          Grid
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render Cover Flow filtered view
  if (selectedArtist) {
    return (
      <SafeAreaView style={styles.filteredContainer}>
        {/* Sleek header with back button and artist info */}
        <View style={styles.filteredHeader}>
          <TouchableOpacity 
            style={styles.backButtonSleek}
            onPress={handleBackToGallery}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonTextSleek}>←</Text>
          </TouchableOpacity>
          <View style={styles.filteredArtistInfoSleek}>
            <Image 
              source={{ uri: selectedArtist.avatar }} 
              style={styles.filteredArtistAvatarSleek}
              defaultSource={require('../../assets/images/defaultProfileImage.jpg')}
            />
            <View style={styles.filteredArtistTextSleek}>
              <Text style={styles.filteredArtistNameSleek}>{selectedArtist.name}</Text>
              <Text style={styles.filteredArtistCountSleek}>
                {selectedArtist.autographCount} autograph{selectedArtist.autographCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Cover Flow Gallery */}
        <Animated.View 
          style={[
            styles.coverFlowContainer, 
            { opacity: fadeAnim }
          ]} 
          onLayout={() => setListReady(true)}
        >
          {artistFilteredPosts.length === 0 ? (
            <Text style={styles.noPostsText}>
              No autographs from {selectedArtist.name}
            </Text>
          ) : (
            <Animated.FlatList
              key={`artist-${selectedArtist.id}-${artistFilteredPosts.length}`}
              ref={coverFlowRef}
              data={artistFilteredPosts}
              renderItem={renderCoverFlowItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + SPACING}
              decelerationRate="fast"
              contentContainerStyle={[
                styles.coverFlowContent,
                artistFilteredPosts.length > 1
                  ? { paddingLeft: CENTER_PADDING, paddingRight: CENTER_PADDING }
                  : { justifyContent: 'center', alignItems: 'center', flex: 1 }
              ]}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + SPACING));
                setCurrentIndex(index);
              }}
            />
          )}
        </Animated.View>

        {/* Fullscreen image viewer */}
        <ImageViewing
          images={[{ uri: selectedImage }]}
          imageIndex={0}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
        />
      </SafeAreaView>
    );
  }

  // Render full gallery view (with stats and title)
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Autographs</Text>
      <Text style={styles.subtitle}>Your personal collection of signed memories</Text>

      <View style={styles.segmentControl}>
        <TouchableOpacity
          style={[styles.segmentButton, activeTab === 'drops' && styles.segmentButtonActive]}
          onPress={() => setActiveTab('drops')}
        >
          <Text style={[styles.segmentText, activeTab === 'drops' && styles.segmentTextActive]}>Drops</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, activeTab === 'orders' && styles.segmentButtonActive]}
          onPress={() => { setActiveTab('orders'); fetchOrders(); }}
        >
          <Text style={[styles.segmentText, activeTab === 'orders' && styles.segmentTextActive]}>Orders</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'drops' && (
        <>
          {filteredPosts.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalAutographs}</Text>
                <Text style={styles.statLabel}>Autographs</Text>
              </View>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => setIsArtistModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>{uniqueArtists}</Text>
                <Text style={styles.statLabel}>Artists</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.imageGrid}>
            {filteredPosts.length === 0 ? (
              <Text style={styles.noPostsText}>Start collecting your first autograph!</Text>
            ) : (
              filteredPosts.map((post, index) => renderGridItem({ item: post, index }))
            )}
          </ScrollView>
        </>
      )}

      {activeTab === 'orders' && (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => navigation.navigate('MerchOrderDetailPage', { orderId: item.id })}
            >
              <Text style={styles.orderNumber}>{item.order_number}</Text>
              <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={styles.orderStatus}>{item.status}</Text>
              <Text style={styles.orderTotal}>${Number(item.total).toFixed(2)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            ordersLoading ? <ActivityIndicator color="#FF0080" /> : <Text style={styles.emptyText}>No orders yet</Text>
          }
        />
      )}

      {/* Artists Modal */}
      <Modal
        visible={isArtistModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsArtistModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Artists</Text>
              <TouchableOpacity
                onPress={() => setIsArtistModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={artistsList}
              renderItem={renderArtistItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.artistList}
            />
          </View>
        </View>
      </Modal>

      {/* Fullscreen image viewer */}
      <ImageViewing
        images={[{ uri: selectedImage }]}
        imageIndex={0}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
};

export default MyCollectionsPage;
