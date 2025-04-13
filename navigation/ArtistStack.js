import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ArtistTabNavigator from './ArtistTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import EditScreen from '../screens/artist/EditScreen';
import PostDetailPage from '../screens/artist/PostDetailsPage';
import SignaturePage from '../screens/artist/SignaturePage';
import ArtistSignatures from '../screens/artist/ArtistSignatures';
import BlockedUsers from '../screens/BlockedUsers';

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
    </Stack.Navigator>
  );
};

export default ArtistStack;
