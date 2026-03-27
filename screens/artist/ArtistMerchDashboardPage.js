import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { getDashboardStats } from '../../services/merch.service';
import styles from './artistStyles/ArtistMerchDashboardPageStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ArtistMerchDashboardPage = () => {
  const navigation = useNavigation();
  const userProfile = useSelector((state) => state.userProfile?.data);
  const userId = userProfile?.id || 'default';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const checkOnboarding = async () => {
    try {
      const done = await AsyncStorage.getItem(`artist_onboarding_complete_${userId}`);
      if (!done) {
        navigation.navigate('ArtistOnboardingPage');
      }
    } catch (err) {
      // skip onboarding check on error
    }
    setOnboardingChecked(true);
  };

  useEffect(() => {
    checkOnboarding();
  }, []);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (onboardingChecked) fetchStats();
    }, [onboardingChecked])
  );

  if (loading || !onboardingChecked) {
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchStats()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const events = stats?.events || [];
  const eventsWithFans = events.filter((e) => e.fansCaptured > 0);

  const chartEvents = eventsWithFans.length > 6
    ? eventsWithFans.slice(-6)
    : eventsWithFans;

  const chartData = {
    labels: chartEvents.length > 0
      ? chartEvents.map((e) => {
          const d = new Date(e.date || Date.now());
          return `${d.getMonth() + 1}/${d.getDate()}`;
        })
      : [''],
    datasets: [{
      data: chartEvents.length > 0
        ? chartEvents.map((e) => e.fansCaptured || 0)
        : [0],
      strokeWidth: 2,
    }],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStats(true); }}
            tintColor="#FF0080"
          />
        }
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={[styles.statValue, styles.statValueGreen]}>
              ${(stats?.totalRevenue || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fans Captured</Text>
            <Text style={[styles.statValue, styles.statValuePink]}>
              {stats?.totalFans || 0}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Events</Text>
            <Text style={styles.statValue}>
              {stats?.totalEvents || 0}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Conversion</Text>
            <Text style={styles.statValue}>
              {stats?.avgConversionRate || 0}%
            </Text>
          </View>
        </View>

        {chartEvents.length > 1 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Fans Captured Over Time</Text>
            <LineChart
              data={chartData}
              width={SCREEN_WIDTH - 64}
              height={180}
              withDots={true}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              chartConfig={{
                backgroundColor: '#1A1A1A',
                backgroundGradientFrom: '#1A1A1A',
                backgroundGradientTo: '#1A1A1A',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 0, 128, ${opacity})`,
                labelColor: () => '#666',
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#FF0080',
                },
                propsForLabels: {
                  fontSize: 10,
                },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Events</Text>
        </View>

        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubtext}>
              Create a post to start capturing fans at your shows
            </Text>
          </View>
        ) : (
          events.slice().reverse().map((event) => (
            <View key={event.postId} style={styles.eventCard}>
              <View style={styles.eventImageContainer}>
                {event.imageUrl ? (
                  <Image
                    source={{ uri: event.imageUrl }}
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="musical-notes" size={24} color="#555" />
                )}
              </View>
              <View style={styles.eventInfo}>
                <View style={styles.eventInfoTop}>
                  <Text style={styles.eventDate}>
                    {new Date(event.date || Date.now()).toLocaleDateString()}
                  </Text>
                  {(event.revenue || 0) > 0 && (
                    <Text style={styles.eventRevenue}>
                      ${(event.revenue || 0).toFixed(2)}
                    </Text>
                  )}
                </View>
                {event.locale && (
                  <Text style={styles.eventLocation}>{event.locale}</Text>
                )}
                <View style={styles.eventMetaRow}>
                  <Text style={styles.eventMeta}>
                    Fans: <Text style={styles.eventMetaValue}>{event.fansCaptured}</Text>
                  </Text>
                  {event.fansInvited > 0 && (
                    <Text style={styles.eventMeta}>
                      Conv: <Text style={styles.eventMetaValue}>{event.conversionRate}%</Text>
                    </Text>
                  )}
                  {event.orderCount > 0 && (
                    <Text style={styles.eventMeta}>
                      Orders: <Text style={styles.eventMetaValue}>{event.orderCount}</Text>
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistMerchDashboardPage;
