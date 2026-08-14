import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from '../utils/SecureStoreProxy';
import { AuthApi } from '@nermai/api';
import { useAuth } from '../core/auth/AuthProvider';
import { ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { AnimatedSlideUp } from '../core/animations';
import { ScreenContainer, Button, TextField, Card } from '../components/ui';
import { colors, typography, spacing, radius } from '@nermai/theme';

export const AdminLoginPage = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkAuth } = useAuth();

  const handleAdminLogin = async () => {
    if (!email || !password) {
      setError('Please enter both admin email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await AuthApi.login({
        identifier: email.trim(),
        password,
      });

      const token = response.data?.data?.token;
      if (token) {
        await SecureStore.setItemAsync('adminAccessToken', token);
        // Clear student token to prevent non-admin routes (like /students) from using an expired student token
        // and triggering a global logout while in the admin portal.
        await SecureStore.deleteItemAsync('studentAccessToken');
        await checkAuth(); // Assuming checkAuth can differentiate or we reload
      } else {
        setError('Invalid admin login response');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={20} color={colors.textSecondary} />
        <Text style={styles.backButtonText}>Back to Student</Text>
      </TouchableOpacity>

      <AnimatedSlideUp style={styles.contentWrapper}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <ShieldAlert size={32} color={colors.accent} />
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Restricted access for staff and teachers.</Text>
        </View>
        
        <Card style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextField
            placeholder="Admin Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          <View style={styles.buttonContainer}>
            <Button 
              title="Secure Login" 
              onPress={handleAdminLogin} 
              loading={loading} 
            />
          </View>
        </Card>
      </AnimatedSlideUp>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  backButtonText: {
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.body2,
    fontWeight: '600'
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)', // accent with opacity
    padding: spacing.md,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.body1,
    color: colors.accent,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
    width: '100%'
  },
});
