import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getMerchDrop, cancelMerchDrop, getFanOrders } from '../../services/merch.service';
import styles from './artistStyles/ArtistMerchDropDetailPageStyles';

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

const ORDER_STATUS_COLORS = {
  PENDING: '#666',
  PAID: '#3B82F6',
  PRODUCTION: '#8B5CF6',
  SHIPPED: '#10B981',
  DELIVERED: '#059669',
  REFUNDED: '#EF4444',
  CANCELLED: '#EF4444',
  RETURN_REQUESTED: '#F97316',
};

const ORDER_STATUS_LABELS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PRODUCTION: 'In Production',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested',
};

const PRODUCT_TYPE_LABELS = {
  HOODIE: 'Hoodie',
  TSHIRT: 'T-Shirt',
  TANK: 'Tank Top',
  POSTER: 'Poster',
};

const formatCountdown = (ms) => {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s remaining`;
};

const ArtistMerchDropDetailPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { dropId } = route.params;

  const [drop, setDrop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const [dropData, ordersData] = await Promise.all([
        getMerchDrop(dropId),
        getFanOrders(),
      ]);
      setDrop(dropData);
      const dropOrders = (ordersData || []).filter(
        (o) => o.merch_drop_id === dropId
      );
      setOrders(dropOrders);
    } catch (err) {
      setError('Failed to load drop details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [dropId])
  );

  useEffect(() => {
    if (!drop?.expires_at || drop.status !== 'ACTIVE') return;
    const updateCountdown = () => {
      const remaining = new Date(drop.expires_at).getTime() - Date.now();
      setTimeRemaining(remaining > 0 ? remaining : 0);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [drop]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Merch Drop',
      'Are you sure you want to cancel this merch drop? This cannot be undone.',
      [
        { text: 'Keep Drop', style: 'cancel' },
        {
          text: 'Cancel Drop',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await cancelMerchDrop(dropId);
              fetchData();
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel drop. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getGroupedProducts = () => {
    if (!drop?.products) return [];
    const grouped = {};
    drop.products.forEach((product) => {
      if (!grouped[product.product_type]) {
        grouped[product.product_type] = [];
      }
      grouped[product.product_type].push(product);
    });
    return Object.entries(grouped).map(([type, products]) => ({
      type,
      representative: products[0],
      count: products.length,
    }));
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColor = DROP_STATUS_COLORS[drop?.status] || '#6B7280';
  const productGroups = getGroupedProducts();
  const canCancel = drop?.status === 'ACTIVE' || drop?.status === 'EXPIRED';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drop Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(true); }} tintColor="#FF0080" />
        }
      >
        <View style={styles.dropHeader}>
          <View style={styles.dropHeaderRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {DROP_STATUS_LABELS[drop?.status] || drop?.status}
              </Text>
            </View>
            <Text style={styles.dropDate}>
              Created {new Date(drop?.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.dropMetaRow}>
            <View style={styles.dropMetaItem}>
              <Ionicons name="shirt-outline" size={16} color="#999" />
              <Text style={styles.dropMetaText}>
                {drop?.products?.length || 0} products
              </Text>
            </View>
            <View style={styles.dropMetaItem}>
              <Ionicons name="receipt-outline" size={16} color="#999" />
              <Text style={styles.dropMetaText}>
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {drop?.status === 'ACTIVE' && timeRemaining > 0 && (
            <Text style={styles.countdownText}>{formatCountdown(timeRemaining)}</Text>
          )}
          {drop?.status === 'ACTIVE' && timeRemaining === 0 && (
            <Text style={[styles.countdownText, { color: '#EF4444' }]}>Expired</Text>
          )}
          {drop?.expires_at && drop?.status !== 'ACTIVE' && (
            <Text style={[styles.dropDate, { marginTop: 8 }]}>
              Expired {new Date(drop.expires_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Products</Text>
        <View style={styles.productGrid}>
          {productGroups.map(({ type, representative, count }) => {
            const imageUri = representative.mockup_url || representative.image_url;
            const label = PRODUCT_TYPE_LABELS[type] || type;
            return (
              <View key={type} style={styles.productCard}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={48} color="#555" />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{label}</Text>
                  <Text style={styles.productPrice}>
                    From ${parseFloat(representative.retail_price || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Orders</Text>
        {orders.length === 0 ? (
          <Text style={styles.emptyOrders}>No orders yet for this drop</Text>
        ) : (
          orders.map((order) => {
            const orderStatusColor = ORDER_STATUS_COLORS[order.status] || '#666';
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('ArtistOrderDetailPage', { orderId: order.id })}
              >
                <View style={styles.orderCardRow}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderTotal}>${Number(order.total).toFixed(2)}</Text>
                </View>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
                <View style={[styles.orderStatusBadge, { backgroundColor: orderStatusColor }]}>
                  <Text style={styles.orderStatusText}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Drop</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistMerchDropDetailPage;
