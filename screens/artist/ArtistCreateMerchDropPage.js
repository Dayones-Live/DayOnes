import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  createMerchDrop,
  getMerchDrop,
  getStripeConnectStatus,
} from '../../services/merch.service';
import styles from './artistStyles/ArtistCreateMerchDropPageStyles';

const ArtistCreateMerchDropPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, postImage } = route.params;

  const [stripeStatus, setStripeStatus] = useState(null);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdDropId, setCreatedDropId] = useState(null);
  const [dropReady, setDropReady] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    checkStripe();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const checkStripe = async () => {
    try {
      setCheckingStripe(true);
      const status = await getStripeConnectStatus();
      setStripeStatus(status);
    } catch (err) {
      setStripeStatus(null);
    } finally {
      setCheckingStripe(false);
    }
  };

  const stripeConnected =
    stripeStatus?.onboarding_complete && stripeStatus?.payouts_enabled;

  const handleCreate = () => {
    Alert.alert(
      'Create Merch Drop',
      'This will create merch products from your post image. The drop will be live for 48 hours. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              setCreating(true);
              const dropData = await createMerchDrop(postId);
              setCreatedDropId(dropData.id);
              pollForCompletion(dropData.id);
            } catch (err) {
              setCreating(false);
              const message =
                err?.response?.data?.message || 'Failed to create merch drop';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const pollForCompletion = (dropId) => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await getMerchDrop(dropId);
        if (data.status === 'ACTIVE') {
          clearInterval(pollRef.current);
          setDropReady(true);
          setCreating(false);
          setTimeout(() => {
            navigation.replace('ArtistMerchDropDetailPage', { dropId });
          }, 1500);
        }
      } catch (err) {
        // keep polling
      }
    }, 3000);
  };

  if (checkingStripe) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0080" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={creating}
        >
          <Ionicons name="arrow-back" size={24} color={creating ? '#333' : 'white'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Merch Drop</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.postImageContainer}>
          {postImage ? (
            <Image source={{ uri: postImage }} style={styles.postImage} resizeMode="cover" />
          ) : (
            <View style={styles.postImagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#555" />
            </View>
          )}
        </View>

        {creating || createdDropId ? (
          <View style={styles.creatingContainer}>
            <ActivityIndicator size="large" color="#FF0080" />
            <Text style={styles.creatingText}>
              {dropReady ? 'Merch Drop Created!' : 'Creating your merch products...'}
            </Text>
            <Text style={styles.creatingSubtext}>
              {dropReady
                ? 'Redirecting to your drop...'
                : 'This may take a moment. Your image is being placed on all product types.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Products Created</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hoodie</Text>
                <Text style={styles.infoValue}>$80 - $85</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>T-Shirt</Text>
                <Text style={styles.infoValue}>$40 - $45</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tank Top</Text>
                <Text style={styles.infoValue}>$35 - $40</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Poster (18x24)</Text>
                <Text style={styles.infoValue}>$35</Text>
              </View>
            </View>

            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                Your image will be placed on the upper chest area of apparel and as a full bleed on
                the poster. The drop will be live for 48 hours. You earn 70% of net profit on every
                sale.
              </Text>
            </View>

            {!stripeConnected && (
              <View style={styles.stripeWarning}>
                <Ionicons name="warning" size={28} color="#EF4444" />
                <Text style={styles.stripeWarningText}>
                  You need to connect your Stripe account before creating a merch drop.
                </Text>
                <TouchableOpacity
                  style={styles.stripeWarningButton}
                  onPress={() => navigation.navigate('StripeOnboardingPage')}
                >
                  <Text style={styles.stripeWarningButtonText}>Set Up Stripe</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.createButton, !stripeConnected && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={!stripeConnected}
            >
              <Text style={styles.createButtonText}>Create Merch Drop</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistCreateMerchDropPage;
