import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Switch, Button, Surface, Divider, useTheme, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { signOut } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { signOut: authSignOut } = useAuth();
  const { userProfile } = useUser();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await authSignOut();
              // Navigation will be handled by the auth state change listener
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon, title, onPress }) => (
    <TouchableRipple onPress={onPress}>
      <Surface style={styles.settingItem}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
        <Text style={styles.settingText}>{title}</Text>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.outline} />
      </Surface>
    </TouchableRipple>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>Settings</Text>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>Account</List.Subheader>
            <List.Item
              title="Profile"
              description={userProfile?.email}
              left={props => <List.Icon {...props} icon="account" />}
              onPress={() => navigation.navigate('Profile')}
            />
            <Divider />
            <List.Item
              title="Notifications"
              left={props => <List.Icon {...props} icon="bell" />}
              onPress={() => navigation.navigate('Notifications')}
            />
          </List.Section>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>Appearance</List.Subheader>
            <List.Item
              title="Dark Mode"
              left={props => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={theme.isDarkMode}
                  onValueChange={theme.toggleTheme}
                  color={theme.colors.primary}
                />
              )}
            />
          </List.Section>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>About</List.Subheader>
            <List.Item
              title="Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              left={props => <List.Icon {...props} icon="shield-account" />}
              onPress={() => {/* Handle privacy policy */}}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              left={props => <List.Icon {...props} icon="file-document" />}
              onPress={() => {/* Handle terms of service */}}
            />
          </List.Section>
        </Surface>

        <View style={styles.logoutContainer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
            contentStyle={styles.logoutButtonContent}
          >
            Logout
          </Button>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Preferences</Text>
          <SettingItem
            icon="notifications-outline"
            title="Notification Settings"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Account</Text>
          <SettingItem
            icon="person-outline"
            title="Profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={authSignOut}
          />
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutContainer: {
    padding: 16,
    marginBottom: 32,
  },
  logoutButton: {
    borderRadius: 12,
  },
  logoutButtonContent: {
    paddingVertical: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 0.7,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginVertical: 1,
  },
  settingText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
});

export default SettingsScreen; 