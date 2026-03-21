import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  AppState,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getStripeConnectStatus, startStripeOnboarding } from '../../services/merch.service';
import styles from './artistStyles/StripeOnboardingPageStyles';

const StripeOnboardingPage = () => {
  const navigation = useNavigation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const data = await getStripeConnectStatus();
      setStatus(data);
    } catch (err) {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatus();

      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          fetchStatus();
        }
      });

      return () => subscription.remove();
    }, [])
  );

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const data = await startStripeOnboarding();
      if (data?.url) {
        await Linking.openURL(data.url);
      } else {
        Alert.alert('Error', 'Could not get onboarding URL. Please try again.');
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to start onboarding';
      Alert.alert('Error', message);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0080" />
      </SafeAreaView>
    );
  }

  const isConnected = status?.onboarding_complete && status?.payouts_enabled;
  const isPending = status?.connected && !isConnected;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stripe Setup</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isConnected ? (
          <View style={styles.connectedContainer}>
            <View style={styles.connectedIconContainer}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            </View>
            <Text style={styles.connectedTitle}>Stripe Connected</Text>
            <Text style={styles.connectedSubtext}>
              Your account is set up and ready to receive payouts from merch sales.
            </Text>

            <View style={styles.statusCard}>
              <View style={[styles.statusRow, styles.statusRowBorder]}>
                <Text style={styles.statusLabel}>Onboarding</Text>
                <View style={styles.statusValueRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.statusValue}>Complete</Text>
                </View>
              </View>
              <View style={[styles.statusRow, styles.statusRowBorder]}>
                <Text style={styles.statusLabel}>Payouts</Text>
                <View style={styles.statusValueRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.statusValue}>Enabled</Text>
                </View>
              </View>
              {status?.stripe_account_id && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Account ID</Text>
                  <Text style={[styles.statusValue, { color: '#666' }]}>
                    {status.stripe_account_id}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : isPending ? (
          <View style={styles.pendingContainer}>
            <View style={styles.pendingIconContainer}>
              <Ionicons name="time" size={40} color="#F59E0B" />
            </View>
            <Text style={styles.pendingTitle}>Setup Incomplete</Text>
            <Text style={styles.pendingSubtext}>
              Your Stripe account has been created but onboarding is not complete. Please finish the setup to start receiving payouts.
            </Text>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.completeButtonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.notConnectedContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="card-outline" size={40} color="#FF0080" />
            </View>
            <Text style={styles.title}>Connect with Stripe</Text>
            <Text style={styles.subtitle}>
              Set up your Stripe account to receive payouts from your merch sales. Stripe handles all payments securely.
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Ionicons name="cash-outline" size={22} color="#10B981" />
                <Text style={styles.benefitText}>Earn 70% of net profit on every sale</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="calendar-outline" size={22} color="#10B981" />
                <Text style={styles.benefitText}>Automatic payouts on the 1st and 15th</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" />
                <Text style={styles.benefitText}>Secure payments powered by Stripe</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="analytics-outline" size={22} color="#10B981" />
                <Text style={styles.benefitText}>Track earnings and payout history</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.connectButtonText}>Connect with Stripe</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StripeOnboardingPage;
