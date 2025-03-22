import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import ArtistPostsPage from '../screens/artist/ArtistPostsPage';
import NotificationsScreen from '../screens/NotificationsScreen';
import DMsScreen from '../screens/DMsScreen';
import HHomePage from '../screens/artist/HHomePage'; // Import the home page
import { View, Text } from 'react-native';
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
        tabBarActiveTintColor: '#FF0080',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Main" component={HHomePage} />
      <Tab.Screen name="Posts" component={ArtistPostsPage} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="DM's" component={DMsScreen} />
    </Tab.Navigator>
  );
};

export default ArtistTabNavigator;
