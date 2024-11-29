import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const ProfilePictureButton = () => {
  const navigation = useNavigation();

  const profile = useSelector(state => state.userProfile?.data) || {
    avatar_url: null,
    fullName: 'First Last',
    email: 'FirstLast@gmail.com',
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
        <Image
          source={profile.avatar_url ? { uri: profile.avatar_url } : require('../images/defaultProfileImage.png')}
          style={styles.profilePicture}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '6%',
    marginBottom:"5%",
    left: 20,
    zIndex: 1,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
});

export default ProfilePictureButton;
