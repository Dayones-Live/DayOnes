import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ArtistTabNavigator from './ArtistTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import EditScreen from '../screens/artist/EditScreen';
import PostDetailPage from '../screens/artist/PostDetailsPage';
import SignaturePage from '../screens/artist/SignaturePage';
import ArtistSignatures from '../screens/artist/ArtistSignatures';
import BlockedUsers from '../screens/BlockedUsers';
import ArtistMerchDropsPage from '../screens/artist/ArtistMerchDropsPage';
import ArtistMerchDropDetailPage from '../screens/artist/ArtistMerchDropDetailPage';
import ArtistCreateMerchDropPage from '../screens/artist/ArtistCreateMerchDropPage';
import ArtistOrdersPage from '../screens/artist/ArtistOrdersPage';
import ArtistOrderDetailPage from '../screens/artist/ArtistOrderDetailPage';
import ArtistPayoutsPage from '../screens/artist/ArtistPayoutsPage';
import StripeOnboardingPage from '../screens/artist/StripeOnboardingPage';
import ArtistOnboardingPage from '../screens/artist/ArtistOnboardingPage';

const Stack = createStackNavigator();

const ArtistStack = () => {
  return (
    <Stack.Navigator initialRouteName="MainTabs">
      <Stack.Screen
        name="MainTabs"
        component={ArtistTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditScreen"
        component={EditScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostDetailPage"
        component={PostDetailPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignaturePage"
        component={SignaturePage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArtistSignatures"
        component={ArtistSignatures}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsers}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArtistMerchDropsPage"
        component={ArtistMerchDropsPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArtistMerchDropDetailPage"
        component={ArtistMerchDropDetailPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArtistCreateMerchDropPage"
        component={ArtistCreateMerchDropPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArtistOrdersPage"
        component={ArtistOrdersPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArtistOrderDetailPage"
        component={ArtistOrderDetailPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArtistPayoutsPage"
        component={ArtistPayoutsPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StripeOnboardingPage"
        component={StripeOnboardingPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArtistOnboardingPage"
        component={ArtistOnboardingPage}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ArtistStack;
