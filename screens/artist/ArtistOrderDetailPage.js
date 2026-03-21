import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getOrder } from '../../services/merch.service';
import styles from './artistStyles/ArtistOrderDetailPageStyles';

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

const PRODUCT_TYPE_LABELS = {
  HOODIE: 'Hoodie',
  TSHIRT: 'T-Shirt',
  TANK: 'Tank Top',
  POSTER: 'Poster',
};

const ArtistOrderDetailPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [orderId])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0080" />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Order not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrder()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || '#666';
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  const ledger = order.ledgerEntries?.find(
    (e) => e.status !== 'REVERSED' && Number(e.artist_share) > 0
  );

  const address = order.shipping_address;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrder(true); }}
            tintColor="#FF0080"
          />
        }
      >
        <Text style={styles.orderNumberText}>#{order.order_number}</Text>
        <Text style={styles.dateText}>
          {new Date(order.created_at).toLocaleDateString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item, index) => {
            const product = item.merchProduct || item.product;
            const imageUri = product?.mockup_url || product?.image_url;
            const typeName = PRODUCT_TYPE_LABELS[product?.product_type] || product?.product_type;
            return (
              <View key={item.id || index} style={styles.itemCard}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={24} color="#555" />
                  </View>
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{typeName}</Text>
                  <Text style={styles.itemVariant}>
                    {item.size || '-'} / {item.color || '-'} x{item.quantity || 1}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${Number(item.unit_price || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={{ backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16 }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${Number(order.subtotal || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {Number(order.shipping_cost || 0) === 0 ? 'Free' : `$${Number(order.shipping_cost || 0).toFixed(2)}`}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Charged</Text>
              <Text style={styles.totalValue}>${Number(order.total || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Earnings</Text>
          {ledger ? (
            <View style={styles.financialCard}>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Gross Revenue</Text>
                <Text style={styles.financialValue}>
                  ${Number(ledger.gross_revenue || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Stripe Fee</Text>
                <Text style={[styles.financialValue, styles.financialDeduction]}>
                  -${Number(ledger.stripe_fee || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Fulfillment Cost</Text>
                <Text style={[styles.financialValue, styles.financialDeduction]}>
                  -${Number(ledger.printful_cost || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Net Profit</Text>
                <Text style={styles.netValue}>
                  ${Number(ledger.net_profit || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Your Share (70%)</Text>
                <Text style={styles.earningsValue}>
                  ${Number(ledger.artist_share || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.pendingLedger}>
              Earnings will be calculated after the order ships
            </Text>
          )}
        </View>

        {(order.tracking_number || order.tracking_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking</Text>
            <View style={styles.trackingSection}>
              {order.tracking_number && (
                <>
                  <Text style={styles.trackingLabel}>Tracking Number</Text>
                  <Text style={styles.trackingNumber}>{order.tracking_number}</Text>
                </>
              )}
              {order.tracking_url && (
                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={() => Linking.openURL(order.tracking_url).catch(() => Alert.alert('Error', 'Could not open tracking URL'))}
                >
                  <Text style={styles.trackButtonText}>Track Package</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <View style={styles.shippingCard}>
              <Text style={styles.shippingText}>
                {address.name || ''}{'\n'}
                {address.address1 || ''}
                {address.address2 ? `\n${address.address2}` : ''}{'\n'}
                {address.city || ''}, {address.state_code || ''} {address.zip || ''}{'\n'}
                {address.country_code || ''}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistOrderDetailPage;
