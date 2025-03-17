import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Surface, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.text }]}>Settings</Text>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
          
          <Pressable 
            style={styles.settingItem}
            onPress={toggleTheme}
          >
            <View style={styles.settingLeft}>
              <Ionicons 
                name={isDarkMode ? 'moon' : 'sunny'} 
                size={24} 
                color={theme.colors.primary} 
                style={styles.settingIcon}
              />
              <View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.subtext }]}>
                  Switch between light and dark themes
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
          </Pressable>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="information-circle" 
                size={24} 
                color={theme.colors.primary}
                style={styles.settingIcon}
              />
              <View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Version</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.subtext }]}>1.0.0</Text>
              </View>
            </View>
          </View>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    padding: 16,
  },
  section: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
}); 