import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getNotifications, markNotificationAsRead, getCurrentUser } from '../lib/supabase';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setError('Please log in to view notifications');
        setLoading(false);
        return;
      }

      const notificationsData = await getNotifications(user.id);
      setNotifications(notificationsData);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        // Update the local state to reflect the change
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
  };

  const renderNotification = (notification) => (
    <Surface 
      key={notification.id} 
      style={[
        styles.notificationCard, 
        { backgroundColor: theme.colors.surface },
        !notification.read && [
          styles.unreadCard,
          { borderLeftColor: theme.colors.primary }
        ]
      ]} 
      elevation={1}
      onTouchEnd={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
          {notification.title}
        </Text>
        <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
          {notification.message}
        </Text>
        <Text style={[styles.notificationTime, { color: theme.colors.textSecondary, opacity: 0.7 }]}>
          {new Date(notification.created_at).toRelative()}
        </Text>
      </View>
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
      )}
    </Surface>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      edges={['top']}
    >
      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <Text 
            variant="headlineLarge" 
            style={[styles.title, { color: theme.colors.text }]}
          >
            Notifications
          </Text>
          <Text 
            variant="bodyLarge" 
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Stay updated with your nutrition journey
          </Text>
        </View>
        
        <View style={styles.notificationsContainer}>
          {notifications.length > 0 ? (
            notifications.map(renderNotification)
          ) : (
            <Text 
              style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}
            >
              No notifications yet
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  notificationsContainer: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCard: {
    borderLeftWidth: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
  },
}); 