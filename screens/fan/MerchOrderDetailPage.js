import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrder, requestReturn } from '../../services/merch.service';
import styles from './fanStyles/MerchOrderDetailPageStyles';

const PRODUCT_TYPE_LABELS = {
  HOODIE: 'Hoodie',
  TSHIRT: 'T-Shirt',
  TANK: 'Tank Top',
  POSTER: 'Poster',
};

const STATUS_COLORS = {
  PENDING: '#666',
  PAID: '#666',
  PRODUCTION: '#2196F3',
  SHIPPED: '#4CAF50',
  DELIVERED: '#4CAF50',
  REFUNDED: '#F44336',
  CANCELLED: '#F44336',
  RETURN_REQUESTED: '#FF9800',
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

const MerchOrderDetailPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleRequestReturn = () => {
    Alert.alert(
      'Request Return',
      'Are you sure you want to request a return for this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Return',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestReturn(orderId);
              fetchOrder();
            } catch (err) {
              Alert.alert('Error', 'Failed to request return.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0080" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Order not found</Text>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || '#666';
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            const imageUri = item.product?.mockup_url || item.product?.image_url;
            const label = PRODUCT_TYPE_LABELS[item.product_type] || item.product_type;

            return (
              <View key={index} style={styles.itemCard}>
                {imageUri && (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{label}</Text>
                  {(item.size || item.color) && (
                    <Text style={styles.itemVariant}>
                      {[item.size, item.color].filter(Boolean).join(' / ')}
                    </Text>
                  )}
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  <Text style={styles.itemPrice}>
                    ${parseFloat(item.price).toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ${parseFloat(order.subtotal).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              ${parseFloat(order.shipping_cost).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${parseFloat(order.total).toFixed(2)}
            </Text>
          </View>
        </View>

        {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && order.tracking_number && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking</Text>
            <View style={styles.trackingSection}>
              <Text style={styles.trackingLabel}>Tracking Number</Text>
              <Text style={styles.trackingNumber}>{order.tracking_number}</Text>
              {order.tracking_url && (
                <TouchableOpacity
                  style={styles.trackPackageButton}
                  onPress={() => Linking.openURL(order.tracking_url)}
                >
                  <Text style={styles.trackPackageText}>Track Package</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
          <TouchableOpacity style={styles.returnButton} onPress={handleRequestReturn}>
            <Text style={styles.returnButtonText}>Request Return</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchOrderDetailPage;
