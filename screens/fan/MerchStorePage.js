import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getMerchDrop } from '../../services/merch.service';
import styles from './fanStyles/MerchStorePageStyles';

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
  return `${hours}h ${minutes}m ${seconds}s`;
};

const MerchStorePage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { dropId } = route.params;

  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const intervalRef = useRef(null);

  const isExpired = useCallback(() => {
    if (!drop) return false;
    if (drop.status !== 'ACTIVE') return true;
    if (!drop.expires_at) return false;
    return Date.now() > new Date(drop.expires_at).getTime();
  }, [drop]);

  const fetchDrop = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMerchDrop(dropId);
      setDrop(data);
    } catch (err) {
      setError(err.message || 'Failed to load merch drop');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrop();
  }, [dropId]);

  useEffect(() => {
    if (!drop?.expires_at) return;

    const updateCountdown = () => {
      const remaining = new Date(drop.expires_at).getTime() - Date.now();
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [drop]);

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
      products,
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchDrop}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const productGroups = getGroupedProducts();
  const expired = isExpired();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{drop?.name || 'Merch Drop'}</Text>
      </View>

      {drop?.expires_at && timeRemaining !== null && !expired && (
        <View style={styles.countdownBar}>
          <Text style={styles.countdownText}>
            Ends in {formatCountdown(timeRemaining)}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {expired && (
          <View style={styles.expiredOverlay}>
            <Text style={styles.expiredText}>This merch drop has ended</Text>
          </View>
        )}
        <View style={styles.grid}>
          {productGroups.map(({ type, representative, products }) => {
            const imageUri = representative.mockup_url || representative.image_url;
            const label = PRODUCT_TYPE_LABELS[type] || type;
            const price = representative.retail_price;

            return (
              <TouchableOpacity
                key={type}
                style={[styles.productCard, expired && { opacity: 0.5 }]}
                activeOpacity={expired ? 1 : 0.7}
                onPress={() => {
                  if (expired) return;
                  navigation.navigate('MerchProductPage', {
                    dropId: drop.id,
                    productType: representative.product_type,
                    products,
                  });
                }}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={48} color="#555" />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{label}</Text>
                  <Text style={styles.productPrice}>
                    ${parseFloat(price || 0).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchStorePage;
