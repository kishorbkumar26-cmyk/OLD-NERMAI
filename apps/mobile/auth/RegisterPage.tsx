import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from '../utils/SecureStoreProxy';
import { AuthApi } from '@nermai/api';
import { useAuth } from '../core/auth/AuthProvider';
import { ScreenContainer, Button, TextField, Card } from '../components/ui';
import { colors, typography, spacing } from '@nermai/theme';

export const RegisterPage = ({ navigation }: { navigation: any }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkAuth } = useAuth();

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await AuthApi.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password
      });

      const loginResponse = await AuthApi.login({
        identifier: formData.email.trim(),
        password: formData.password
      });

      const token = loginResponse.data?.data?.token;
      if (token) {
        await SecureStore.setItemAsync('studentAccessToken', token);
        await checkAuth();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to{'\n'}NERMAI Academy</Text>
        <Text style={styles.subtitle}>Create your student account to start learning.</Text>
      </View>

      <Card style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextField
          placeholder="First Name"
          value={formData.firstName}
          onChangeText={(text) => setFormData({...formData, firstName: text})}
        />
        
        <TextField
          placeholder="Last Name"
          value={formData.lastName}
          onChangeText={(text) => setFormData({...formData, lastName: text})}
        />

        <TextField
          placeholder="Email Address"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextField
          placeholder="Phone Number (Optional)"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          keyboardType="phone-pad"
        />

        <TextField
          placeholder="Password"
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
          isPassword
        />

        <TextField
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
          isPassword
        />

        <View style={styles.buttonContainer}>
          <Button 
            title="Register" 
            onPress={handleRegister} 
            loading={loading} 
          />
        </View>

        <TouchableOpacity onPress={() => navigation?.navigate('Login')} style={styles.linkButton}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Log In</Text></Text>
        </TouchableOpacity>
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  card: {
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body2,
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: 'bold',
  }
});
