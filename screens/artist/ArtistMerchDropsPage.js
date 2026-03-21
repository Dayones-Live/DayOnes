import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getArtistDrops } from '../../services/merch.service';
import styles from './artistStyles/ArtistMerchDropsPageStyles';

const DROP_STATUS_COLORS = {
  CREATING: '#F59E0B',
  ACTIVE: '#10B981',
  EXPIRED: '#6B7280',
  CANCELLED: '#EF4444',
};

const DROP_STATUS_LABELS = {
  CREATING: 'Creating',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

const formatCountdown = (ms) => {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

const ArtistMerchDropsPage = () => {
  const navigation = useNavigation();
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef(null);

  const fetchDrops = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await getArtistDrops();
      setDrops(data || []);
    } catch (err) {
      setError('Failed to load drops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDrops();
    }, [])
  );

  useEffect(() => {
    const hasActive = drops.some((d) => d.status === 'ACTIVE');
    if (hasActive) {
      intervalRef.current = setInterval(() => setNow(Date.now()), 60000);
      return () => clearInterval(intervalRef.current);
    }
  }, [drops]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrops(true);
  };

  const groupDropsByStatus = () => {
    const groups = { ACTIVE: [], CREATING: [], EXPIRED: [], CANCELLED: [] };
    drops.forEach((drop) => {
      const status = drop.status || 'EXPIRED';
      if (groups[status]) {
        groups[status].push(drop);
      }
    });
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  };

  const getDropImage = (drop) => {
    if (!drop.products || drop.products.length === 0) return null;
    const first = drop.products[0];
    return first.mockup_url || first.image_url;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0080" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchDrops()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const groupedDrops = groupDropsByStatus();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Merch Drops</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0080" />
        }
      >
        {drops.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="layers-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No merch drops yet</Text>
            <Text style={styles.emptySubtext}>
              Create a merch drop from any of your posts to start selling
            </Text>
          </View>
        ) : (
          groupedDrops.map(([status, statusDrops]) => (
            <View key={status}>
              <Text style={styles.sectionTitle}>
                {DROP_STATUS_LABELS[status]} ({statusDrops.length})
              </Text>
              {statusDrops.map((drop) => {
                const imageUri = getDropImage(drop);
                const statusColor = DROP_STATUS_COLORS[drop.status] || '#6B7280';
                const productCount = drop.products?.length || 0;
                const orderCount = drop.orders?.length || 0;
                const expiresMs = drop.expires_at
                  ? new Date(drop.expires_at).getTime() - now
                  : 0;

                return (
                  <TouchableOpacity
                    key={drop.id}
                    style={styles.dropCard}
                    onPress={() =>
                      navigation.navigate('ArtistMerchDropDetailPage', { dropId: drop.id })
                    }
                  >
                    <View style={styles.dropImageContainer}>
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.dropImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="shirt-outline" size={28} color="#555" />
                      )}
                    </View>
                    <View style={styles.dropInfo}>
                      <View style={styles.dropInfoTop}>
                        <Text style={styles.dropDate}>
                          {new Date(drop.created_at).toLocaleDateString()}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                          <Text style={styles.statusText}>
                            {DROP_STATUS_LABELS[drop.status] || drop.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.dropMeta}>
                        {productCount} product{productCount !== 1 ? 's' : ''} &middot;{' '}
                        {orderCount} order{orderCount !== 1 ? 's' : ''}
                      </Text>
                      {drop.status === 'ACTIVE' && expiresMs > 0 && (
                        <Text style={styles.dropCountdown}>{formatCountdown(expiresMs)}</Text>
                      )}
                      {drop.status === 'CREATING' && (
                        <Text style={styles.dropCountdown}>Creating products...</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistMerchDropsPage;
