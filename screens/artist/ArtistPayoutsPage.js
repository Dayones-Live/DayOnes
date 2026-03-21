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
import { getPayoutBalance, getPayoutHistory } from '../../services/merch.service';
import styles from './artistStyles/ArtistPayoutsPageStyles';

const PAYOUT_STATUS_COLORS = {
  PENDING: '#6B7280',
  PROCESSING: '#F59E0B',
  COMPLETED: '#10B981',
  FAILED: '#EF4444',
};

const PAYOUT_STATUS_LABELS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const ArtistPayoutsPage = () => {
  const navigation = useNavigation();
  const [balance, setBalance] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const [balanceData, payoutData] = await Promise.allSettled([
        getPayoutBalance(),
        getPayoutHistory(),
      ]);
      if (balanceData.status === 'fulfilled') setBalance(balanceData.value);
      if (payoutData.status === 'fulfilled') setPayouts(payoutData.value || []);
    } catch (err) {
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

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

  const totalEarned = payouts
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(true); }}
            tintColor="#FF0080"
          />
        }
      >
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
        </View>

        <View style={styles.scheduleNote}>
          <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
          <Text style={styles.scheduleNoteText}>
            Payouts are processed automatically on the 1st and 15th of each month
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Payout History</Text>

        {payouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No payouts yet</Text>
            <Text style={styles.emptySubtext}>
              Your first payout will be processed after orders are shipped and the next payout date arrives
            </Text>
          </View>
        ) : (
          <>
            {totalEarned > 0 && (
              <View style={[styles.balanceCard, { marginBottom: 16, paddingVertical: 14 }]}>
                <Text style={styles.balanceLabel}>Total Earned</Text>
                <Text style={[styles.balanceAmount, { fontSize: 24, color: '#10B981' }]}>
                  ${totalEarned.toFixed(2)}
                </Text>
              </View>
            )}
            {payouts.map((payout) => {
              const statusColor = PAYOUT_STATUS_COLORS[payout.status] || '#6B7280';
              const statusLabel = PAYOUT_STATUS_LABELS[payout.status] || payout.status;
              return (
                <View key={payout.id} style={styles.payoutCard}>
                  <View style={styles.payoutCardRow}>
                    <Text style={styles.payoutAmount}>
                      ${Number(payout.total_amount || 0).toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusText}>{statusLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.payoutDate}>
                    {new Date(payout.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.payoutMeta}>
                    {payout.order_count} order{payout.order_count !== 1 ? 's' : ''}
                    {payout.period_start && payout.period_end
                      ? ` \u00B7 ${new Date(payout.period_start).toLocaleDateString()} - ${new Date(payout.period_end).toLocaleDateString()}`
                      : ''}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistPayoutsPage;
