import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import ArtistPostsPage from '../screens/artist/ArtistPostsPage';
import NotificationsScreen from '../screens/NotificationsScreen';
import DMsScreen from '../screens/DMsScreen';
import HHomePage from '../screens/artist/HHomePage';
import ArtistMerchDashboardPage from '../screens/artist/ArtistMerchDashboardPage';
import { View, Text, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import useNotifications from '../assets/hooks/useNotifications';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const Tab = createBottomTabNavigator();

const ArtistTabNavigator = () => {
  const { data: notificationsData } = useNotifications();
  const userProfile = useSelector((state) => state.userProfile);
  const unreadCount = notificationsData?.data?.data?.filter(n => 
    !n.is_read && 
    n.from_user_profile?.id !== userProfile?.data?.id
  )?.length || 0;

  return (
    <Tab.Navigator
      initialRouteName="Main"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Posts':
              iconName = 'file-text-o';
              break;
            case 'Dashboard':
              iconName = 'line-chart';
              break;
            case 'Notifications':
              return (
                <View>
                  <Icon name="bell-o" size={size} color={color} />
                  {unreadCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      right: -6,
                      top: -3,
                      backgroundColor: '#FF0080',
                      borderRadius: wp('2%'),
                      minWidth: wp('4%'),
                      height: wp('4%'),
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: wp('2.5%'),
                        fontWeight: 'bold',
                      }}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
              );
            case "DM's":
              iconName = 'envelope-o';
              break;
            default:
              iconName = 'home';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          borderTopWidth: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 90 : 70,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          color: '#FFFFFF',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Main" 
        component={HHomePage}
        options={{
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Tab.Screen name="Posts" component={ArtistPostsPage} />
      <Tab.Screen name="Dashboard" component={ArtistMerchDashboardPage} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="DM's" component={DMsScreen} />
    </Tab.Navigator>
  );
};

export default ArtistTabNavigator;
