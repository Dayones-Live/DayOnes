import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStripe } from '@stripe/stripe-react-native';
import { useNavigation } from '@react-navigation/native';
import { createMerchOrder } from '../../services/merch.service';
import styles from './fanStyles/MerchCheckoutPageStyles';

const MerchCheckoutPage = ({ route }) => {
  const { dropId, product, quantity } = route.params;
  const navigation = useNavigation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [address, setAddress] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state_code: '',
    country_code: 'US',
    zip: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState('');

  const subtotal = (product.retail_price * quantity).toFixed(2);
  const isFreeShipping = parseFloat(subtotal) >= 95;

  const updateAddress = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = () => {
    const required = ['name', 'address1', 'city', 'state_code', 'country_code', 'zip'];
    for (const field of required) {
      if (!address[field] || !address[field].trim()) {
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) {
      setError('Please fill in all required address fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const orderData = {
        merchDropId: dropId,
        items: [{ merchProductId: product.id, quantity }],
        shippingAddress: address,
      };

      const result = await createMerchOrder(orderData);
      const clientSecret = result.clientSecret;

      if (!clientSecret) {
        throw new Error('Payment setup failed. Please try again.');
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'DayOnes',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          setLoading(false);
          return;
        }
        throw new Error(paymentError.message);
      }

      setOrderResult(result);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color="#ffffff" />
          </View>
          <Text style={styles.successText}>Order Placed!</Text>
          <Text style={styles.orderNumberText}>
            Order #{orderResult?.orderNumber}
          </Text>
          <TouchableOpacity
            style={styles.viewOrdersButton}
            onPress={() => navigation.navigate('My Collections')}
          >
            <Text style={styles.viewOrdersText}>View Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        <Text style={styles.sectionTitle}>Shipping Address</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={address.name}
          onChangeText={(v) => updateAddress('name', v)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Street Address"
          placeholderTextColor="#666"
          value={address.address1}
          onChangeText={(v) => updateAddress('address1', v)}
        />

        <TextInput
          style={styles.input}
          placeholder="Apt / Suite (optional)"
          placeholderTextColor="#666"
          value={address.address2}
          onChangeText={(v) => updateAddress('address2', v)}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.halfInput}
            placeholder="City"
            placeholderTextColor="#666"
            value={address.city}
            onChangeText={(v) => updateAddress('city', v)}
          />
          <TextInput
            style={styles.halfInput}
            placeholder="State"
            placeholderTextColor="#666"
            value={address.state_code}
            onChangeText={(v) => updateAddress('state_code', v.toUpperCase())}
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.halfInput}
            placeholder="Country"
            placeholderTextColor="#666"
            value={address.country_code}
            onChangeText={(v) => updateAddress('country_code', v.toUpperCase())}
            maxLength={2}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.halfInput}
            placeholder="ZIP Code"
            placeholderTextColor="#666"
            value={address.zip}
            onChangeText={(v) => updateAddress('zip', v)}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.sectionTitle}>Order Summary</Text>

        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Product</Text>
            <Text style={styles.summaryValue}>{product.product_type}</Text>
          </View>

          {product.size && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Size</Text>
              <Text style={styles.summaryValue}>{product.size}</Text>
            </View>
          )}

          {product.color && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Color</Text>
              <Text style={styles.summaryValue}>{product.color}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity</Text>
            <Text style={styles.summaryValue}>{quantity}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            {isFreeShipping ? (
              <View style={styles.freeShippingBadge}>
                <Text style={styles.freeShippingText}>FREE</Text>
              </View>
            ) : (
              <Text style={styles.summaryValue}>Calculated at checkout</Text>
            )}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal}</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            loading && styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchCheckoutPage;
