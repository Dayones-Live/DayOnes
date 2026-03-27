import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './artistStyles/ArtistOnboardingPageStyles';

const ATTENDANCE_OPTIONS = [
  { key: '0-500', label: '0 - 500', description: 'Small venues, intimate shows' },
  { key: '500-1500', label: '500 - 1,500', description: 'Mid-size venues, growing audience' },
  { key: '1500-5000', label: '1,500 - 5,000', description: 'Large venues, established following' },
  { key: '5000+', label: '5,000+', description: 'Major venues, large-scale events' },
];

const MERCH_OPTIONS = [
  { key: 'low', label: 'Low', description: 'Rarely sell merch at shows' },
  { key: 'medium', label: 'Medium', description: 'Sell merch at most shows' },
  { key: 'high', label: 'High', description: 'Merch is a big part of my income' },
];

const PROJECTIONS = {
  '0-500': { fanMin: 25, fanMax: 125 },
  '500-1500': { fanMin: 50, fanMax: 300 },
  '1500-5000': { fanMin: 120, fanMax: 750 },
  '5000+': { fanMin: 250, fanMax: 500 },
};

const REVENUE_PER_FAN = {
  low: { min: 2, max: 5 },
  medium: { min: 5, max: 15 },
  high: { min: 15, max: 30 },
};

const ArtistOnboardingPage = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [attendance, setAttendance] = useState(null);
  const [merchActivity, setMerchActivity] = useState(null);

  const getProjections = () => {
    if (!attendance || !merchActivity) return null;
    const fans = PROJECTIONS[attendance];
    const revenue = REVENUE_PER_FAN[merchActivity];
    return {
      fanMin: fans.fanMin,
      fanMax: fans.fanMax,
      revenueMin: fans.fanMin * revenue.min,
      revenueMax: fans.fanMax * revenue.max,
    };
  };

  const handleNext = () => {
    if (step === 1 && attendance) {
      setStep(2);
    } else if (step === 2 && merchActivity) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('artist_onboarding_complete', 'true');
    await AsyncStorage.setItem('artist_onboarding_attendance', attendance);
    await AsyncStorage.setItem('artist_onboarding_merch', merchActivity);
    navigation.goBack();
  };

  const projections = getProjections();

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {step > 1 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[styles.stepDot, step >= s && styles.stepDotActive]}
            />
          ))}
        </View>

        {step === 1 && (
          <>
            <Text style={styles.title}>Your Show Size</Text>
            <Text style={styles.subtitle}>
              How many people typically attend your shows?
            </Text>
            {ATTENDANCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionCard,
                  attendance === option.key && styles.optionCardSelected,
                ]}
                onPress={() => setAttendance(option.key)}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.nextButton, !attendance && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!attendance}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>Merch Activity</Text>
            <Text style={styles.subtitle}>
              How active are you with merch sales?
            </Text>
            {MERCH_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionCard,
                  merchActivity === option.key && styles.optionCardSelected,
                ]}
                onPress={() => setMerchActivity(option.key)}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.nextButton, !merchActivity && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!merchActivity}
            >
              <Text style={styles.nextButtonText}>See My Potential</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && projections && (
          <>
            <View style={styles.projectionContainer}>
              <View style={styles.projectionIcon}>
                <Ionicons name="trending-up" size={36} color="#FF0080" />
              </View>
              <Text style={styles.title}>Your Potential</Text>
              <Text style={styles.subtitle}>
                Based on artists with similar show sizes
              </Text>

              <View style={styles.projectionCard}>
                <Text style={styles.projectionLabel}>Fans Captured Per Show</Text>
                <Text style={styles.projectionValue}>
                  {formatNumber(projections.fanMin)} - {formatNumber(projections.fanMax)}
                </Text>
              </View>

              <View style={styles.projectionCard}>
                <Text style={styles.projectionLabel}>Revenue Potential Per Show</Text>
                <Text style={[styles.projectionValue, styles.projectionValueGreen]}>
                  ${formatNumber(projections.revenueMin)} - ${formatNumber(projections.revenueMax)}
                </Text>
              </View>

              <Text style={styles.projectionNote}>
                These are estimates based on similar artists. Your results may vary.
              </Text>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleGetStarted}>
              <Text style={styles.nextButtonText}>Get Started</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistOnboardingPage;
