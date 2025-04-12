import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Button,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TermsAndPrivacyScreen = () => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [viewing, setViewing] = useState('terms');
  const navigation = useNavigation();

  useEffect(() => {
    // Check if terms are already accepted
    const checkTermsAccepted = async () => {
      try {
        const termsAccepted = await AsyncStorage.getItem('tosAccepted');
        if (termsAccepted === 'true') {
          navigation.navigate('PermissionsScreen');
        }
      } catch (error) {
        console.error('Error checking terms acceptance:', error);
      }
    };
    checkTermsAccepted();
  }, [navigation]);

  const handleAccept = async () => {
    if (isAgreed) {
      try {
        // Store terms acceptance
        await AsyncStorage.setItem('tosAccepted', 'true');
        console.log('Terms accepted and stored successfully');
        
        // Clear any existing auth data
        await AsyncStorage.multiRemove([
          'authToken',
          'userRole',
          'userProfile'
        ]);
        
        navigation.navigate('PermissionsScreen');
      } catch (error) {
        console.error('Error saving acceptance status:', error.message);
        Alert.alert('Error', 'Failed to save terms acceptance. Please try again.');
      }
    } else {
      Alert.alert('Please agree to the Terms and Privacy Policy to continue.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>Terms of Service & Privacy Policy</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity onPress={() => setViewing('terms')}>
          <Text
            style={[
              styles.toggleText,
              viewing === 'terms' && styles.activeText,
            ]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewing('privacy')}>
          <Text
            style={[
              styles.toggleText,
              viewing === 'privacy' && styles.activeText,
            ]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.textContainer}
        contentContainerStyle={styles.scrollContent}>
        {viewing === 'terms' ? (
          <Text style={styles.policyText}>
            DayOnes Terms of Service Effective Date: 11/13/2024 Welcome to
            Dayones! These Terms of Service ("Terms") govern your use of Dayones
            and its related services (the "Platform"), including our website,
            mobile applications, and other products or services that link to
            these Terms. By accessing or using our Platform, you agree to comply
            with and be bound by these Terms. If you do not agree with these
            Terms, you must not use our Platform. 1. Acceptance of Terms By
            creating an account, accessing, or using Dayones, you agree to
            follow and be legally bound by these Terms. You also agree to our
            Privacy Policy and any additional terms, conditions, and guidelines
            provided within our Platform. 2. Eligibility You must be at least 17
            years old to use Dayones. If you are under the age of 18, you must
            have your parent or legal guardian's permission to use the Platform.
            3. User Accounts To access certain features, you must create an
            account. You agree to: Provide accurate and complete information
            when registering. Keep your account information up to date. Keep
            your password secure and confidential. Be responsible for all
            activities under your account. We reserve the right to suspend or
            terminate your account if any information is found to be false,
            misleading, or violating these Terms. 4. Content on Dayones 4.1
            User-Generated Content You are solely responsible for any content
            you post, upload, share, or otherwise make available on Dayones
            ("User Content"). This includes but is not limited to, text, images,
            videos, and comments. You agree that: You own the content you create
            or have all necessary rights to share it. Your content will not
            violate any applicable law, infringe on third-party rights, or be
            harmful, offensive, or inappropriate. 4.2 Content Ownership You
            retain all rights to your content. However, by posting content, you
            grant Dayones a worldwide, non-exclusive, royalty-free,
            sublicensable, and transferable license to use, reproduce,
            distribute, modify, display, and create derivative works of your
            content in connection with the operation, promotion, and improvement
            of the Platform. 5. Prohibited Activities You agree not to engage in
            any of the following prohibited activities: Harassing, abusing, or
            harming another person or group. Violating any law or regulation.
            Sharing misleading or fraudulent information. Infringing on
            intellectual property rights. Transmitting viruses or malicious
            code. Attempting to disrupt or interfere with the Platform. Dayones
            reserves the right to remove any content and terminate accounts that
            violate these prohibitions. 6. Intellectual Property All rights,
            title, and interest in and to the Platform, including but not
            limited to software, logos, designs, trademarks, and content, are
            the exclusive property of Dayones or its licensors. You may not
            copy, modify, distribute, sell, or lease any part of our Platform
            without written permission from Dayones. 7. Purchases and Payments
            If you purchase any products, services, or features through Dayones,
            you agree to pay the applicable fees and taxes. Payments are
            processed by third-party providers, and you agree to their terms and
            conditions. All purchases are final, non-refundable, and subject to
            our Return and Refund Policy. 8. Termination We may suspend or
            terminate your access to Dayones at any time, with or without cause,
            notice, or liability. You may also delete your account at any time.
            Upon termination, you will lose access to your account and all
            associated data. 9. Privacy Your privacy is important to us. Please
            review our Privacy Policy, which explains how we collect, use, and
            protect your information. 10. Third-Party Links and Services Our
            Platform may contain links to third-party websites, services, or
            features that are not owned or controlled by Dayones. We do not
            endorse or assume responsibility for any third-party content or
            practices. Your use of third-party services is at your own risk. 11.
            Disclaimer of Warranties The Platform is provided "AS IS" and "AS
            AVAILABLE" without warranties of any kind, either express or
            implied. Dayones does not warrant that the Platform will be
            uninterrupted, error-free, secure, or free from viruses. 12.
            Limitation of Liability To the fullest extent permitted by law,
            Dayones shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including lost profits or data,
            arising from your use of the Platform. 13. Indemnity You agree to
            defend, indemnify, and hold Dayones harmless from any claims,
            liabilities, damages, losses, and expenses, including legal fees,
            arising out of your use of the Platform or violation of these Terms.
            14. Modifications to Terms We reserve the right to modify or update
            these Terms at any time. Changes will be effective when posted on
            the Platform. Your continued use of the Platform after changes are
            posted constitutes your acceptance of the new Terms. 15. Governing
            Law and Dispute Resolution These Terms are governed by the laws of
            [Your Country/State], without regard to conflict of laws principles.
            Any disputes arising out of these Terms or your use of the Platform
            will be resolved through binding arbitration in [Your Jurisdiction]
            or a small claims court if applicable. 16. Miscellaneous If any
            provision of these Terms is found invalid or unenforceable, the
            remaining provisions will remain in effect. These Terms constitute
            the entire agreement between you and Dayones. Our failure to enforce
            any right or provision of these Terms will not be considered a
            waiver of those rights. 17. Contact Us If you have any questions
            about these Terms, please contact us at: Email:
            dayonesmedia@gmail.com Address: 28363 Openfield Loop, Wesley Chapel
            FL 33543 Thank you for using Dayones!
          </Text>
        ) : (
          <Text style={styles.policyText}>
            DayOnes Privacy Policy Effective Date: November 13, 2024 At DayOnes,
            we are committed to protecting your privacy. This Privacy Policy
            explains the types of information we collect, how we use it, and the
            steps we take to ensure your data is protected. For questions or
            concerns, please contact us at dayonesmedia@gmail.com or at our
            office address: 28363 Openfield Loop, Wesley Chapel, FL 33543. 1.
            Information We Collect Personal Information: We collect information
            such as your name, email address, phone number, and any other
            information you provide when you register for an account or interact
            with our services. Usage Data: We gather data on how you use our
            platform, including your IP address, device information, browsing
            behavior, and location. Cookies and Tracking Technologies: DayOnes
            uses cookies to improve your experience and track site usage. You
            can manage cookies through your browser settings. 2. How We Use Your
            Information Account and Service Management: To provide, manage, and
            improve your experience with DayOnes, including processing
            transactions and providing customer support. Marketing and
            Communications: With your consent, we may send promotional
            materials, updates, and exclusive offers related to DayOnes.
            Analytics and Improvements: We may use your data to understand usage
            patterns and improve our services. 3. How We Share Your Information
            Service Providers: We may share your data with third-party vendors
            to support our services, such as hosting providers or payment
            processors. Legal Compliance: We may disclose your data to comply
            with legal requirements or to protect our rights, safety, or
            property. Business Transfers: In the event of a merger or
            acquisition, your personal information may be transferred to the
            acquiring entity. 4. Data Security We employ industry-standard
            security measures, such as encryption, to protect your data.
            However, no method of data transmission over the internet is 100%
            secure. 5. Your Rights Access and Correction: You can request access
            to and correction of your personal information. Deletion: You may
            request to delete your account and data, subject to our retention
            policies or legal obligations. 6. Children's Privacy DayOnes does
            not knowingly collect personal information from children under the
            age of 13. If we discover we have collected such information, we
            will delete it promptly. 7. Changes to This Policy We may update
            this Privacy Policy from time to time. When significant changes are
            made, we will notify you, and the updated policy will be posted on
            our website.
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setIsAgreed(!isAgreed)}>
        <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]}>
          {isAgreed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text style={styles.checkboxText}>
          I agree to the Terms of Service and Privacy Policy
        </Text>
      </TouchableOpacity>

      <View style={styles.buttonWrapper}>
        <Button
          title="Agree and Continue"
          onPress={handleAccept}
          disabled={!isAgreed}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c0c0c0',
    marginBottom: 10,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  toggleText: {
    fontSize: 16,
    color: 'gray',
  },
  activeText: {
    color: '#c0c0c0',
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: '#1c1c1c',
    padding: 10,
    borderRadius: 5,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  policyText: {
    fontSize: 14,
    color: '#c0c0c0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#c0c0c0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: '#c0c0c0',
  },
  checkboxText: {
    fontSize: 16,
    color: '#c0c0c0',
  },
  buttonWrapper: {
    marginBottom: 20,
  },
});

export default TermsAndPrivacyScreen;
