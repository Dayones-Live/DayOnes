import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!loading && !user) {
      navigation.navigate('Login');
    }
  }, [user, loading, navigation]);

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}; 