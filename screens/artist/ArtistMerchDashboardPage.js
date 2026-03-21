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
import {
  getPayoutBalance,
  getStripeConnectStatus,
  getFanOrders,
} from '../../services/merch.service';
import styles from './artistStyles/ArtistMerchDashboardPageStyles';

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

const ArtistMerchDashboardPage = () => {
  const navigation = useNavigation();

  const [balance, setBalance] = useState(null);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const [balanceData, statusData, ordersData] = await Promise.allSettled([
        getPayoutBalance(),
        getStripeConnectStatus(),
        getFanOrders(),
      ]);

      if (balanceData.status === 'fulfilled') {
        setBalance(balanceData.value);
      }
      if (statusData.status === 'fulfilled') {
        setStripeStatus(statusData.value);
      }
      if (ordersData.status === 'fulfilled') {
        const orders = ordersData.value || [];
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  const formatItemsSummary = (items) => {
    if (!items || items.length === 0) return '';
    const first = items[0];
    const product = first.merchProduct || first.product;
    const typeName = product?.product_type || 'Item';
    if (items.length === 1) {
      return `${first.quantity}x ${typeName} (${first.size}, ${first.color})`;
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboardData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const stripeConnected = stripeStatus?.onboarding_complete && stripeStatus?.payouts_enabled;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Merch</Text>
        {stripeStatus && (
          <TouchableOpacity
            style={[
              styles.stripeIndicator,
              { backgroundColor: stripeConnected ? '#059669' : '#F59E0B' },
            ]}
            onPress={() => navigation.navigate('StripeOnboardingPage')}
          >
            <Ionicons
              name={stripeConnected ? 'checkmark-circle' : 'warning'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.stripeIndicatorText}>
              {stripeConnected ? 'Stripe Connected' : 'Setup Required'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0080" />
        }
      >
        {!stripeConnected && (
          <View style={styles.stripeBanner}>
            <Text style={styles.stripeBannerTitle}>Set Up Payouts</Text>
            <Text style={styles.stripeBannerText}>
              Connect your Stripe account to receive earnings from merch sales.
            </Text>
            <TouchableOpacity
              style={styles.stripeBannerButton}
              onPress={() => navigation.navigate('StripeOnboardingPage')}
            >
              <Text style={styles.stripeBannerButtonText}>Connect with Stripe</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Unpaid Balance</Text>
          <Text style={styles.balanceAmount}>
            ${balance?.balance != null ? Number(balance.balance).toFixed(2) : '0.00'}
          </Text>
          {balance?.orderCount > 0 && (
            <Text style={styles.balanceOrderCount}>
              {balance.orderCount} order{balance.orderCount !== 1 ? 's' : ''} pending payout
            </Text>
          )}
          <Text style={styles.balanceNote}>Payouts process on the 1st and 15th</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('ArtistMerchDropsPage')}
          >
            <Ionicons name="layers-outline" size={24} color="#FF0080" style={styles.quickActionIcon} />
            <Text style={styles.quickActionText}>Drops</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('ArtistOrdersPage')}
          >
            <Ionicons name="receipt-outline" size={24} color="#FF0080" style={styles.quickActionIcon} />
            <Text style={styles.quickActionText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('ArtistPayoutsPage')}
          >
            <Ionicons name="cash-outline" size={24} color="#FF0080" style={styles.quickActionIcon} />
            <Text style={styles.quickActionText}>Earnings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {recentOrders.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('ArtistOrdersPage')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders yet</Text>
        ) : (
          recentOrders.map((order) => {
            const statusColor = STATUS_COLORS[order.status] || '#666';
            const statusLabel = STATUS_LABELS[order.status] || order.status;
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

export default ArtistMerchDashboardPage;
