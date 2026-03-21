import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getFanOrders } from '../../services/merch.service';
import styles from './artistStyles/ArtistOrdersPageStyles';

const STATUS_COLORS = {
  PENDING: '#666',
  PAID: '#3B82F6',
  PRODUCTION: '#8B5CF6',
  SHIPPED: '#10B981',
  DELIVERED: '#059669',
  REFUNDED: '#EF4444',
  CANCELLED: '#EF4444',
  RETURN_REQUESTED: '#F97316',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PRODUCTION: 'In Production',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested',
};

const FILTER_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PRODUCTION', label: 'Production' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'RETURNS', label: 'Returns' },
];

const ArtistOrdersPage = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await getFanOrders();
      setOrders(data || []);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const getFilteredOrders = () => {
    if (activeFilter === 'ALL') return orders;
    if (activeFilter === 'RETURNS') {
      return orders.filter(
        (o) => o.status === 'RETURN_REQUESTED' || o.status === 'REFUNDED'
      );
    }
    return orders.filter((o) => o.status === activeFilter);
  };

  const formatItemsSummary = (items) => {
    if (!items || items.length === 0) return '';
    const first = items[0];
    const product = first.merchProduct || first.product;
    const typeName = product?.product_type || 'Item';
    if (items.length === 1) {
      return `${first.quantity || 1}x ${typeName} (${first.size || '-'}, ${first.color || '-'})`;
    }
    return `${items.length} items`;
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(true); }}
            tintColor="#FF0080"
          />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>
              {activeFilter === 'ALL' ? 'No orders yet' : 'No matching orders'}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusColor = STATUS_COLORS[order.status] || '#666';
            const statusLabel = STATUS_LABELS[order.status] || order.status;
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() =>
                  navigation.navigate('ArtistOrderDetailPage', { orderId: order.id })
                }
              >
                <View style={styles.orderCardRow}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderTotal}>${Number(order.total || 0).toFixed(2)}</Text>
                </View>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.orderItems}>{formatItemsSummary(order.items)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistOrdersPage;
