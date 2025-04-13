import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BlockedUsers from './screens/BlockedUsers';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

const App = () => {
  // ... existing state and effects ...

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer
          ref={navigationRef}
          initialState={initialState}
          onStateChange={(state) => {
            AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
          }}
          onReady={() => {
            global.navigationRef = navigationRef;
            console.log('Navigation is ready, ref set');
          }}
        >
          <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="TermsAndPrivacyScreen"
              component={TermsAndPrivacyScreen}
              options={{ headerShown: false }}
            />
            {/* ... other screens ... */}
            <Stack.Screen
              name="BlockedUsers"
              component={BlockedUsers}
              options={{ headerShown: false }}
            />
            {/* ... rest of the screens ... */}
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </Provider>
  );
};

export default App; 