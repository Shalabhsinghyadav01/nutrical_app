import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Switch, Button, Surface, TimeInput, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotifications } from '../context/NotificationsContext';
import { useTheme } from '../context/ThemeContext';

const DAYS = [
  { label: 'Sun', value: '0' },
  { label: 'Mon', value: '1' },
  { label: 'Tue', value: '2' },
  { label: 'Wed', value: '3' },
  { label: 'Thu', value: '4' },
  { label: 'Fri', value: '5' },
  { label: 'Sat', value: '6' },
];

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const { preferences, updatePreference, requestPermissions } = useNotifications();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate && selectedType) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const time = `${hours}:${minutes}`;
      
      const preference = preferences.find(p => p.type === selectedType) || {
        type: selectedType,
        enabled: true,
        days: [0, 1, 2, 3, 4, 5, 6],
        time: time,
        user_id: '',
      };

      updatePreference({
        ...preference,
        time,
      });
    }
  };

  const toggleNotification = (type: string, enabled: boolean) => {
    const preference = preferences.find(p => p.type === type) || {
      type,
      enabled,
      days: [0, 1, 2, 3, 4, 5, 6],
      time: '12:00',
      user_id: '',
    };

    updatePreference({
      ...preference,
      enabled,
    });
  };

  const toggleDay = (type: string, day: number) => {
    const preference = preferences.find(p => p.type === type) || {
      type,
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      time: '12:00',
      user_id: '',
    };

    const days = preference.days.includes(day)
      ? preference.days.filter(d => d !== day)
      : [...preference.days, day];

    updatePreference({
      ...preference,
      days,
    });
  };

  const renderNotificationSetting = (type: string, title: string) => {
    const preference = preferences.find(p => p.type === type) || {
      type,
      enabled: false,
      days: [],
      time: '12:00',
      user_id: '',
    };

    return (
      <Surface style={[styles.settingContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.settingHeader}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          <Switch
            value={preference.enabled}
            onValueChange={(enabled) => toggleNotification(type, enabled)}
          />
        </View>

        {preference.enabled && (
          <>
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedType(type);
                setShowTimePicker(true);
              }}
              style={styles.timeButton}
            >
              {preference.time || 'Set Time'}
            </Button>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
              {DAYS.map((day) => (
                <Button
                  key={day.value}
                  mode={preference.days.includes(Number(day.value)) ? 'contained' : 'outlined'}
                  onPress={() => toggleDay(type, Number(day.value))}
                  style={styles.dayButton}
                  compact
                >
                  {day.label}
                </Button>
              ))}
            </ScrollView>
          </>
        )}
      </Surface>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderNotificationSetting('breakfast', 'Breakfast Reminder')}
      {renderNotificationSetting('lunch', 'Lunch Reminder')}
      {renderNotificationSetting('dinner', 'Dinner Reminder')}
      {renderNotificationSetting('snack', 'Snack Reminder')}
      {renderNotificationSetting('water', 'Water Intake Reminder')}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  settingContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  timeButton: {
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayButton: {
    marginRight: 8,
    minWidth: 45,
  },
}); 