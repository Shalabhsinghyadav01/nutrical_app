import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { saveNotificationPreference, getNotificationPreferences } from '../lib/supabase';

interface NotificationPreference {
  id?: string;
  user_id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'water';
  time: string; // HH:mm format
  enabled: boolean;
  days: number[]; // 0-6 for Sunday-Saturday
}

interface NotificationsContextType {
  preferences: NotificationPreference[];
  isLoading: boolean;
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (preference: NotificationPreference) => Promise<void>;
  updatePreference: (preference: NotificationPreference) => Promise<void>;
  toggleNotification: (type: string, enabled: boolean) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const prefs = await getNotificationPreferences(user.id);
      setPreferences(prefs || []);
      // Reschedule all enabled notifications
      prefs?.forEach(pref => {
        if (pref.enabled) {
          scheduleNotification(pref);
        }
      });
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return false;
      }
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const scheduleNotification = async (preference: NotificationPreference) => {
    if (!preference.enabled) return;

    const [hours, minutes] = preference.time.split(':').map(Number);
    
    // Cancel any existing notifications for this type
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const notificationId = `${preference.type}-${preference.user_id}`;
    const existing = existingNotifications.find(n => n.identifier === notificationId);
    if (existing) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    // Schedule new notification
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: `Time for ${preference.type}!`,
        body: `Don't forget to log your ${preference.type} in NutriCal.`,
        sound: true,
      },
      trigger: {
        hours,
        minutes,
        repeats: true,
        weekdays: preference.days,
      },
    });
  };

  const updatePreference = async (preference: NotificationPreference) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedPref = await saveNotificationPreference({
        ...preference,
        user_id: user.id,
      });
      
      setPreferences(prev => {
        const index = prev.findIndex(p => p.type === preference.type);
        if (index >= 0) {
          return [...prev.slice(0, index), updatedPref, ...prev.slice(index + 1)];
        }
        return [...prev, updatedPref];
      });

      if (updatedPref.enabled) {
        await scheduleNotification(updatedPref);
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotification = async (type: string, enabled: boolean) => {
    const preference = preferences.find(p => p.type === type);
    if (preference) {
      await updatePreference({ ...preference, enabled });
    }
  };

  return (
    <NotificationsContext.Provider 
      value={{ 
        preferences, 
        isLoading, 
        requestPermissions, 
        scheduleNotification, 
        updatePreference,
        toggleNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
} 