import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from '../utils/SecureStoreProxy';
import { AuthApi } from '@nermai/api';
import { useAuth } from '../core/auth/AuthProvider';
import { ShieldAlert } from 'lucide-react-native';
import { AnimatedSlideUp } from '../core/animations';
import { ScreenContainer, Button, TextField, Card } from '../components/ui';
import { colors, typography, spacing, radius } from '@nermai/theme';

export const LoginPage = ({ navigation }: { navigation: any }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkAuth } = useAuth();

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please enter both email/phone and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await AuthApi.login({
        identifier: identifier.trim(),
        password,
      });

      console.log('Login response:', response.status);
      console.log('Login data:', response.data);

      const token = response.data?.data?.token;
      if (token) {
        await SecureStore.setItemAsync('studentAccessToken', token);
        await SecureStore.deleteItemAsync('adminAccessToken');
        await checkAuth();
      } else {
        setError('Invalid login response');
      }
    } catch (err: any) {
      console.log('Login error:', err);
      console.log('Login error response status:', err.response?.status);
      setError(err.response?.data?.error || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <TouchableOpacity 
        style={styles.adminButton} 
        onPress={() => navigation.navigate('AdminLogin')}
      >
        <ShieldAlert size={20} color={colors.textSecondary} />
        <Text style={styles.adminButtonText}>Admin</Text>
      </TouchableOpacity>

      <AnimatedSlideUp style={styles.contentWrapper}>
        <View style={styles.header}>
          <Text style={styles.title}>Student Login</Text>
          <Text style={styles.subtitle}>Enter your details to access your learning portal.</Text>
        </View>

        <Card style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextField
            placeholder="Email or Phone Number"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <Button 
              title="Log In" 
              onPress={handleLogin} 
              loading={loading} 
            />
          </View>

          <TouchableOpacity 
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>New Student? <Text style={styles.registerHighlight}>Register Here</Text></Text>
          </TouchableOpacity>
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
  adminButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  adminButtonText: {
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontSize: typography.sizes.caption,
    fontWeight: '600'
  },
  header: {
    marginBottom: spacing.lg,
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
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body2,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  registerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body2,
  },
  registerHighlight: {
    color: colors.primary,
    fontWeight: 'bold',
  }
});
