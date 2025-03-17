import React, { useState } from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'exp://134.88.141.152:8083',
          data: {
            email: email,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          Alert.alert('Error', 'This email is already registered. Please sign in instead.');
          navigation.navigate('SignIn');
          return;
        }
        throw error;
      }

      if (data?.user) {
        console.log('Sign up response:', data);
        
        // Check if email confirmation is required
        if (data.session === null) {
          Alert.alert(
            'Verify Your Email',
            'A verification email has been sent to ' + email + '. Please check your inbox and spam folder.',
            [
              {
                text: 'Resend Email',
                onPress: async () => {
                  try {
                    const { error: resendError } = await supabase.auth.resend({
                      type: 'signup',
                      email: email,
                      options: {
                        emailRedirectTo: 'exp://134.88.141.152:8083'
                      }
                    });
                    if (resendError) throw resendError;
                    Alert.alert('Success', 'Verification email has been resent. Please check your inbox and spam folder.');
                  } catch (err: any) {
                    Alert.alert('Error', err.message || 'Failed to resend verification email');
                  }
                }
              },
              {
                text: 'OK',
                onPress: () => {
                  setEmail('');
                  setPassword('');
                  navigation.navigate('SignIn');
                }
              }
            ]
          );
        } else {
          // User was automatically confirmed
          Alert.alert(
            'Success',
            'Account created successfully!',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('SignIn')
              }
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Error', error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.form, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Create Account
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          mode="outlined"
          disabled={loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Sign Up
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('SignIn')}
          style={styles.linkButton}
          disabled={loading}
        >
          Already have an account? Sign In
        </Button>
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  form: {
    padding: 20,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 16,
  },
}); 